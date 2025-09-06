import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChangePasswordDialog } from '../auth/change-password-dialog';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { user, logout } = useAuth();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search functionality
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-secondary-600">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            className="relative p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge - hidden by default */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full hidden"></span>
          </button>
          
          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-64 pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="input-search"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
          </div>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2" data-testid="button-user-menu">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center space-x-2 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center space-x-2 text-sm"
                  data-testid="button-change-password"
                >
                  <Settings className="w-4 h-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout}
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ChangePasswordDialog 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
    </header>
  );
}
