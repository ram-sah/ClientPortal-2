export interface Company {
  id: string;
  type: 'owner' | 'partner' | 'client' | 'sub';
  parentId?: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
