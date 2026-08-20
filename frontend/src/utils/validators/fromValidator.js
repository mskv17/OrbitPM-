function validationResponse(isValid, message) {
  return {
    isValid,
    message,
  };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return validationResponse(false, "Please provide a valid email address");
  }
  return validationResponse(true, "Email is valid");
}

export function validatePassword(password, confirmPassword = null) {
  if (confirmPassword !== null && password !== confirmPassword) {
    return validationResponse(false, "Passwords do not match");
  }
  if (password.length < 6) {
    return validationResponse(
      false,
      "Password must be at least 6 characters long"
    );
  }
  return validationResponse(true, "Password is valid");
}

export function validateName(name) {
  if (!name || name.trim() === "") {
    return validationResponse(false, "Name is required");
  }
  return validationResponse(true, "Name is valid");
}

export function validateSignUpForm({ name, email, password, confirmPassword }) {
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
        return nameValidation;
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        return emailValidation;
    }
    const passwordValidation = validatePassword(password, confirmPassword);
    if (!passwordValidation.isValid) {
        return passwordValidation;
    }
    return validationResponse(true, "All fields are valid");
}

export function validateLoginForm({ email, password }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        return emailValidation;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return passwordValidation;
    }
    return validationResponse(true, "Login credentials are valid");
}