import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { TrendingUp } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const timer = setTimeout(() => {
        setLocation('/');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, setLocation]);

  // Don't render form if already logged in
  if (user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "success",
      });
      // Navigation will happen automatically via the AuthProvider
    } catch (error: any) {
      // Extract error message from API response
      let errorMessage = 'Invalid email or password';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
            Welcome back
          </CardTitle>
          <p className="text-sm text-secondary-600">
            Sign in to your account to continue
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-password"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Don't have access?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Request access
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
