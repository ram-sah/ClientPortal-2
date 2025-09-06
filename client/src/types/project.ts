export interface Project {
  id: string;
  clientCompanyId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'draft';
  createdBy?: string;
  settings?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRequest {
  id: string;
  requesterEmail: string;
  requesterName: string;
  companyId?: string;
  requestedRole: string;
  message?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  activeProjects: number;
  completedAudits: number;
  activeClients: number;
  pendingApprovals: number;
}
