import { SignupFormData } from '@/types/signup';

export const validateSignupForm = (formData: SignupFormData) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'role'];

  if (formData.role === 'processing-staff') {
    requiredFields.push('organization', 'department');
  } else if (formData.role === 'deputy-director') {
    requiredFields.push('organization'); // only organization required
  }

  const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

  if (missingFields.length > 0) {
    return { isValid: false, error: `Missing fields: ${missingFields.join(', ')}` };
  }

  if (formData.password !== formData.confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: null };
};
