import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, UserPlus, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

export function QuickActions() {
  const { user } = useAuth();

  const actions = [
    {
      icon: Plus,
      title: 'New Project',
      description: 'Create a new client project',
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50 hover:bg-primary-100',
      textColor: 'text-primary-900',
      descColor: 'text-primary-600',
      roles: ['owner', 'admin', 'client_services'],
      action: 'create-project'
    },
    {
      icon: Upload,
      title: 'Upload Audit',
      description: 'Add new digital audit report',
      color: 'bg-green-500',
      bgColor: 'bg-secondary-50 hover:bg-secondary-100',
      textColor: 'text-secondary-900',
      descColor: 'text-secondary-600',
      roles: ['owner', 'admin', 'client_services', 'specialty_skills'],
      action: 'upload-audit'
    },
    {
      icon: UserPlus,
      title: 'Invite User',
      description: 'Add team member or client',
      color: 'bg-blue-500',
      bgColor: 'bg-secondary-50 hover:bg-secondary-100',
      textColor: 'text-secondary-900',
      descColor: 'text-secondary-600',
      roles: ['owner', 'admin'],
      action: 'invite-user'
    },
    {
      icon: BarChart3,
      title: 'Generate Report',
      description: 'Create monthly client report',
      color: 'bg-purple-500',
      bgColor: 'bg-secondary-50 hover:bg-secondary-100',
      textColor: 'text-secondary-900',
      descColor: 'text-secondary-600',
      roles: ['owner', 'admin', 'client_services'],
      action: 'generate-report'
    }
  ];

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // TODO: Implement modal or navigation for each action
  };

  return (
    <Card className="border border-secondary-200">
     
      
      <CardContent className="p-6 space-y-4">
        {actions.map((action) => {
          if (!user || !action.roles.includes(user.role)) return null;
          
          const Icon = action.icon;
          
          return (
            <Button
              key={action.action}
              variant="ghost"
              className={`w-full flex items-center space-x-3 p-4 text-left ${action.bgColor} transition-colors justify-start h-auto`}
              onClick={() => handleQuickAction(action.action)}
              data-testid={`button-${action.action}`}
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                <Icon className="text-white w-5 h-5" />
              </div>
              <div>
                <p className={`font-medium ${action.textColor}`}>{action.title}</p>
                <p className={`text-sm ${action.descColor}`}>{action.description}</p>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
