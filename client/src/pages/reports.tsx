import { AppLayout } from '../components/layout/app-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Search, BarChart3, Download, Eye, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [clientFilter, setClientFilter] = useState('all');
  const { user } = useAuth();

  // Mock data for reports - in real app this would come from API
  const reports = [
    {
      id: '1',
      title: 'Acme Corp - November 2024 Report',
      clientName: 'Acme Corporation',
      period: '2024-11',
      status: 'completed',
      generatedAt: '2024-11-30',
      viewCount: 15,
      downloadCount: 3,
      kpis: ['Traffic', 'Conversions', 'ROI']
    },
    {
      id: '2',
      title: 'TechBridge - Q4 2024 Summary',
      clientName: 'TechBridge Solutions',
      period: '2024-Q4',
      status: 'in_progress',
      generatedAt: '2024-11-25',
      viewCount: 8,
      downloadCount: 1,
      kpis: ['Leads', 'Revenue', 'Engagement']
    },
    {
      id: '3',
      title: 'GrowthStart - Weekly Analytics',
      clientName: 'GrowthStart Inc',
      period: '2024-W47',
      status: 'completed',
      generatedAt: '2024-11-28',
      viewCount: 22,
      downloadCount: 7,
      kpis: ['Page Views', 'Bounce Rate', 'Sessions']
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'all' || report.clientName === clientFilter;
    return matchesSearch && matchesClient;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateReport = user && ['owner', 'admin', 'client_services'].includes(user.role);

  return (
    <AppLayout title="Monthly Reports" subtitle="Generate and manage client performance reports">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-reports"
            />
          </div>
          
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48" data-testid="select-client-filter">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="Acme Corporation">Acme Corporation</SelectItem>
              <SelectItem value="TechBridge Solutions">TechBridge Solutions</SelectItem>
              <SelectItem value="GrowthStart Inc">GrowthStart Inc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {canCreateReport && (
          <Button data-testid="button-generate-report">
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Reports This Month</p>
                <p className="text-2xl font-semibold text-secondary-900">18</p>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-primary-500 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+12.3%</span>
              <span className="text-secondary-500 text-sm ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Avg View Time</p>
                <p className="text-2xl font-semibold text-secondary-900">4.2m</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Eye className="text-blue-500 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+8.1%</span>
              <span className="text-secondary-500 text-sm ml-2">engagement up</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Client Satisfaction</p>
                <p className="text-2xl font-semibold text-secondary-900">92%</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Download className="text-green-500 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-green-600 text-sm font-medium">+5.2%</span>
              <span className="text-secondary-500 text-sm ml-2">satisfaction rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {searchTerm || clientFilter !== 'all' ? 'No reports found' : 'No reports yet'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {searchTerm || clientFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Generate your first client report to get started.'
              }
            </p>
            {canCreateReport && !searchTerm && clientFilter === 'all' && (
              <Button data-testid="button-create-first-report">
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`report-card-${report.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-primary-600 w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 mb-1">{report.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        <span>{report.clientName}</span>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                        <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 mt-1">
                        <span>{report.viewCount} views</span>
                        <span>{report.downloadCount} downloads</span>
                        <span>KPIs: {report.kpis.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && (
                      <>
                        <Button size="sm" variant="outline" data-testid={`button-view-${report.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-download-${report.id}`}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                    {report.status === 'in_progress' && canCreateReport && (
                      <Button size="sm" data-testid={`button-continue-${report.id}`}>
                        Continue
                      </Button>
                    )}
                    {canCreateReport && (
                      <Button size="sm" variant="outline" data-testid={`button-regenerate-${report.id}`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
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
