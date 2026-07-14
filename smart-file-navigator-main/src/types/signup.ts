export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  organization: string;
  department: string;
}

export interface SignupFormProps {
  onBack: () => void;
}