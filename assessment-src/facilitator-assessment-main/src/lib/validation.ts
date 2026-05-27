// Email validation
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// Phone number validation (Nigerian format)
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove spaces, dashes, and plus sign for validation
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Nigerian phone numbers:
  // - 11 digits starting with 0 (e.g., 09087564732)
  // - 10 digits without leading 0 (e.g., 9087645678)
  // - 13 digits starting with 234 (e.g., 2349087564732)
  const nigerianPattern = /^(0[789][01]\d{8}|[789][01]\d{8}|234[789][01]\d{8})$/;
  
  // Also allow international format with country code (10-15 digits)
  const internationalPattern = /^\d{10,15}$/;
  
  return nigerianPattern.test(cleaned) || internationalPattern.test(cleaned);
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};
