import { storage } from '../storage';
import type { InsertDigitalAudit } from '@shared/schema';

export class AuditService {
  async createAudit(auditData: InsertDigitalAudit) {
    return await storage.createDigitalAudit(auditData);
  }

  async updateAudit(id: string, updates: Partial<InsertDigitalAudit>) {
    return await storage.updateDigitalAudit(id, updates);
  }

  async getAudit(id: string) {
    return await storage.getDigitalAudit(id);
  }

  async getAuditsByClient(clientCompanyId: string) {
    return await storage.getAuditsByClient(clientCompanyId);
  }

  async publishAudit(id: string, publishedBy: string) {
    return await storage.updateDigitalAudit(id, {
      status: 'published',
      publishedAt: new Date()
    });
  }
}

export const auditService = new AuditService();
