import { FolderOpen, CheckCircle, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '../../types/project';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderOpen,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-500',
      change: '+8.2%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Completed Audits',
      value: stats.completedAudits,
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      change: '+12.3%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      change: '+3.1%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      change: 'Action Required',
      changeColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="border border-secondary-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">{card.title}</p>
                  <p className="text-2xl font-semibold text-secondary-900" data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${card.changeColor}`}>
                  {card.change}
                </span>
                {card.change.includes('%') && (
                  <span className="text-secondary-500 text-sm ml-2">from last month</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
