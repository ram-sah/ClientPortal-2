import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';


export function RecentProjects() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects']
  });



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 border border-secondary-200">
        <CardHeader className="border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Projects</h2>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-secondary-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                  <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 border border-secondary-200">
   
    </Card>
  );
}
