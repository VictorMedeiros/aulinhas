// A central place to define our app's colors and theme constants

export const colors = {
  primary: {
    50: '#ebf5ff',
    100: '#e1effe',
    200: '#c3ddfd',
    300: '#a4cafe',
    400: '#76a9fa',
    500: '#3f83f8', // Primary brand color
    600: '#1c64f2',
    700: '#1a56db',
    800: '#1e429f',
    900: '#233876',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    500: '#10b981', // Green for success messages
  },
  error: {
    500: '#ef4444', // Red for error messages
  },
  warning: {
    500: '#f59e0b', // Yellow/orange for warnings
  },
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem' // 40px
};

export const borderRadius = {
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}
