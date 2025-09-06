import { useState } from 'react';
import { Redirect, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { accessRequestApi } from '../lib/api';
import { TrendingUp } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterEmail: '',
    requestedRole: '',
    message: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" replace />;
  }

  const createRequestMutation = useMutation({
    mutationFn: accessRequestApi.createAccessRequest,
    onSuccess: () => {
      toast({
        title: 'Access request submitted',
        description: 'Your request has been sent to the administrators for review.',
      });
      // Reset form
      setFormData({
        requesterName: '',
        requesterEmail: '',
        requestedRole: '',
        message: ''
      });
    },
    onError: (error) => {
      console.error('Access request error details:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createRequestMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
              <TrendingUp className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold text-secondary-900 text-lg">CMG Portal</span>
          </div>
          <CardTitle className="text-2xl font-semibold text-secondary-900">
            Request Access
          </CardTitle>
          <p className="text-sm text-secondary-600">
            Submit a request to join the platform
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.requesterName}
                onChange={(e) => handleInputChange('requesterName', e.target.value)}
                placeholder="Enter your full name"
                required
                data-testid="input-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.requesterEmail}
                onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
                placeholder="Enter your email"
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Requested Role</Label>
              <Select value={formData.requestedRole} onValueChange={(value) => handleInputChange('requestedRole', value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us why you need access..."
                rows={3}
                data-testid="textarea-message"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={createRequestMutation.isPending || !formData.requesterName || !formData.requesterEmail || !formData.requestedRole}
              data-testid="button-submit-request"
            >
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Already have access?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
