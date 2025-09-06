import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Role display name mapping
export function getRoleDisplayName(role: string): string {
  const roleMap = {
    'owner': 'Owner',
    'admin': 'Admin',
    'client': 'Client',
    'partner': 'Partner'
  };
  
  return roleMap[role as keyof typeof roleMap] || role;
}

// Get available roles based on current user's role
export function getAvailableRoles(currentUserRole: string): Array<{value: string, label: string}> {
  if (currentUserRole === 'owner') {
    return [
      { value: 'admin', label: 'Admin' },
      { value: 'client', label: 'Client' },
      { value: 'partner', label: 'Partner' }
    ];
  } else if (currentUserRole === 'admin') {
    return [
      { value: 'client', label: 'Client' },
      { value: 'partner', label: 'Partner' }
    ];
  } else if (currentUserRole === 'client') {
    return [
      { value: 'partner', label: 'Partner' }
    ];
  }
  
  return [];
}
