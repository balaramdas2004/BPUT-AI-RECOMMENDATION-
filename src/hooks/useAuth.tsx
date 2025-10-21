import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'student' | 'employer' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
        setLoading(false);
        return;
      }

      if (!data) {
        console.warn('No role found for user');
        setRole(null);
        setLoading(false);
        return;
      }

      setRole(data.role as UserRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('Auth signup error:', error);
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(`Signup failed: ${error.message}`);
        }
        return { error };
      }
      
      if (!data.user) {
        const noUserError = new Error('Signup failed - no user returned');
        toast.error('Signup failed. Please try again.');
        return { error: noUserError };
      }

      console.log('✓ User created:', data.user.id);

      // Step 2: Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: selectedRole });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        toast.error(`Failed to assign role: ${roleError.message}`);
        return { error: roleError };
      }

      console.log('✓ User role created:', selectedRole);

      // Step 3: Create role-specific profile
      try {
        if (selectedRole === 'student') {
          const { error: studentError } = await supabase
            .from('students')
            .insert({ user_id: data.user.id });
          
          if (studentError) {
            console.error('Error creating student profile:', studentError);
            toast.error(`Failed to create student profile: ${studentError.message}`);
            return { error: studentError };
          }
          console.log('✓ Student profile created');
          
        } else if (selectedRole === 'employer') {
          const { error: employerError } = await supabase
            .from('employers')
            .insert({ 
              user_id: data.user.id, 
              company_name: fullName || 'My Company',
              verification_status: 'pending'
            });
          
          if (employerError) {
            console.error('Error creating employer profile:', employerError);
            toast.error(`Failed to create employer profile: ${employerError.message}`);
            return { error: employerError };
          }
          console.log('✓ Employer profile created');
          
        } else if (selectedRole === 'admin') {
          const { error: adminError } = await supabase
            .from('admins')
            .insert({ user_id: data.user.id });
          
          if (adminError) {
            console.error('Error creating admin profile:', adminError);
            toast.error(`Failed to create admin profile: ${adminError.message}`);
            return { error: adminError };
          }
          console.log('✓ Admin profile created');
        }
      } catch (profileError: any) {
        console.error('Profile creation error:', profileError);
        return { error: profileError };
      }

      toast.success('Account created successfully! You can now sign in.');
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      toast.error('An unexpected error occurred during signup.');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else {
          toast.error(`Sign in failed: ${error.message}`);
        }
        return { error };
      }
      
      if (!data.user) {
        const noUserError = new Error('Sign in failed - no user returned');
        toast.error('Sign in failed. Please try again.');
        return { error: noUserError };
      }
      
      toast.success('Signed in successfully!');
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      toast.error('An unexpected error occurred during sign in.');
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
      return;
    }
    setUser(null);
    setSession(null);
    setRole(null);
    toast.success('Signed out successfully');
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(`Failed to send reset email: ${error.message}`);
        return { error };
      }

      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected password reset error:', error);
      toast.error('An unexpected error occurred.');
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
