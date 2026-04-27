export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name)
}

export const validateLocation = (location: { country: string; city: string }): boolean => {
  return location.country.trim().length > 0 && location.city.trim().length > 0
}

export const validateOnboardingStep = (step: number, formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  switch (step) {
    case 1: // Avatar
      if (!formData.avatar) {
        errors.push("Please select an avatar")
      }
      break

    case 2: // Personal Info
      if (!validateName(formData.firstName)) {
        errors.push("Please enter a valid first name")
      }
      if (!validateName(formData.lastName)) {
        errors.push("Please enter a valid last name")
      }
      if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
        errors.push("Please enter a valid phone number")
      }
      break

    case 3: // Location
      if (!validateLocation(formData.location)) {
        errors.push("Please enter your country and city")
      }
      break

    case 4: // Interests
      if (formData.interests.length === 0) {
        errors.push("Please select at least one interest")
      }
      break

    case 5: // Style
      if (formData.stylePreferences.length === 0) {
        errors.push("Please select at least one style preference")
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
