import { Link, useLocation } from 'wouter';
import { Users, Building, Key, TrendingUp, Search, BarChart3, FolderOpen, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { accessRequestApi } from '../../lib/api';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: accessRequests = [] } = useQuery({
    queryKey: ['/api/access-requests'],
    enabled: user?.role === 'owner' || user?.role === 'admin'
  });

  const pendingCount = accessRequests.filter(req => req.status === 'pending').length;

  const isActive = (path: string) => location === path;

  const navigationItems = [
    {
      href: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['owner', 'admin', 'client_services', 'specialty_skills', 'partner_admin', 'partner_contributor', 'partner_viewer', 'client_editor', 'client_viewer']
    },
    {
      href: '/projects',
      icon: FolderOpen,
      label: 'Projects',
      roles: ['owner', 'admin', 'client_services', 'specialty_skills', 'partner_admin', 'partner_contributor', 'partner_viewer', 'client_editor', 'client_viewer']
    },
    {
      href: '/reports',
      icon: BarChart3,
      label: 'Reports',
      roles: ['owner', 'admin', 'client_services', 'specialty_skills', 'client_editor', 'client_viewer']
    },
    {
      href: '/audits',
      icon: Search,
      label: 'Digital Audits',
      roles: ['owner', 'admin', 'client_services', 'specialty_skills', 'client_editor', 'client_viewer']
    }
  ];

  const adminItems = [
    {
      href: '/users',
      icon: Users,
      label: 'User Management',
      roles: ['owner', 'admin']
    },
    {
      href: '/companies',
      icon: Building,
      label: 'Companies',
      roles: ['owner', 'admin']
    },
    {
      href: '/access-requests',
      icon: Key,
      label: 'Access Requests',
      roles: ['owner', 'admin'],
      badge: pendingCount > 0 ? pendingCount : undefined
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const userInitials = user ? getInitials(`${user.firstName} ${user.lastName}`) : '';
  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div className="w-64 bg-white shadow-lg border-r border-secondary-200 flex flex-col">
      {/* Logo & Company Selector */}
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
            <TrendingUp className="text-white w-4 h-4" />
          </div>
          <span className="font-semibold text-secondary-900 text-lg">CMG Portal</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          if (!user || !item.roles.includes(user.role)) return null;
          
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={isActive(item.href) ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Section */}
        {user && (user.role === 'owner' || user.role === 'admin') && (
          <>
            <div className="pt-4 border-t border-secondary-200 mt-4">
              <div className="px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Administration
              </div>
              
              {adminItems.map((item) => {
                if (!user || !item.roles.includes(user.role)) return null;
                
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={isActive(item.href) ? 'font-medium' : ''}>{item.label}</span>
                    {item.badge && (
                      <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">{userName}</p>
            <p className="text-xs text-secondary-500 capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={logout}
            className="text-secondary-400 hover:text-secondary-600"
            data-testid="button-logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
