import { storage } from '../storage';
import type { InsertCompany } from '@shared/schema';

export class CompanyService {
  async createCompany(companyData: InsertCompany) {
    return await storage.createCompany(companyData);
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>) {
    return await storage.updateCompany(id, updates);
  }

  async getCompany(id: string) {
    return await storage.getCompany(id);
  }

  async getCompaniesByType(type: string) {
    return await storage.getCompaniesByType(type);
  }

  async getSubCompanies(parentId: string) {
    return await storage.getCompaniesByParent(parentId);
  }

  async getCompanyUsers(companyId: string) {
    return await storage.getUsersByCompany(companyId);
  }
}

export const companyService = new CompanyService();
