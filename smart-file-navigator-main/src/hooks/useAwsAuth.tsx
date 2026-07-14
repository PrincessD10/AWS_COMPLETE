import { useState, useEffect, createContext, useContext } from 'react';
import { awsApiService } from '@/services/awsApiService';
import { useToast } from '@/hooks/use-toast';

interface AwsUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'processing-staff' | 'deputy-director';
}

interface AwsAuthContextType {
  user: AwsUser | null;
  loading: boolean;
  token: string | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'processing-staff' | 'deputy-director';
  organization?: string;
  department?: string;
}

const AwsAuthContext = createContext<AwsAuthContextType | undefined>(undefined);

export const AwsAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AwsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem('aws_auth_token');
    const storedUser = localStorage.getItem('aws_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('aws_auth_token');
        localStorage.removeItem('aws_auth_user');
      }
    }

    setLoading(false);
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true);

      // Build payload based on role
      const registrationData: any = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      };

      if (data.role === 'processing-staff') {
        registrationData.organization = data.organization;
        registrationData.department = data.department;
      } else if (data.role === 'deputy-director') {
        registrationData.organization = data.organization;
      }

      const response = await awsApiService.register(registrationData);

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      toast({
        title: "Registration Successful",
        description: "Please sign in with your new account.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || 'Unexpected error',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await awsApiService.login({ email, password });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      const { user: userData, token: authToken } = response.data;

      if (!userData || !authToken) {
        throw new Error('Invalid login response format');
      }

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('aws_auth_token', authToken);
      localStorage.setItem('aws_auth_user', JSON.stringify(userData));

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || 'Unexpected error',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aws_auth_token');
    localStorage.removeItem('aws_auth_user');

    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const value = {
    user,
    loading,
    token,
    signUp,
    signIn,
    signOut,
  };

  return <AwsAuthContext.Provider value={value}>{children}</AwsAuthContext.Provider>;
};

export const useAwsAuth = () => {
  const context = useContext(AwsAuthContext);
  if (context === undefined) {
    throw new Error('useAwsAuth must be used within an AwsAuthProvider');
  }
  return context;
};

