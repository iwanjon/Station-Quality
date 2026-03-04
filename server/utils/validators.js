// utils/validators.js

export const isValidEmail = (email) => {
    // A standard Regex pattern that ensures the email has a name, an '@', a domain, and a '.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password) => {
    // Checks if it exists, is a string, and is at least 4 characters long
    return typeof password === 'string' && password.length >= 4;
};