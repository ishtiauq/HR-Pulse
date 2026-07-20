/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // M3 Monochrome Light
        'md-sys-primary': '#000000',
        'md-sys-on-primary': '#FFFFFF',
        'md-sys-primary-container': '#E9ECEF',
        'md-sys-on-primary-container': '#000000',
        
        'md-sys-secondary': '#495057',
        'md-sys-on-secondary': '#FFFFFF',
        'md-sys-secondary-container': '#E9ECEF',
        'md-sys-on-secondary-container': '#121212',
        
        'md-sys-tertiary': '#343A40',
        'md-sys-on-tertiary': '#FFFFFF',
        'md-sys-tertiary-container': '#DEE2E6',
        'md-sys-on-tertiary-container': '#121212',
        
        'md-sys-error': '#DC3545',
        'md-sys-on-error': '#FFFFFF',
        'md-sys-error-container': '#F8D7DA',
        'md-sys-on-error-container': '#721C24',
        
        'md-sys-background': '#F8F9FA',
        'md-sys-on-background': '#121212',
        
        'md-sys-surface': '#F8F9FA',
        'md-sys-on-surface': '#121212',
        
        'md-sys-surface-container-lowest': '#FFFFFF',
        'md-sys-surface-container-low': '#FFFFFF',
        'md-sys-surface-container': '#FFFFFF',
        'md-sys-surface-container-high': '#E9ECEF',
        'md-sys-surface-container-highest': '#DEE2E6',
        
        'md-sys-outline': '#6C757D',
        'md-sys-outline-variant': '#E9ECEF',
        
        'md-sys-surface-variant': '#E9ECEF',
        'md-sys-on-surface-variant': '#6C757D',
        
        'md-sys-inverse-surface': '#121212',
        'md-sys-inverse-on-surface': '#F8F9FA',
        'md-sys-inverse-primary': '#FFFFFF',
        
        'md-sys-shadow': '#000000',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-large': ['57px', { lineHeight: '64px', fontWeight: '400', letterSpacing: '-0.25px' }],
        'display-medium': ['45px', { lineHeight: '52px', fontWeight: '400', letterSpacing: '0' }],
        'display-small': ['36px', { lineHeight: '44px', fontWeight: '400', letterSpacing: '0' }],
        'headline-large': ['32px', { lineHeight: '40px', fontWeight: '400', letterSpacing: '0' }],
        'headline-medium': ['28px', { lineHeight: '36px', fontWeight: '400', letterSpacing: '0' }],
        'headline-small': ['24px', { lineHeight: '32px', fontWeight: '400', letterSpacing: '0' }],
        'title-large': ['22px', { lineHeight: '28px', fontWeight: '500', letterSpacing: '0' }],
        'title-medium': ['16px', { lineHeight: '24px', fontWeight: '500', letterSpacing: '0.15px' }],
        'title-small': ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-large': ['16px', { lineHeight: '24px', fontWeight: '400', letterSpacing: '0.15px' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.25px' }],
        'body-small': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0.4px' }],
        'label-large': ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'label-medium': ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.5px' }],
        'label-small': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        'md-sys-xs': '4px',
        'md-sys-sm': '8px',
        'md-sys-md': '12px',
        'md-sys-lg': '16px',
        'md-sys-xl': '24px',
        'md-sys-full': '9999px',
      },
      boxShadow: {
        'md-sys-elevation-1': '0 1px 2px rgba(0,0,0,0.03), 0 1px 3px 1px rgba(0,0,0,0.05)',
        'md-sys-elevation-2': '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px 2px rgba(0,0,0,0.05)',
        'md-sys-elevation-3': '0 1px 3px rgba(0,0,0,0.04), 0 4px 8px 3px rgba(0,0,0,0.06)',
        'md-sys-elevation-4': '0 2px 3px rgba(0,0,0,0.04), 0 6px 10px 4px rgba(0,0,0,0.07)',
        'md-sys-elevation-5': '0 4px 4px rgba(0,0,0,0.05), 0 8px 12px 6px rgba(0,0,0,0.08)',
      },
      transitionDuration: {
        'md-sys-short': '150ms',
        'md-sys-medium': '250ms',
        'md-sys-long': '350ms',
      },
      transitionTimingFunction: {
        'md-sys-ease': 'cubic-bezier(0.2, 0, 0, 1)',
        'md-sys-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'md-sys-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'md-sys-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}