import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import { openai } from "./replit_integrations/image/client";
import { generateVizPlan } from "./lib/viz/planner";
import { computeDatasetComplexity, computeInsightBudget } from "@shared/insights";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";

// Convert Excel/CSV file buffer to CSV string
function parseFileToCSV(buffer: Buffer, filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'csv') {
    return buffer.toString('utf-8');
  }
  
  // Parse Excel file (xlsx, xls)
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(worksheet);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
});

const FREE_TIER_LIMITS = {
  maxFiles: 3,
  maxAnalyses: 5,
};

async function checkSubscriptionStatus(userId: string): Promise<{ isPro: boolean; status: string | null }> {
  try {
    const user = await stripeService.getUser(userId);
    const status = user?.subscriptionStatus;
    const isPro = status === 'active' || status === 'trialing';
    return { isPro, status };
  } catch (e) {
    console.error("Error checking subscription:", e);
    return { isPro: false, status: null };
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Files API ---

  app.post(api.files.upload.path, upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const userId = (req.user as any).claims.sub;
      
      const { isPro } = await checkSubscriptionStatus(userId);
      if (!isPro) {
        const existingFiles = await storage.getUserFiles(userId);
        if (existingFiles.length >= FREE_TIER_LIMITS.maxFiles) {
          return res.status(403).json({ 
            message: `Free plan is limited to ${FREE_TIER_LIMITS.maxFiles} files. Upgrade to Pro for unlimited uploads.`,
            code: "LIMIT_REACHED",
            limit: FREE_TIER_LIMITS.maxFiles
          });
        }
      }

      // Parse Excel/CSV files to CSV format
      const content = parseFileToCSV(req.file.buffer, req.file.originalname);

      const file = await storage.createFile({
        userId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileUrl: "stored_in_db",
        content: content,
      });

      res.status(201).json(file);
    } catch (e) {
      console.error("Upload error:", e);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get(api.files.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const files = await storage.getUserFiles(userId);
    res.json(files);
  });

  app.get(api.files.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const fileId = parseInt(String(req.params.id));
    const file = await storage.getFile(fileId);

    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    res.json(file);
  });

  // --- Analysis API ---

  app.post(api.analyses.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { fileId } = api.analyses.create.input.parse(req.body);
      const file = await storage.getFile(fileId);
      const userId = (req.user as any).claims.sub;

      if (!file) return res.status(404).json({ message: "File not found" });
      if (file.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const { isPro } = await checkSubscriptionStatus(userId);
      if (!isPro) {
        const existingAnalyses = await storage.getUserAnalyses(userId);
        if (existingAnalyses.length >= FREE_TIER_LIMITS.maxAnalyses) {
          return res.status(403).json({ 
            message: `Free plan is limited to ${FREE_TIER_LIMITS.maxAnalyses} analyses. Upgrade to Pro for unlimited analyses.`,
            code: "LIMIT_REACHED",
            limit: FREE_TIER_LIMITS.maxAnalyses
          });
        }
      }

      // Parse CSV to compute complexity and insight budget
      const csvContent = file.content || "";
      const lines = csvContent.split("\n").filter(l => l.trim());
      const headers = lines[0]?.split(",").map(h => h.trim().replace(/^"|"$/g, "")) || [];
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(",");
        const row: Record<string, any> = {};
        headers.forEach((h, i) => {
          const val = values[i]?.trim().replace(/^"|"$/g, "") || "";
          row[h] = isNaN(Number(val)) ? val : Number(val);
        });
        return row;
      }).filter(row => Object.keys(row).length > 0).slice(0, 5000);

      // Basic profiling for complexity calculation
      const numericColumns: string[] = [];
      const categoricalColumns: string[] = [];
      const datetimeColumns: string[] = [];
      
      for (const h of headers) {
        const vals = dataRows.map(r => r[h]).filter(v => v !== null && v !== undefined && v !== "");
        const isNumeric = vals.length > 0 && vals.every(v => !isNaN(Number(v)));
        const isDate = vals.length > 0 && vals.every(v => !isNaN(Date.parse(String(v))) && isNaN(Number(v)));
        const uniqueCount = new Set(vals.map(String)).size;
        
        if (isNumeric) numericColumns.push(h);
        else if (isDate) datetimeColumns.push(h);
        else if (uniqueCount < dataRows.length * 0.2 || uniqueCount < 20) categoricalColumns.push(h);
      }

      // Compute dataset complexity and insight budget
      const simpleProfile = {
        rowCount: dataRows.length,
        columns: headers.map(h => ({ name: h, inferredType: "text" as const, missingRate: 0, uniqueCount: 0, examples: [] })),
        numericColumns,
        categoricalColumns,
        datetimeColumns,
        geoColumns: [],
        idColumns: [],
        warnings: []
      };
      
      const complexity = computeDatasetComplexity(simpleProfile);
      const budget = computeInsightBudget(complexity);
      const insightCount = Math.min(budget.target, 24);

      console.log(`Dataset complexity: ${complexity.level} (score: ${complexity.score.toFixed(1)}), insight budget: ${insightCount}`);

      // AI Analysis with adaptive insight budget
      const prompt = `
You are a senior data analyst. Analyze this CSV dataset and generate comprehensive insights and visualizations.

Dataset: ${file.fileName}
Rows: ${dataRows.length}
Columns: ${headers.join(", ")}
Numeric columns: ${numericColumns.join(", ") || "none"}
Categorical columns: ${categoricalColumns.join(", ") || "none"}
Datetime columns: ${datetimeColumns.join(", ") || "none"}

CSV Content (first ~15000 chars):
${file.content?.slice(0, 15000)}

DATASET COMPLEXITY: ${complexity.level.toUpperCase()} (score: ${complexity.score.toFixed(1)})
TARGET INSIGHT COUNT: ${insightCount}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of what this data represents and key takeaways",
  "insights": [
    {
      "id": "insight_1",
      "family": "distribution|outlier|missingness|correlation|category_driver|time_dynamics|data_quality|uncertainty",
      "title": "Brief insight title",
      "narrative": "Detailed explanation of the insight with specific numbers and context",
      "whyItMatters": "Business/analytical relevance of this finding",
      "fieldsUsed": ["column1", "column2"],
      "importance": "critical|high|medium|low",
      "confidence": "high|medium|low"
    }
  ],
  "charts": [
    {
      "type": "bar|line|pie|area",
      "title": "Chart Title",
      "categoryKey": "CategoryFieldName",
      "dataKey": "NumericFieldName", 
      "data": [{"CategoryFieldName": "value", "NumericFieldName": 123}, ...]
    }
  ]
}

INSIGHT FAMILY RULES - Generate insights across MULTIPLE families:
- "distribution": Shape of numeric columns (skewness, spread, zeros, bimodality)
- "outlier": Extreme values with context on their impact
- "missingness": Missing data patterns and implications
- "correlation": Relationships between numeric columns
- "category_driver": How categories affect numeric outcomes
- "time_dynamics": Trends, seasonality, volatility over time
- "data_quality": Data issues (constants, duplicates, type mismatches)
- "uncertainty": Confidence intervals, prediction bounds if present

DIVERSITY REQUIREMENTS:
1. Generate EXACTLY ${insightCount} insights
2. Cover at least 4 different insight families
3. No two consecutive insights from the same family
4. Each insight must answer a different analytical question
5. Prioritize high-impact findings first

CHART TYPE SELECTION RULES:
- "bar": Use for comparing categories. Best for discrete categories.
- "pie": Use ONLY for parts of a whole. Max 6-8 slices.
- "line": Use for trends over time. Requires ordered x-axis.
- "area": Use for cumulative totals or magnitude emphasis.

Generate 2-4 charts that visualize the most important patterns.
      `;

      console.log("Starting AI analysis for file:", file.id);

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using a more standard model name if gpt-5.1 is causing issues, though system says it's configured
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0].message.content || "{}";
      console.log("AI Response received:", rawContent);

      const result = JSON.parse(rawContent);

      // Process insights - handle both old format (strings) and new format (objects)
      let processedInsights = result.insights || [];
      if (processedInsights.length > 0 && typeof processedInsights[0] === "string") {
        // Convert old string format to new object format
        processedInsights = processedInsights.map((text: string, idx: number) => ({
          id: `insight_${idx + 1}`,
          family: "distribution" as const,
          title: text.slice(0, 100),
          narrative: text,
          whyItMatters: "This finding highlights a notable pattern in your data.",
          fieldsUsed: [],
          importance: "medium" as const,
          confidence: "medium" as const
        }));
      }

      const analysis = await storage.createAnalysis({
        fileId,
        userId,
        title: `Analysis: ${file.fileName}`,
        summary: result.summary || "Analysis generated successfully.",
        insights: processedInsights,
        charts: result.charts || [],
      });

      // Add complexity metadata to response
      const responseData = {
        ...analysis,
        complexity: {
          level: complexity.level,
          score: complexity.score
        },
        fingerprint: {
          rowCount: dataRows.length,
          columnCount: headers.length,
          numericCount: numericColumns.length,
          categoricalCount: categoricalColumns.length,
          datetimeCount: datetimeColumns.length
        }
      };

      res.status(201).json(responseData);

    } catch (e) {
      console.error("Analysis error:", e);
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: e.errors });
      } else {
        res.status(500).json({ message: "Failed to generate analysis" });
      }
    }
  });

  app.get(api.analyses.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const analyses = await storage.getUserAnalyses(userId);
    res.json(analyses);
  });

  app.get(api.analyses.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(String(req.params.id));
    const analysis = await storage.getAnalysis(id);

    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (analysis.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    res.json(analysis);
  });

  app.delete(api.analyses.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(String(req.params.id));
    const analysis = await storage.getAnalysis(id);

    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (analysis.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteAnalysis(id);
    res.sendStatus(204);
  });

  // --- Data Chat API (SSE streaming) ---
  app.post("/api/chat/data-analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { analysisId, message, context, history } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const systemPrompt = `You are a helpful data analyst assistant. You're analyzing a dataset.

Analysis Title: ${analysis.title}
Summary: ${analysis.summary}
Key Insights: ${JSON.stringify(analysis.insights)}
Available Charts: ${JSON.stringify(analysis.charts?.map((c: any) => ({ type: c.type, title: c.title })))}

Additional Context: ${context || 'No additional context'}

Help the user understand their data better. Be concise, specific, and provide actionable insights. Use plain language. Format responses with bullet points when listing multiple items.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(history || []).map((h: any) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: message },
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_completion_tokens: 1024,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Chat failed" });
    }
  });

  // --- Projects API ---

  app.post(api.projects.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const input = api.projects.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const project = await storage.createProject({
        ...input,
        userId,
      });

      res.status(201).json(project);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: e.errors });
      } else {
        console.error("Create project error:", e);
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  });

  app.get(api.projects.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const projects = await storage.getUserProjects(userId);
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(String(req.params.id));
    const project = await storage.getProject(id);

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    res.json(project);
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(String(req.params.id));
    const project = await storage.getProject(id);

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteProject(id);
    res.sendStatus(204);
  });

  app.post(api.projects.addAnalysis.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const projectId = parseInt(String(req.params.id));
      const { analysisId } = api.projects.addAnalysis.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) return res.status(404).json({ message: "Analysis not found" });
      if (analysis.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      await storage.addAnalysisToProject(projectId, analysisId);
      res.status(201).json({ message: "Analysis added to project" });
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: e.errors });
      } else {
        console.error("Add analysis to project error:", e);
        res.status(500).json({ message: "Failed to add analysis" });
      }
    }
  });

  app.delete(api.projects.removeAnalysis.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const projectId = parseInt(String(req.params.id));
    const analysisId = parseInt(String(req.params.analysisId));
    const userId = (req.user as any).claims.sub;

    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    await storage.removeAnalysisFromProject(projectId, analysisId);
    res.sendStatus(204);
  });

  app.get(api.projects.getAnalyses.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const projectId = parseInt(String(req.params.id));
    const userId = (req.user as any).claims.sub;

    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    const analyses = await storage.getProjectAnalyses(projectId);
    res.json(analyses);
  });

  // Generate AI insights across all analyses in a project
  app.post(api.projects.generateInsights.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const projectId = parseInt(String(req.params.id));
      const userId = (req.user as any).claims.sub;

      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.userId !== userId) return res.status(403).json({ message: "Forbidden" });

      const analyses = await storage.getProjectAnalyses(projectId);

      if (analyses.length === 0) {
        return res.status(400).json({ message: "Project has no analyses to generate insights from" });
      }

      // Compile all analysis data for AI
      const analysisData = analyses.map(a => ({
        title: a.title,
        summary: a.summary,
        insights: a.insights,
        charts: a.charts?.map((c: any) => ({ type: c.type, title: c.title })),
      }));

      const prompt = `
You are a senior data analyst. Analyze multiple datasets together and find cross-cutting insights.

Project Name: ${project.name}
Project Description: ${project.description || 'No description provided'}

Here are the individual analyses:
${JSON.stringify(analysisData, null, 2)}

Your task:
1. Find patterns and connections ACROSS these different analyses
2. Identify actionable recommendations based on the combined data
3. Highlight any contradictions or interesting comparisons between datasets

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary synthesizing all the data together",
  "insights": [
    "Cross-cutting insight 1 that connects multiple analyses",
    "Cross-cutting insight 2",
    "Cross-cutting insight 3",
    "Actionable recommendation based on combined data"
  ]
}

Focus on insights that would NOT be visible from looking at individual analyses alone.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(rawContent);

      const updatedProject = await storage.updateProject(projectId, {
        summary: result.summary || "Insights generated successfully.",
        insights: result.insights || [],
      });

      res.json(updatedProject);
    } catch (e) {
      console.error("Generate project insights error:", e);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // --- Get file content for analysis ---
  app.get("/api/analyses/:id/data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const analysisId = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(analysisId);

    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (analysis.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    const file = await storage.getFile(analysis.fileId);
    if (!file || !file.content) {
      return res.status(404).json({ message: "File data not found" });
    }

    // Parse CSV to JSON
    const lines = file.content.split("\n").filter(l => l.trim());
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce((obj, header, i) => {
        const val = values[i] || "";
        const num = parseFloat(val);
        obj[header] = isNaN(num) ? val : num;
        return obj;
      }, {} as Record<string, any>);
    });

    res.json({ headers, rows: rows.slice(0, 500) }); // Limit to 500 rows for performance
  });

  // --- Visualization Plan API ---
  app.post("/api/viz/plan", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      // Basic validation - in production use Zod schema for full request
      const body = req.body;
      if (!body.datasetProfile || !body.rowsSample) {
        return res.status(400).json({ message: "Missing datasetProfile or rowsSample" });
      }

      const plan = generateVizPlan(body);
      res.json({ plan });
    } catch (e) {
      console.error("Viz Plan error:", e);
      res.status(500).json({ message: "Failed to generate visualization plan" });
    }
  });

  // --- Stripe API ---

  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (e) {
      console.error("Stripe config error:", e);
      res.status(500).json({ message: "Failed to get Stripe config" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }
      res.json({ data: Array.from(productsMap.values()) });
    } catch (e) {
      console.error("Products error:", e);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.get("/api/stripe/subscription", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const userId = (req.user as any).claims.sub;
      const user = await stripeService.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null, status: null });
      }

      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ 
        subscription, 
        status: user.subscriptionStatus || (subscription as any)?.status 
      });
    } catch (e) {
      console.error("Subscription error:", e);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  app.post("/api/stripe/checkout", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { priceId } = req.body;
      if (!priceId) return res.status(400).json({ message: "Price ID required" });

      const userId = (req.user as any).claims.sub;
      const user = await stripeService.getUser(userId);

      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user?.email || '', userId);
        await stripeService.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${req.protocol}://${req.get('host')}/checkout/success`,
        `${req.protocol}://${req.get('host')}/pricing`
      );

      res.json({ url: session.url });
    } catch (e) {
      console.error("Checkout error:", e);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/portal", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const userId = (req.user as any).claims.sub;
      const user = await stripeService.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${req.protocol}://${req.get('host')}/`
      );

      res.json({ url: session.url });
    } catch (e) {
      console.error("Portal error:", e);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  return httpServer;
}
