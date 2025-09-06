import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestApi } from '../../lib/api';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import type { AccessRequest } from '../../types/project';

export function AccessRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accessRequests = [], isLoading } = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests'],
    enabled: user?.role === 'owner' || user?.role === 'admin'
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies'],
    enabled: user?.role === 'owner' || user?.role === 'admin'
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status, companyId }: { id: string; status: string; companyId?: string }) =>
      accessRequestApi.updateAccessRequest(id, { status, companyId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: 'Access request updated',
        description: `Request has been ${variables.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update request',
        variant: 'destructive'
      });
    }
  });

  const handleApprove = (id: string) => {
    // Get the first client company as default, or let admin choose
    const clientCompanies = (companies as any[]).filter((company: any) => company.type === 'client');
    const defaultCompanyId = clientCompanies.length > 0 ? clientCompanies[0].id : undefined;
    
    updateRequestMutation.mutate({ 
      id, 
      status: 'approved',
      companyId: defaultCompanyId
    });
  };

  const handleDeny = (id: string) => {
    updateRequestMutation.mutate({ id, status: 'denied' });
  };

  // Don't show this component for non-admin users
  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border border-secondary-200">
        <CardHeader className="border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Pending Access Requests</h2>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                  <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-16 bg-secondary-200 rounded"></div>
                  <div className="h-8 w-16 bg-secondary-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = accessRequests.filter((req: AccessRequest) => req.status === 'pending');

  return (
    <Card className="border border-secondary-200">
      <CardHeader className="border-b border-secondary-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Pending Access Requests</h2>
          {pendingRequests.length > 0 && (
            <Badge className="bg-orange-100 text-orange-600">
              {pendingRequests.length} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-secondary-500">
            No pending access requests.
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {pendingRequests.map((request: AccessRequest) => (
              <div key={request.id} className="p-6" data-testid={`access-request-${request.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-secondary-900">{request.requesterName}</h3>
                    <p className="text-sm text-secondary-600">{request.requesterEmail}</p>
                    <p className="text-sm text-secondary-500 mt-1">
                      Requesting: {request.requestedRole.replace('_', ' ')} access
                    </p>
                    {request.message && (
                      <p className="text-sm text-secondary-600 mt-2">{request.message}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-100 text-green-700 hover:bg-green-200"
                      onClick={() => handleApprove(request.id)}
                      disabled={updateRequestMutation.isPending}
                      data-testid={`button-approve-${request.id}`}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      onClick={() => handleDeny(request.id)}
                      disabled={updateRequestMutation.isPending}
                      data-testid={`button-deny-${request.id}`}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
