import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, boolean, jsonb, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const companyTypeEnum = pgEnum('company_type', ['owner', 'partner', 'client', 'sub']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'client', 'partner']);
export const accessLevelEnum = pgEnum('access_level', ['edit', 'view']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed', 'archived', 'draft']);
export const auditStatusEnum = pgEnum('audit_status', ['draft', 'review', 'published', 'archived']);
export const accessTypeEnum = pgEnum('access_type', ['permanent', 'temporary']);
export const consentTypeEnum = pgEnum('consent_type', ['gdpr', 'ai_usage', 'data_sharing']);

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: companyTypeEnum("type").notNull(),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: userRoleEnum("role").notNull(),
  tags: text("tags").array(),
  googleId: varchar("google_id", { length: 255 }),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientCompanyId: uuid("client_company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default('active'),
  createdBy: uuid("created_by").references(() => users.id),
  settings: jsonb("settings").default({}),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Project Access Control table
export const projectAccess = pgTable("project_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  userId: uuid("user_id").references(() => users.id),
  accessLevel: accessLevelEnum("access_level").notNull(),
  grantedBy: uuid("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow()
});

// Services table
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Client Services table
export const clientServices = pgTable("client_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientCompanyId: uuid("client_company_id").references(() => companies.id).notNull(),
  serviceId: uuid("service_id").references(() => services.id).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  configuration: jsonb("configuration").default({}),
  enabledBy: uuid("enabled_by").references(() => users.id),
  enabledAt: timestamp("enabled_at").defaultNow()
});

// Digital Audits table
export const digitalAudits = pgTable("digital_audits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientCompanyId: uuid("client_company_id").references(() => companies.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  htmlContent: text("html_content"),
  status: auditStatusEnum("status").default('draft'),
  accessType: accessTypeEnum("access_type").default('permanent'),
  accessExpiresAt: timestamp("access_expires_at"),
  createdBy: uuid("created_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Access Requests table
export const accessRequests = pgTable("access_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
  requesterName: varchar("requester_name", { length: 255 }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  requestedRole: userRoleEnum("requested_role").notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).default('pending'),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});

// Consent Log table
export const consentLog = pgTable("consent_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  consentType: consentTypeEnum("consent_type").notNull(),
  status: boolean("status").notNull(),
  grantedBy: uuid("granted_by").references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow()
});

// Rendering Reports table
export const renderingReports = pgTable("rendering_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  clientTraffic: varchar("client_traffic", { length: 100 }),
  clientKeywords: varchar("client_keywords", { length: 100 }),
  clientBacklinks: varchar("client_backlinks", { length: 100 }),
  competitorScores: jsonb("competitor_scores").default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDigitalAuditSchema = createInsertSchema(digitalAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true
});

export const insertRenderingReportSchema = createInsertSchema(renderingReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectAccess = typeof projectAccess.$inferSelect;

export type Service = typeof services.$inferSelect;

export type ClientService = typeof clientServices.$inferSelect;

export type DigitalAudit = typeof digitalAudits.$inferSelect;
export type InsertDigitalAudit = z.infer<typeof insertDigitalAuditSchema>;

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;

export type AuditLog = typeof auditLog.$inferSelect;

export type ConsentLog = typeof consentLog.$inferSelect;

export type RenderingReport = typeof renderingReports.$inferSelect;
export type InsertRenderingReport = z.infer<typeof insertRenderingReportSchema>;
