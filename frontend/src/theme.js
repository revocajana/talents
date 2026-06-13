/**
 * Centralized Theme Configuration
 * 
 * All colors and styling constants are defined here.
 * Change values here to update the entire application.
 */

export const colors = {
  primary: '#1E3A8A',      // Main brand color (blue from logo)
  background: '#ffffff',   // Page background
  text: '#000000',         // Primary text color
  textLight: '#666666',    // Secondary text color
  border: '#e5e5e5',       // Border color
  hover: '#0f2d6a',        // Hover state for primary color
};

export const theme = {
  colors,
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    large: '1280px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
};

export default theme;
