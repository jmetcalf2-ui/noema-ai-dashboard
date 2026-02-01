import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { 
  dataFiles, analyses, projects, projectAnalyses,
  type DataFile, type InsertDataFile, 
  type Analysis, type InsertAnalysis,
  type Project, type InsertProject,
  type ProjectAnalysis, type InsertProjectAnalysis
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

  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Project-Analysis associations
  addAnalysisToProject(projectId: number, analysisId: number): Promise<ProjectAnalysis>;
  removeAnalysisFromProject(projectId: number, analysisId: number): Promise<void>;
  getProjectAnalyses(projectId: number): Promise<Analysis[]>;
  getAnalysisProjects(analysisId: number): Promise<Project[]>;
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

  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project-Analysis associations
  async addAnalysisToProject(projectId: number, analysisId: number): Promise<ProjectAnalysis> {
    const [association] = await db
      .insert(projectAnalyses)
      .values({ projectId, analysisId })
      .returning();
    return association;
  }

  async removeAnalysisFromProject(projectId: number, analysisId: number): Promise<void> {
    await db
      .delete(projectAnalyses)
      .where(
        and(
          eq(projectAnalyses.projectId, projectId),
          eq(projectAnalyses.analysisId, analysisId)
        )
      );
  }

  async getProjectAnalyses(projectId: number): Promise<Analysis[]> {
    const associations = await db
      .select({ analysisId: projectAnalyses.analysisId })
      .from(projectAnalyses)
      .where(eq(projectAnalyses.projectId, projectId));

    if (associations.length === 0) return [];

    const analysisIds = associations.map(a => a.analysisId);
    return db
      .select()
      .from(analyses)
      .where(inArray(analyses.id, analysisIds))
      .orderBy(desc(analyses.createdAt));
  }

  async getAnalysisProjects(analysisId: number): Promise<Project[]> {
    const associations = await db
      .select({ projectId: projectAnalyses.projectId })
      .from(projectAnalyses)
      .where(eq(projectAnalyses.analysisId, analysisId));

    if (associations.length === 0) return [];

    const projectIds = associations.map(a => a.projectId);
    return db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds))
      .orderBy(desc(projects.createdAt));
  }
}

export const storage = new DatabaseStorage();
