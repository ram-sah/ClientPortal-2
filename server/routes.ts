import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { requireAuth, requireOwnerOrAdmin, requireUserManagementPermission, canManageUser } from "./middleware/auth";
import { authService } from "./services/auth.service";
import { companyService } from "./services/company.service";
import { userService } from "./services/user.service";
import { projectService } from "./services/project.service";
import { auditService } from "./services/audit.service";
import { airtableService } from "./services/airtable.service";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema, insertProjectSchema, insertDigitalAuditSchema, insertAccessRequestSchema, insertRenderingReportSchema } from "@shared/schema";

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Register schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const result = await authService.login(email, password);
      
      if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const result = await authService.register(userData);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  // Change password
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6)
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      // Verify current password
      const isValid = await authService.verifyPassword(req.user!.email, currentPassword);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Update password
      await authService.changePassword(req.user!.id, newPassword);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to change password" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    // Log the logout activity
    await storage.logActivity(req.user!.id, 'LOGOUT', undefined, undefined, { ip: req.ip });
    res.json({ message: "Logged out successfully" });
  });

  // Company routes
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type && typeof type === 'string') {
        const companies = await companyService.getCompaniesByType(type);
        res.json(companies);
      } else {
        // Return companies based on user's access level
        if (req.user!.role === 'owner' || req.user!.role === 'admin' || req.user!.role === 'partner') {
          const companies = await companyService.getCompaniesByType('client');
          res.json(companies);
        } else {
          const company = await companyService.getCompany(req.user!.companyId);
          res.json(company ? [company] : []);
        }
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get companies" });
    }
  });

  app.post("/api/companies", requireOwnerOrAdmin, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await companyService.createCompany(companyData);
      
      await storage.logActivity(req.user!.id, 'CREATE_COMPANY', 'company', company.id);
      
      res.status(201).json(company);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create company" });
    }
  });

  // Airtable companies route - must be before /:id route
  app.get("/api/companies/airtable", requireAuth, async (req, res) => {
    try {
      const tableName = (req.query.table as string) || 'Companies';
      const companies = await airtableService.getCompanies(tableName);
      res.json(companies);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get Airtable companies" });
    }
  });

  // Airtable competitive analysis route
  app.get("/api/companies/competitive-analysis", requireAuth, async (req, res) => {
    try {
      const competitiveData = await airtableService.getCompetitiveAnalysis();
      res.json(competitiveData);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get competitive analysis data" });
    }
  });

  // Airtable rendering reports route
  app.get("/api/rendering-reports/airtable", requireAuth, async (req, res) => {
    try {
      // For non-admin users, filter reports to show only their company's data
      let companyNameFilter: string | undefined;
      
      if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
        // Get the user's company details to filter reports
        const userCompany = await companyService.getCompany(req.user!.companyId);
        if (userCompany) {
          companyNameFilter = userCompany.name;
          console.log(`🏢 Filtering rendering reports for company: ${companyNameFilter}`);
        }
      } else {
        console.log('👤 Admin/Owner user - showing all rendering reports');
      }
      
      const renderingReports = await airtableService.getRenderingReports(companyNameFilter);
      res.json(renderingReports);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get rendering reports from Airtable" });
    }
  });

  app.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const canAccess = await storage.canUserAccessCompany(req.user!.id, id);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const company = await companyService.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get company" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (companyId && typeof companyId === 'string') {
        const canAccess = await storage.canUserAccessCompany(req.user!.id, companyId);
        if (!canAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        const users = await userService.getUsersByCompany(companyId);
        res.json(users);
      } else {
        // Different logic based on user role
        let users = [];
        
        if (req.user!.role === 'owner' || req.user!.role === 'admin') {
          // Owner/Admin can see all users they can manage
          users = await userService.getAllUsers();
          
          // Filter users based on current user's role - Admins shouldn't see other owners
          if (req.user!.role !== 'owner') {
            users = users.filter(user => user.role !== 'owner');
          }
        } else {
          // Client/Partner users only see users from their own company
          users = await userService.getUsersByCompany(req.user!.companyId);
        }
        
        res.json(users);
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get users" });
    }
  });

  app.post("/api/users", requireUserManagementPermission, async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const user = await userService.createUser(userData);
      
      await storage.logActivity(req.user!.id, 'CREATE_USER', 'user', user.id);
      
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  app.post("/api/users/invite", requireUserManagementPermission, async (req, res) => {
    try {
      const { email, companyId, role } = req.body;
      
      const accessRequest = await userService.inviteUser(email, companyId, role, req.user!.id);
      
      await storage.logActivity(req.user!.id, 'INVITE_USER', 'access_request', accessRequest.id);
      
      res.status(201).json(accessRequest);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to invite user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if user can manage this target user
      const canManage = await canManageUser(req.user!.id, id);
      if (!canManage) {
        return res.status(403).json({ error: 'Insufficient permissions to update this user' });
      }
      
      const user = await userService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.logActivity(req.user!.id, 'UPDATE_USER', 'user', user.id);
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user can manage this target user
      const canManage = await canManageUser(req.user!.id, id);
      if (!canManage) {
        return res.status(403).json({ error: 'Insufficient permissions to delete this user' });
      }
      
      // Prevent users from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      const success = await userService.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.logActivity(req.user!.id, 'DELETE_USER', 'user', id);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete user" });
    }
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await projectService.getUserProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      
      // Set created by
      projectData.createdBy = req.user!.id;
      
      const project = await projectService.createProject(projectData);
      
      await storage.logActivity(req.user!.id, 'CREATE_PROJECT', 'project', project.id);
      
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const canAccess = await projectService.canUserAccessProject(req.user!.id, id);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const project = await projectService.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get project" });
    }
  });

  // Digital Audit routes
  app.get("/api/audits", requireAuth, async (req, res) => {
    try {
      const { clientCompanyId } = req.query;
      
      if (clientCompanyId && typeof clientCompanyId === 'string') {
        const canAccess = await storage.canUserAccessCompany(req.user!.id, clientCompanyId);
        if (!canAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        const audits = await auditService.getAuditsByClient(clientCompanyId);
        res.json(audits);
      } else {
        // Return audits based on user's company type
        if (req.user!.role === 'owner' || req.user!.role === 'admin' || req.user!.role === 'partner') {
          // Get all audits for owner/admin/partner
          const clientCompanies = await companyService.getCompaniesByType('client');
          const allAudits = [];
          
          for (const company of clientCompanies) {
            const audits = await auditService.getAuditsByClient(company.id);
            allAudits.push(...audits);
          }
          
          res.json(allAudits);
        } else {
          // Client users see their company's audits
          const audits = await auditService.getAuditsByClient(req.user!.companyId);
          res.json(audits);
        }
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get audits" });
    }
  });

  app.post("/api/audits", requireAuth, async (req, res) => {
    try {
      const auditData = insertDigitalAuditSchema.parse(req.body);
      
      // Set created by
      auditData.createdBy = req.user!.id;
      
      const audit = await auditService.createAudit(auditData);
      
      await storage.logActivity(req.user!.id, 'CREATE_AUDIT', 'digital_audit', audit.id);
      
      res.status(201).json(audit);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create audit" });
    }
  });

  // Access Request routes
  app.get("/api/access-requests", requireAuth, async (req, res) => {
    // Check if user has owner, admin, or client role (Client can manage Partner)
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin' && req.user!.role !== 'client') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
      const requests = await storage.getPendingAccessRequests();
      res.json(requests);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get access requests" });
    }
  });

  app.post("/api/access-requests", async (req, res) => {
    try {
      console.log("🔄 Access request attempt:", JSON.stringify(req.body, null, 2));
      
      const requestData = insertAccessRequestSchema.parse(req.body);
      console.log("✅ Schema validation passed");
      
      const request = await storage.createAccessRequest(requestData);
      console.log("✅ Request created with ID:", request.id);
      
      res.status(201).json(request);
    } catch (error) {
      console.error("❌ Access request failed:");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("Full error:", error);
      
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create access request" });
    }
  });

  app.patch("/api/access-requests/:id", requireAuth, async (req, res) => {
    // Check if user has owner, admin, or client role (Client can manage Partner)
    if (req.user!.role !== 'owner' && req.user!.role !== 'admin' && req.user!.role !== 'client') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
      const { id } = req.params;
      const { status, companyId } = req.body;
      
      const request = await storage.getAccessRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Access request not found" });
      }
      
      if (status === 'approved') {
        // Create the user
        const nameParts = request.requesterName.trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Account';
        
        await userService.createUser({
          email: request.requesterEmail,
          firstName,
          lastName,
          role: request.requestedRole,
          companyId: companyId || request.companyId!
        });
      }
      
      const updatedRequest = await storage.updateAccessRequest(id, {
        status,
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      });
      
      await storage.logActivity(req.user!.id, 'REVIEW_ACCESS_REQUEST', 'access_request', id);
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update access request" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userProjects = await projectService.getUserProjects(req.user!.id);
      const activeProjects = userProjects.filter(p => p.status === 'active');
      
      let completedAudits = 0;
      let activeClients = 0;
      let pendingApprovals = 0;
      
      if (req.user!.role === 'owner' || req.user!.role === 'admin' || req.user!.role === 'partner') {
        const clientCompanies = await companyService.getCompaniesByType('client');
        activeClients = clientCompanies.length;
        
        for (const company of clientCompanies) {
          const audits = await auditService.getAuditsByClient(company.id);
          completedAudits += audits.filter(a => a.status === 'published').length;
        }
        
        const accessRequests = await storage.getPendingAccessRequests();
        pendingApprovals = accessRequests.length;
      } else {
        // Client users see their company's stats
        const audits = await auditService.getAuditsByClient(req.user!.companyId);
        completedAudits = audits.filter(a => a.status === 'published').length;
        activeClients = 1; // Current client
      }
      
      res.json({
        activeProjects: activeProjects.length,
        completedAudits,
        activeClients,
        pendingApprovals
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get dashboard stats" });
    }
  });

  // Rendering Reports routes
  app.get("/api/rendering-reports", requireAuth, async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (companyId && typeof companyId === 'string') {
        const canAccess = await storage.canUserAccessCompany(req.user!.id, companyId);
        if (!canAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
        
        const report = await storage.getRenderingReportByCompany(companyId);
        res.json(report || null);
      } else {
        // Return all reports for authorized users (owner/admin)
        if (req.user!.role === 'owner' || req.user!.role === 'admin') {
          const reports = await storage.getRenderingReports();
          res.json(reports);
        } else {
          // Return only the user's company report
          const report = await storage.getRenderingReportByCompany(req.user!.companyId);
          res.json(report ? [report] : []);
        }
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get rendering reports" });
    }
  });

  app.get("/api/rendering-reports/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getRenderingReport(id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const canAccess = await storage.canUserAccessCompany(req.user!.id, report.companyId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get rendering report" });
    }
  });

  app.post("/api/rendering-reports", requireAuth, async (req, res) => {
    try {
      // Only owner or admin can create reports
      if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const reportData = insertRenderingReportSchema.parse(req.body);
      reportData.createdBy = req.user!.id;
      
      const report = await storage.createRenderingReport(reportData);
      
      await storage.logActivity(req.user!.id, 'CREATE_RENDERING_REPORT', 'rendering_report', report.id);
      
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create rendering report" });
    }
  });

  app.patch("/api/rendering-reports/:id", requireAuth, async (req, res) => {
    try {
      // Only owner or admin can update reports
      if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const { id } = req.params;
      const updates = insertRenderingReportSchema.partial().parse(req.body);
      
      const report = await storage.updateRenderingReport(id, updates);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      await storage.logActivity(req.user!.id, 'UPDATE_RENDERING_REPORT', 'rendering_report', id);
      
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update rendering report" });
    }
  });

  app.delete("/api/rendering-reports/:id", requireAuth, async (req, res) => {
    try {
      // Only owner or admin can delete reports
      if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const { id } = req.params;
      const deleted = await storage.deleteRenderingReport(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      await storage.logActivity(req.user!.id, 'DELETE_RENDERING_REPORT', 'rendering_report', id);
      
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete rendering report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
