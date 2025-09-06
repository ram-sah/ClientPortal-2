import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth-context";
import { ProtectedRoute } from "./components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Projects from "./pages/projects";
import Reports from "./pages/reports";
import Audits from "./pages/audits";
import Users from "./pages/users";
import Companies from "./pages/companies";
import AccessRequests from "./pages/access-requests";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute requiredRoles={['owner', 'admin', 'client', 'partner']}>
          <Reports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/audits">
        <ProtectedRoute requiredRoles={['owner', 'admin', 'client', 'partner']}>
          <Audits />
        </ProtectedRoute>
      </Route>
      
      {/* Admin only routes */}
      <Route path="/users">
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <Users />
        </ProtectedRoute>
      </Route>
      
      <Route path="/companies">
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <Companies />
        </ProtectedRoute>
      </Route>
      
      <Route path="/access-requests">
        <ProtectedRoute requiredRoles={['owner', 'admin']}>
          <AccessRequests />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
