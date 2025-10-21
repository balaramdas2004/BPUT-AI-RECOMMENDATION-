import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'student' | 'employer' | 'admin';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Failed to sign in');
      } else {
        // Redirect based on role will be handled by auth state change
        setTimeout(() => {
          navigate(`/${selectedRole}/dashboard`);
        }, 500);
      }
    } else {
      const fullName = formData.get('fullName') as string;
      const { error } = await signUp(email, password, fullName, selectedRole);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
      } else {
        setTimeout(() => {
          navigate(`/${selectedRole}/dashboard`);
        }, 500);
      }
    }

    setLoading(false);
  };

  const roleConfig = {
    student: {
      icon: GraduationCap,
      title: 'Student Portal',
      description: 'Access career recommendations and job opportunities',
    },
    employer: {
      icon: Building2,
      title: 'Employer Portal',
      description: 'Post jobs and find talented students',
    },
    admin: {
      icon: Shield,
      title: 'Admin Portal',
      description: 'Manage platform and view analytics',
    },
  };

  const RoleIcon = roleConfig[selectedRole].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 overflow-hidden">
      <Card className={`w-full max-w-md transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
      }`}>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4 animate-scale-in">
            <div className="relative">
              <RoleIcon className="w-12 h-12 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-2xl text-center animate-fade-in">
            {roleConfig[selectedRole].title}
          </CardTitle>
          <CardDescription className="text-center animate-fade-in">
            {roleConfig[selectedRole].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 animate-slide-in-right">
              <TabsTrigger value="student" className="transition-all duration-300">Student</TabsTrigger>
              <TabsTrigger value="employer" className="transition-all duration-300">Employer</TabsTrigger>
              <TabsTrigger value="admin" className="transition-all duration-300">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            {!isLogin && (
              <div className="space-y-2 animate-slide-in-right">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="transition-all duration-300 focus:scale-[1.02]"
                />
              </div>
            )}

            <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                className="transition-all duration-300 focus:scale-[1.02]"
              />
            </div>

            <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                className="transition-all duration-300 focus:scale-[1.02]"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full transition-all duration-300 hover:scale-[1.02] hover-scale" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Please wait...
                </span>
              ) : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm animate-fade-in">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline transition-all duration-300 hover:scale-105"
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center animate-fade-in">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              disabled={loading}
              className="transition-all duration-300 hover:scale-105"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
