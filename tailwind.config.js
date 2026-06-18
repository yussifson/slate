/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)'],
  			playfair: ['"Playfair Display"', 'Georgia', 'serif'],
  			dmsans: ['"DM Sans"', 'system-ui', 'sans-serif']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xs: '4px',
  			'2xl': '16px',
  			'3xl': '20px'
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'5.5': '1.375rem',
  			'7.5': '1.875rem',
  			'8.5': '2.125rem',
  			'9.5': '2.375rem'
  		},
  		fontSize: {
  			xs: ['12px', { lineHeight: '16px', letterSpacing: '0.3px' }],
  			sm: ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
  			base: ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
  			lg: ['18px', { lineHeight: '28px', letterSpacing: '0px' }],
  			xl: ['20px', { lineHeight: '28px', letterSpacing: '0px' }],
  			'2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.5px' }],
  			'3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.5px' }],
  			'4xl': ['36px', { lineHeight: '44px', letterSpacing: '-1px' }]
  		},
  		boxShadow: {
  			'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
  			'elevation-2': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  			'elevation-3': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  			'elevation-4': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  			'elevation-5': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  			'glow-primary': '0 0 20px rgba(16, 185, 129, 0.3)',
  			'glow-accent': '0 0 20px rgba(255, 159, 67, 0.3)'
  		},
  		transitionDuration: {
  			'250': '250ms',
  			'350': '350ms'
  		},
  		colors: {
  			insurance: {
  				50: '#f9f5ff',
  				100: '#f0e6ff',
  				200: '#e1ccff',
  				300: '#cd99ff',
  				400: '#b866ff',
  				500: '#a333ff',
  				600: '#9400FF',
  				700: '#7500cc',
  				800: '#5a0099',
  				900: '#3d0066',
  				950: '#1f0033',
  			},
  			purple: {
  				50: '#f5efff',
  				100: '#ece1ff',
  				200: '#dabcff',
  				300: '#be8aff',
  				400: '#9f4dff',
  				500: '#6F00FF',
  				600: '#5200c2',
  				700: '#3d0099',
  				800: '#290070',
  				900: '#140047',
  				950: '#0a0024',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
			shimmer: {
				'100%': { transform: 'translateX(100%)' },
			},
			'float-up': {
				'0%': { opacity: '0', transform: 'translateY(10px)' },
				'100%': { opacity: '1', transform: 'translateY(0)' }
			},
			'float-down': {
				'0%': { opacity: '1', transform: 'translateY(0)' },
				'100%': { opacity: '0', transform: 'translateY(10px)' }
			},
			'scale-in': {
				'0%': { opacity: '0', transform: 'scale(0.95)' },
				'100%': { opacity: '1', transform: 'scale(1)' }
			},
			'pulse-glow': {
				'0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
				'50%': { opacity: '0.7', boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }
			},
			'slide-in-right': {
				'0%': { opacity: '0', transform: 'translateX(20px)' },
				'100%': { opacity: '1', transform: 'translateX(0)' }
			},
			'slide-in-left': {
				'0%': { opacity: '0', transform: 'translateX(-20px)' },
				'100%': { opacity: '1', transform: 'translateX(0)' }
			},
			'bounce-subtle': {
				'0%, 100%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-5px)' }
			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
			'shimmer': 'shimmer 2.5s infinite',
			'float-up': 'float-up 0.5s ease-out',
			'float-down': 'float-down 0.4s ease-in',
			'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
			'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			'slide-in-right': 'slide-in-right 0.4s ease-out',
			'slide-in-left': 'slide-in-left 0.4s ease-out',
			'bounce-subtle': 'bounce-subtle 1.5s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
