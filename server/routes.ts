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
    const fileId = parseInt(req.params.id);
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
        You are a data analyst. Analyze this dataset (CSV content below).
        Dataset Name: ${file.fileName}
        
        CSV Content (truncated to first ~100 lines if too long):
        ${file.content?.slice(0, 15000)}
        
        Provide the following in JSON format:
        1. "summary": A professional executive summary of what this data represents (2-3 sentences).
        2. "insights": An array of 3-5 key actionable insights or trends found in the data.
        3. "charts": An array of 2-3 chart configurations to visualize interesting trends. 
           Each chart object must have:
           - "type": "bar", "line", "area", or "pie"
           - "title": string description of the chart
           - "xAxisKey": string (the key for the X axis, usually a name or date column)
           - "dataKey": string (the key for the numerical value to plot)
           - "data": array of objects with keys corresponding to xAxisKey and dataKey. LIMIT to 20 data points maximum for readability. Aggregating data if necessary.
        
        Ensure the JSON is valid.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

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
    const id = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(id);
    
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (analysis.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });
    
    res.json(analysis);
  });

  app.delete(api.analyses.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(id);

    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (analysis.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteAnalysis(id);
    res.sendStatus(204);
  });

  return httpServer;
}
