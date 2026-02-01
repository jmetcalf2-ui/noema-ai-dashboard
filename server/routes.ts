import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { openai } from "./replit_integrations/image/client"; 

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Files API ---

  app.post(api.files.upload.path, upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      // For MVP, assume text-based file (CSV)
      const content = req.file.buffer.toString("utf-8");
      const userId = (req.user as any).claims.sub;

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

      // AI Analysis
      const prompt = `
You are a data analyst. Analyze this CSV dataset and generate visualizations.

Dataset: ${file.fileName}
CSV Content (first ~15000 chars):
${file.content?.slice(0, 15000)}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of what this data represents",
  "insights": ["insight 1", "insight 2", "insight 3"],
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

CHART TYPE SELECTION RULES:
- "bar": Use for comparing categories (e.g., counts by type, totals by region). Best for discrete categories.
- "pie": Use ONLY for showing parts of a whole (percentages/proportions). Max 6-8 slices.
- "line": Use for trends over time or continuous data. Requires ordered x-axis values.
- "area": Use for cumulative totals or trends with emphasis on magnitude.

CRITICAL REQUIREMENTS:
1. Each chart MUST have: type, title, categoryKey, dataKey, and data array
2. "categoryKey" is the field name for labels/categories (x-axis or pie slices)
3. "dataKey" is the field name for numeric values (y-axis or pie values)
4. data array: Each object must have keys matching categoryKey and dataKey exactly
5. Maximum 15 data points per chart. Aggregate if needed.
6. insights must be plain strings, not objects

Generate 2-3 charts that best visualize the most interesting patterns in this data.
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

      const analysis = await storage.createAnalysis({
        fileId,
        userId,
        title: `Analysis: ${file.fileName}`,
        summary: result.summary || "Analysis generated successfully.",
        insights: result.insights || [],
        charts: result.charts || [],
      });

      res.status(201).json(analysis);

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

  return httpServer;
}
