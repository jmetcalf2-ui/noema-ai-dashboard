import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  dataFiles, analyses, 
  type DataFile, type InsertDataFile, 
  type Analysis, type InsertAnalysis 
} from "@shared/schema";

export interface IStorage {
  // Files
  createFile(file: InsertDataFile): Promise<DataFile>;
  getFile(id: number): Promise<DataFile | undefined>;
  getUserFiles(userId: string): Promise<DataFile[]>;
  
  // Analyses
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
  deleteAnalysis(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createFile(file: InsertDataFile): Promise<DataFile> {
    const [newFile] = await db.insert(dataFiles).values(file).returning();
    return newFile;
  }

  async getFile(id: number): Promise<DataFile | undefined> {
    const [file] = await db.select().from(dataFiles).where(eq(dataFiles.id, id));
    return file;
  }

  async getUserFiles(userId: string): Promise<DataFile[]> {
    return db
      .select()
      .from(dataFiles)
      .where(eq(dataFiles.userId, userId))
      .orderBy(desc(dataFiles.createdAt));
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [newAnalysis] = await db.insert(analyses).values(analysis).returning();
    return newAnalysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  async deleteAnalysis(id: number): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }
}

export const storage = new DatabaseStorage();
