import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateToken } from '../middleware/auth';
import type { InsertUser } from '@shared/schema';

export class AuthService {
  async login(email: string, password: string): Promise<{ user: any; token: string } | null> {
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return null;
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    const token = await generateToken(user.id);
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  async register(userData: InsertUser & { password: string }): Promise<{ user: any; token: string }> {
    const existingUser = await storage.getUserByEmail(userData.email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const { password, ...userDataWithoutPassword } = userData;
    
    const user = await storage.createUser({
      ...userDataWithoutPassword,
      passwordHash
    });

    const token = await generateToken(user.id);
    
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  async getCurrentUser(userId: string) {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return null;
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.passwordHash) {
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(userId, { passwordHash });
  }
}

export const authService = new AuthService();
