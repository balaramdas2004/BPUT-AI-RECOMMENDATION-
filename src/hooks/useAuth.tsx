import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'student' | 'employer' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  switchRole: (role: UserRole) => void;
  addRoleToAccount: (role: UserRole, fullName?: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user roles when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setActiveRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
        setActiveRole(null);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No roles found for user');
        setRoles([]);
        setActiveRole(null);
        setLoading(false);
        return;
      }

      const userRoles = data.map(r => r.role as UserRole);
      setRoles(userRoles);
      
      // Set active role from localStorage or default to first role
      const savedRole = localStorage.getItem('activeRole') as UserRole;
      if (savedRole && userRoles.includes(savedRole)) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(userRoles[0]);
        localStorage.setItem('activeRole', userRoles[0]);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([]);
      setActiveRole(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (role: UserRole) => {
    if (roles.includes(role)) {
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
      navigate(`/${role}/dashboard`);
      toast.success(`Switched to ${role} portal`);
    }
  };

  const addRoleToAccount = async (selectedRole: UserRole, fullName?: string) => {
    try {
      if (!user) {
        toast.error('Please sign in first');
        return { error: new Error('No user') };
      }

      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', selectedRole)
        .maybeSingle();

      if (existingRole) {
        toast.error(`You already have the ${selectedRole} role`);
        return { error: new Error('Role already exists') };
      }

      // Add the new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: selectedRole });

      if (roleError) {
        console.error('Error adding role:', roleError);
        toast.error(`Failed to add role: ${roleError.message}`);
        return { error: roleError };
      }

      // Create role-specific profile
      if (selectedRole === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({ user_id: user.id });
        
        if (studentError) {
          console.error('Error creating student profile:', studentError);
          toast.error(`Failed to create student profile: ${studentError.message}`);
          return { error: studentError };
        }
      } else if (selectedRole === 'employer') {
        const { error: employerError } = await supabase
          .from('employers')
          .insert({ 
            user_id: user.id, 
            company_name: fullName || 'My Company',
            verification_status: 'pending'
          });
        
        if (employerError) {
          console.error('Error creating employer profile:', employerError);
          toast.error(`Failed to create employer profile: ${employerError.message}`);
          return { error: employerError };
        }
      } else if (selectedRole === 'admin') {
        const { error: adminError } = await supabase
          .from('admins')
          .insert({ user_id: user.id });
        
        if (adminError) {
          console.error('Error creating admin profile:', adminError);
          toast.error(`Failed to create admin profile: ${adminError.message}`);
          return { error: adminError };
        }
      }

      // Refresh roles
      await fetchUserRoles(user.id);
      toast.success(`${selectedRole} role added successfully!`);
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error adding role:', error);
      toast.error('An unexpected error occurred.');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // First, check if user already exists
      const { data: existingSession } = await supabase.auth.getSession();
      
      if (existingSession?.session?.user) {
        // User is already signed in, add role instead
        return await addRoleToAccount(selectedRole, fullName);
      }

      // Try to sign up
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
        // Check if user already exists
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('This email is already registered. Please sign in to add this role to your account.');
          return { error };
        }
        console.error('Auth signup error:', error);
        toast.error(`Signup failed: ${error.message}`);
        return { error };
      }
      
      if (!data.user) {
        const noUserError = new Error('Signup failed - no user returned');
        toast.error('Signup failed. Please try again.');
        return { error: noUserError };
      }

      console.log('✓ User created:', data.user.id);

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: selectedRole });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        toast.error(`Failed to assign role: ${roleError.message}`);
        return { error: roleError };
      }

      console.log('✓ User role created:', selectedRole);

      // Create role-specific profile
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
    setRoles([]);
    setActiveRole(null);
    localStorage.removeItem('activeRole');
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
    <AuthContext.Provider value={{ 
      user, 
      session, 
      roles, 
      activeRole, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      resetPassword,
      switchRole,
      addRoleToAccount
    }}>
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
