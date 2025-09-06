import { storage } from '../storage';
import type { InsertProject } from '@shared/schema';

export class ProjectService {
  async createProject(projectData: InsertProject) {
    return await storage.createProject(projectData);
  }

  async updateProject(id: string, updates: Partial<InsertProject>) {
    return await storage.updateProject(id, updates);
  }

  async getProject(id: string) {
    return await storage.getProject(id);
  }

  async getUserProjects(userId: string) {
    return await storage.getUserProjects(userId);
  }

  async getProjectsByClient(clientCompanyId: string) {
    return await storage.getProjectsByClient(clientCompanyId);
  }

  async canUserAccessProject(userId: string, projectId: string) {
    return await storage.canUserAccessProject(userId, projectId);
  }
}

export const projectService = new ProjectService();
