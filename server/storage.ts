import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, desc, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Company, 
  InsertCompany, 
  Project, 
  InsertProject,
  DigitalAudit,
  InsertDigitalAudit,
  AccessRequest,
  InsertAccessRequest,
  RenderingReport,
  InsertRenderingReport
} from "@shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

  // Company methods
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  getCompaniesByType(type: string): Promise<Company[]>;
  getCompaniesByParent(parentId: string): Promise<Company[]>;

  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  getProjectsByClient(clientCompanyId: string): Promise<Project[]>;
  getUserProjects(userId: string): Promise<Project[]>;

  // Digital Audit methods
  getDigitalAudit(id: string): Promise<DigitalAudit | undefined>;
  createDigitalAudit(audit: InsertDigitalAudit): Promise<DigitalAudit>;
  updateDigitalAudit(id: string, updates: Partial<InsertDigitalAudit>): Promise<DigitalAudit | undefined>;
  getAuditsByClient(clientCompanyId: string): Promise<DigitalAudit[]>;

  // Access Request methods
  getAccessRequest(id: string): Promise<AccessRequest | undefined>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined>;
  getPendingAccessRequests(): Promise<AccessRequest[]>;

  // Permission methods
  canUserAccessProject(userId: string, projectId: string): Promise<boolean>;
  canUserAccessCompany(userId: string, companyId: string): Promise<boolean>;

  // Audit logging
  logActivity(userId: string, action: string, resourceType?: string, resourceId?: string, details?: any): Promise<void>;

  // Rendering Report methods
  getRenderingReport(id: string): Promise<RenderingReport | undefined>;
  getRenderingReportByCompany(companyId: string): Promise<RenderingReport | undefined>;
  getRenderingReports(): Promise<RenderingReport[]>;
  createRenderingReport(report: InsertRenderingReport): Promise<RenderingReport>;
  updateRenderingReport(id: string, updates: Partial<InsertRenderingReport>): Promise<RenderingReport | undefined>;
  deleteRenderingReport(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return result.length > 0;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.companyId, companyId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(asc(schema.users.email));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(schema.companies).where(eq(schema.companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(schema.companies).values(company).returning();
    return result[0];
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(schema.companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.companies.id, id))
      .returning();
    return result[0];
  }

  async getCompaniesByType(type: string): Promise<Company[]> {
    return await db.select().from(schema.companies).where(eq(schema.companies.type, type as any));
  }

  async getCompaniesByParent(parentId: string): Promise<Company[]> {
    return await db.select().from(schema.companies).where(eq(schema.companies.parentId, parentId));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(schema.projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(schema.projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning();
    return result[0];
  }

  async getProjectsByClient(clientCompanyId: string): Promise<Project[]> {
    return await db.select().from(schema.projects)
      .where(eq(schema.projects.clientCompanyId, clientCompanyId))
      .orderBy(desc(schema.projects.createdAt));
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    // Get user's company and role to determine accessible projects
    const user = await this.getUser(userId);
    if (!user) return [];

    const userCompany = await this.getCompany(user.companyId);
    if (!userCompany) return [];

    // Owner company can see all projects
    if (userCompany.type === 'owner') {
      return await db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt));
    }

    // Client companies can see their own projects
    if (userCompany.type === 'client') {
      return await this.getProjectsByClient(user.companyId);
    }

    // Partner companies need explicit project access
    const accessibleProjects = await db.select({
      project: schema.projects
    }).from(schema.projects)
    .innerJoin(schema.projectAccess, eq(schema.projects.id, schema.projectAccess.projectId))
    .where(
      or(
        eq(schema.projectAccess.userId, userId),
        eq(schema.projectAccess.companyId, user.companyId)
      )
    )
    .orderBy(desc(schema.projects.createdAt));

    return accessibleProjects.map(ap => ap.project);
  }

  async getDigitalAudit(id: string): Promise<DigitalAudit | undefined> {
    const result = await db.select().from(schema.digitalAudits).where(eq(schema.digitalAudits.id, id)).limit(1);
    return result[0];
  }

  async createDigitalAudit(audit: InsertDigitalAudit): Promise<DigitalAudit> {
    const result = await db.insert(schema.digitalAudits).values(audit).returning();
    return result[0];
  }

  async updateDigitalAudit(id: string, updates: Partial<InsertDigitalAudit>): Promise<DigitalAudit | undefined> {
    const result = await db.update(schema.digitalAudits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.digitalAudits.id, id))
      .returning();
    return result[0];
  }

  async getAuditsByClient(clientCompanyId: string): Promise<DigitalAudit[]> {
    return await db.select().from(schema.digitalAudits)
      .where(eq(schema.digitalAudits.clientCompanyId, clientCompanyId))
      .orderBy(desc(schema.digitalAudits.createdAt));
  }

  async getAccessRequest(id: string): Promise<AccessRequest | undefined> {
    const result = await db.select().from(schema.accessRequests).where(eq(schema.accessRequests.id, id)).limit(1);
    return result[0];
  }

  async createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest> {
    const result = await db.insert(schema.accessRequests).values(request).returning();
    return result[0];
  }

  async updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const result = await db.update(schema.accessRequests)
      .set(updates)
      .where(eq(schema.accessRequests.id, id))
      .returning();
    return result[0];
  }

  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    return await db.select().from(schema.accessRequests)
      .where(eq(schema.accessRequests.status, 'pending'))
      .orderBy(desc(schema.accessRequests.createdAt));
  }

  async canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const userCompany = await this.getCompany(user.companyId);
    if (!userCompany) return false;

    // Owner company can access all projects
    if (userCompany.type === 'owner') {
      return true;
    }

    const project = await this.getProject(projectId);
    if (!project) return false;

    // Client can access their own projects
    if (userCompany.type === 'client' && project.clientCompanyId === user.companyId) {
      return true;
    }

    // Check explicit project access
    const access = await db.select().from(schema.projectAccess)
      .where(
        and(
          eq(schema.projectAccess.projectId, projectId),
          or(
            eq(schema.projectAccess.userId, userId),
            eq(schema.projectAccess.companyId, user.companyId)
          )
        )
      ).limit(1);

    return access.length > 0;
  }

  async canUserAccessCompany(userId: string, companyId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const userCompany = await this.getCompany(user.companyId);
    if (!userCompany) return false;

    // Owner company can access all companies
    if (userCompany.type === 'owner') {
      return true;
    }

    // Users can access their own company
    if (user.companyId === companyId) {
      return true;
    }

    // Check if it's a sub-company
    const targetCompany = await this.getCompany(companyId);
    if (targetCompany && targetCompany.parentId === user.companyId) {
      return true;
    }

    return false;
  }

  async logActivity(userId: string, action: string, resourceType?: string, resourceId?: string, details?: any): Promise<void> {
    await db.insert(schema.auditLog).values({
      userId,
      action,
      resourceType,
      resourceId,
      details
    });
  }

  // Rendering Report methods
  async getRenderingReport(id: string): Promise<RenderingReport | undefined> {
    const result = await db.select().from(schema.renderingReports).where(eq(schema.renderingReports.id, id)).limit(1);
    return result[0];
  }

  async getRenderingReportByCompany(companyId: string): Promise<RenderingReport | undefined> {
    const result = await db.select().from(schema.renderingReports)
      .where(eq(schema.renderingReports.companyId, companyId))
      .orderBy(desc(schema.renderingReports.createdAt))
      .limit(1);
    return result[0];
  }

  async getRenderingReports(): Promise<RenderingReport[]> {
    return await db.select().from(schema.renderingReports)
      .orderBy(desc(schema.renderingReports.createdAt));
  }

  async createRenderingReport(report: InsertRenderingReport): Promise<RenderingReport> {
    const result = await db.insert(schema.renderingReports).values(report).returning();
    return result[0];
  }

  async updateRenderingReport(id: string, updates: Partial<InsertRenderingReport>): Promise<RenderingReport | undefined> {
    const result = await db.update(schema.renderingReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.renderingReports.id, id))
      .returning();
    return result[0];
  }

  async deleteRenderingReport(id: string): Promise<boolean> {
    const result = await db.delete(schema.renderingReports)
      .where(eq(schema.renderingReports.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
