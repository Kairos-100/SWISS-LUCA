// Utilidades para manejo de errores de autenticación de Firebase
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email format';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/invalid-credential':
      return 'Invalid credentials';
    default:
      return 'Authentication error. Please try again';
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  return { isValid: true, message: '' };
};

export const validateName = (name: string): { isValid: boolean; message: string } => {
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  return { isValid: true, message: '' };
};

