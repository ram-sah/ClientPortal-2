import { apiRequest } from './queryClient';
import type { LoginCredentials, RegisterData, User } from '../types/auth';
import type { Company } from '../types/company';
import type { Project, AccessRequest, DashboardStats } from '../types/project';

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await apiRequest('POST', '/api/auth/register', data);
    return response.json();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiRequest('POST', '/api/auth/change-password', data);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout');
  }
};

// Company API
export const companyApi = {
  getCompanies: async (type?: string): Promise<Company[]> => {
    const url = type ? `/api/companies?type=${type}` : '/api/companies';
    const response = await apiRequest('GET', url);
    return response.json();
  },

  getCompany: async (id: string): Promise<Company> => {
    const response = await apiRequest('GET', `/api/companies/${id}`);
    return response.json();
  },

  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const response = await apiRequest('POST', '/api/companies', data);
    return response.json();
  }
};

// Project API
export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiRequest('GET', '/api/projects');
    return response.json();
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await apiRequest('GET', `/api/projects/${id}`);
    return response.json();
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiRequest('POST', '/api/projects', data);
    return response.json();
  }
};

// Access Request API
export const accessRequestApi = {
  getAccessRequests: async (): Promise<AccessRequest[]> => {
    const response = await apiRequest('GET', '/api/access-requests');
    return response.json();
  },

  createAccessRequest: async (data: Partial<AccessRequest>): Promise<AccessRequest> => {
    console.log('🚀 Frontend: About to send access request:', data);
    const response = await apiRequest('POST', '/api/access-requests', data);
    console.log('✅ Frontend: Access request successful');
    return response.json();
  },

  updateAccessRequest: async (id: string, data: { status: string; companyId?: string }): Promise<AccessRequest> => {
    const response = await apiRequest('PATCH', `/api/access-requests/${id}`, data);
    return response.json();
  }
};

// User API
export const userApi = {
  createUser: async (data: { email: string; password: string; firstName: string; lastName: string; companyId: string; role: string }): Promise<User> => {
    const response = await apiRequest('POST', '/api/users', data);
    return response.json();
  },
  
  updateUser: async (id: string, data: { email: string; firstName: string; lastName: string; companyId: string; role: string; isActive?: boolean }): Promise<User> => {
    const response = await apiRequest('PATCH', `/api/users/${id}`, data);
    return response.json();
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await apiRequest('DELETE', `/api/users/${id}`);
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest('GET', '/api/dashboard/stats');
    return response.json();
  }
};
