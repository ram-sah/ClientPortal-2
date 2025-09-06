import { AppLayout } from '../components/layout/app-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, CheckCircle, XCircle, Clock, Eye, Mail } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestApi, companyApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { getRoleDisplayName } from '../lib/utils';

export default function AccessRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accessRequests = [], isLoading } = useQuery({
    queryKey: ['/api/access-requests']
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies']
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
      
      setIsDetailsDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update request',
        variant: 'destructive'
      });
    }
  });

  const handleApprove = (id: string, companyId?: string) => {
    updateRequestMutation.mutate({ id, status: 'approved', companyId });
  };

  const handleDeny = (id: string) => {
    updateRequestMutation.mutate({ id, status: 'denied' });
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const filteredRequests = (accessRequests as any[]).filter((request: any) => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requesterEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'denied':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'partner':
        return 'bg-orange-100 text-orange-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompanyName = (companyId: string | undefined) => {
    if (!companyId) return 'No company specified';
    const company = (companies as any[]).find((c: any) => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  const pendingRequests = (accessRequests as any[]).filter((req: any) => req.status === 'pending');
  const approvedRequests = (accessRequests as any[]).filter((req: any) => req.status === 'approved');
  const deniedRequests = (accessRequests as any[]).filter((req: any) => req.status === 'denied');

  return (
    <AppLayout title="Access Requests" subtitle="Review and manage user access requests">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-secondary-900">{pendingRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Approved This Month</p>
                <p className="text-2xl font-semibold text-secondary-900">{approvedRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Denied Requests</p>
                <p className="text-2xl font-semibold text-secondary-900">{deniedRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-500 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-requests"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Access Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-secondary-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
                      <div className="h-3 bg-secondary-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 bg-secondary-200 rounded"></div>
                    <div className="h-8 w-16 bg-secondary-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No requests found' : 'No access requests'}
            </h3>
            <p className="text-secondary-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'All access requests will appear here when users request access to the platform.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow" data-testid={`request-card-${request.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {request.requesterName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-secondary-900">{request.requesterName}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </Badge>
                        <Badge className={getRoleColor(request.requestedRole)}>
                          {getRoleDisplayName(request.requestedRole)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {request.requesterEmail}
                        </span>
                        <span>{getCompanyName(request.companyId)}</span>
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      {request.message && (
                        <p className="text-sm text-secondary-600 mt-2 line-clamp-2">{request.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(request)}
                      data-testid={`button-view-details-${request.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => handleApprove(request.id, request.companyId)}
                          disabled={updateRequestMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
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
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Full Name</label>
                  <p className="text-secondary-900">{selectedRequest.requesterName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Email</label>
                  <p className="text-secondary-900">{selectedRequest.requesterEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Requested Role</label>
                  <Badge className={getRoleColor(selectedRequest.requestedRole)}>
                    {getRoleDisplayName(selectedRequest.requestedRole)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1">{selectedRequest.status}</span>
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Company</label>
                  <p className="text-secondary-900">{getCompanyName(selectedRequest.companyId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Request Date</label>
                  <p className="text-secondary-900">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div>
                  <label className="text-sm font-medium text-secondary-700">Message</label>
                  <div className="mt-1 p-3 bg-secondary-50 rounded-lg">
                    <p className="text-secondary-900">{selectedRequest.message}</p>
                  </div>
                </div>
              )}

              {/* Review Information */}
              {selectedRequest.reviewedBy && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-secondary-700">Reviewed By</label>
                    <p className="text-secondary-900">User {selectedRequest.reviewedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-700">Review Date</label>
                    <p className="text-secondary-900">
                      {selectedRequest.reviewedAt && new Date(selectedRequest.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                    onClick={() => handleDeny(selectedRequest.id)}
                    disabled={updateRequestMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny Request
                  </Button>
                  <Button
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                    onClick={() => handleApprove(selectedRequest.id, selectedRequest.companyId)}
                    disabled={updateRequestMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
