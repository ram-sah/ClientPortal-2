import { AppLayout } from '../components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Eye, Download } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';

export default function Audits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  // Mock data for audits - in real app this would come from API
  const audits = [
    {
      id: '1',
      title: 'Acme Corp - Q4 Digital Audit',
      clientCompanyId: 'acme-corp',
      status: 'published',
      accessType: 'permanent',
      createdAt: '2024-11-15',
      publishedAt: '2024-11-20',
      createdBy: 'user-1'
    },
    {
      id: '2',
      title: 'TechBridge - SEO Analysis',
      clientCompanyId: 'techbridge',
      status: 'draft',
      accessType: 'temporary',
      createdAt: '2024-11-18',
      createdBy: 'user-2'
    },
    {
      id: '3',
      title: 'GrowthStart - Website Performance Audit',
      clientCompanyId: 'growthstart',
      status: 'review',
      accessType: 'permanent',
      createdAt: '2024-11-10',
      createdBy: 'user-1'
    }
  ];

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateAudit = user && ['owner', 'admin', 'client_services', 'specialty_skills'].includes(user.role);

  return (
    <AppLayout title="Digital Audits" subtitle="Manage and share digital audit reports">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <Input
              placeholder="Search audits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-audits"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {canCreateAudit && (
          <Button data-testid="button-create-audit">
            <Plus className="w-4 h-4 mr-2" />
            New Audit
          </Button>
        )}
      </div>

      {/* Audits List */}
      {filteredAudits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No audits found' : 'No audits yet'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first digital audit to get started.'
              }
            </p>
            {canCreateAudit && !searchTerm && statusFilter === 'all' && (
              <Button data-testid="button-create-first-audit">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Audit
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAudits.map((audit) => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow" data-testid={`audit-card-${audit.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-primary-600 w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 mb-1">{audit.title}</h3>
                      <div className="flex items-center space-x-3 text-sm text-secondary-600">
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                        </Badge>
                        <span>Created: {new Date(audit.createdAt).toLocaleDateString()}</span>
                        {audit.publishedAt && (
                          <span>Published: {new Date(audit.publishedAt).toLocaleDateString()}</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {audit.accessType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {audit.status === 'published' && (
                      <>
                        <Button size="sm" variant="outline" data-testid={`button-view-${audit.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-download-${audit.id}`}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                    {audit.status === 'draft' && canCreateAudit && (
                      <Button size="sm" data-testid={`button-edit-${audit.id}`}>
                        Edit
                      </Button>
                    )}
                    {audit.status === 'review' && canCreateAudit && (
                      <Button size="sm" data-testid={`button-publish-${audit.id}`}>
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
