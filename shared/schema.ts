import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";
export * from "./models/chat";

export const dataFiles = pgTable("data_files", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // From Replit Auth (string ID)
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  content: text("content"), // Store CSV content directly for MVP if small enough, or URL
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => dataFiles.id),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  charts: jsonb("charts").$type<any[]>().notNull(), // Array of Recharts configs
  insights: jsonb("insights").$type<string[]>().notNull(), // Array of text insights
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataFilesRelations = relations(dataFiles, ({ many }) => ({
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  file: one(dataFiles, {
    fields: [analyses.fileId],
    references: [dataFiles.id],
  }),
  projectAnalyses: many(projectAnalyses),
}));

// Projects table - groups analyses together for cross-analysis insights
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  summary: text("summary"), // AI-generated cross-analysis summary
  insights: jsonb("insights").$type<string[]>(), // AI-generated cross-analysis insights
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for project-analysis many-to-many relationship
export const projectAnalyses = pgTable("project_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  analysisId: integer("analysis_id").notNull().references(() => analyses.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  projectAnalyses: many(projectAnalyses),
}));

export const projectAnalysesRelations = relations(projectAnalyses, ({ one }) => ({
  project: one(projects, {
    fields: [projectAnalyses.projectId],
    references: [projects.id],
  }),
  analysis: one(analyses, {
    fields: [projectAnalyses.analysisId],
    references: [analyses.id],
  }),
}));

export const insertDataFileSchema = createInsertSchema(dataFiles).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  userId: true,
  createdAt: true,
  updatedAt: true,
  summary: true,
  insights: true,
});

export const insertProjectAnalysisSchema = createInsertSchema(projectAnalyses).omit({ 
  id: true, 
  addedAt: true 
});

export type DataFile = typeof dataFiles.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectAnalysis = typeof projectAnalyses.$inferSelect;
export type InsertProjectAnalysis = z.infer<typeof insertProjectAnalysisSchema>;
