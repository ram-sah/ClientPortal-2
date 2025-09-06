import { storage } from '../storage';
import type { InsertUser } from '@shared/schema';
import bcrypt from 'bcrypt';

export class UserService {
  async createUser(userData: InsertUser & { password?: string }) {
    let passwordHash: string | undefined;
    
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 10);
    }

    const { password, ...userDataWithoutPassword } = userData;
    
    return await storage.createUser({
      ...userDataWithoutPassword,
      passwordHash
    });
  }

  async updateUser(id: string, updates: Partial<InsertUser>) {
    return await storage.updateUser(id, updates);
  }

  async getUser(id: string) {
    const user = await storage.getUser(id);
    if (!user) return null;
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsersByCompany(companyId: string) {
    const users = await storage.getUsersByCompany(companyId);
    
    // Remove password hashes from response
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async getAllUsers() {
    const users = await storage.getAllUsers();
    
    // Remove password hashes from response
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async inviteUser(email: string, companyId: string, role: string, invitedBy: string) {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create access request instead of direct user creation
    return await storage.createAccessRequest({
      requesterEmail: email,
      requesterName: email.split('@')[0], // Temporary name
      companyId,
      requestedRole: role as any,
      message: `Invited by user ${invitedBy}`,
      status: 'pending'
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return await storage.deleteUser(id);
  }
}

export const userService = new UserService();
