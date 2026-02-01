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

export const analysesRelations = relations(analyses, ({ one }) => ({
  file: one(dataFiles, {
    fields: [analyses.fileId],
    references: [dataFiles.id],
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

export type DataFile = typeof dataFiles.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
