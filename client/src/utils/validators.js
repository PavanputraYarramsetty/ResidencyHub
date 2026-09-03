export function validatePhone(phone) {
  if (!phone) return 'Phone number is required';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return 'Phone number must be at least 10 digits';
  if (cleaned.length > 13) return 'Phone number is too long';
  return null;
}

export function validateAadhar(aadhar) {
  if (!aadhar) return null; // Optional
  const cleaned = aadhar.replace(/\s/g, '');
  if (cleaned.length !== 12) return 'Aadhar number must be 12 digits';
  if (!/^\d+$/.test(cleaned)) return 'Aadhar number must contain only digits';
  return null;
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateAge(age) {
  if (!age) return null; // Optional
  const num = Number(age);
  if (isNaN(num) || num < 1 || num > 150) return 'Please enter a valid age';
  return null;
}

export function validateBookingForm(data) {
  const errors = {};

  const nameErr = validateRequired(data.full_name, 'Customer name');
  if (nameErr) errors.full_name = nameErr;

  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;

  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  const aadharErr = validateAadhar(data.aadhar_number);
  if (aadharErr) errors.aadhar_number = aadharErr;

  if (!data.booking_date) errors.booking_date = 'Booking date is required';

  return Object.keys(errors).length > 0 ? errors : null;
}
