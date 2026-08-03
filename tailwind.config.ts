import type {
  Config,
} from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          primary:
            '#071827',

          secondary:
            '#0B7491',

          hover:
            '#095F77',

          accent:
            '#67E8F9',

          subtle:
            '#E6F6FA',

          soft:
            '#F0FAFC',
        },

        surface: {
          DEFAULT:
            '#FFFFFF',

          page:
            '#F8FAFC',

          muted:
            '#F1F5F9',

          soft:
            '#F8FAFC',

          dark:
            '#071827',

          elevated:
            '#FFFFFF',
        },

        content: {
          primary:
            '#071827',

          secondary:
            '#475569',

          muted:
            '#64748B',

          subtle:
            '#94A3B8',

          inverse:
            '#FFFFFF',
        },

        border: {
          DEFAULT:
            '#E2E8F0',

          subtle:
            '#F1F5F9',

          strong:
            '#CBD5E1',

          brand:
            '#B7E2EC',

          inverse:
            'rgba(255, 255, 255, 0.10)',
        },

        status: {
          success:
            '#047857',

          successBackground:
            '#ECFDF5',

          successBorder:
            '#A7F3D0',

          warning:
            '#B45309',

          warningBackground:
            '#FFFBEB',

          warningBorder:
            '#FDE68A',

          danger:
            '#BE123C',

          dangerBackground:
            '#FFF1F2',

          dangerBorder:
            '#FECDD3',

          info:
            '#075985',

          infoBackground:
            '#F0F9FF',

          infoBorder:
            '#BAE6FD',
        },
      },

      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          'Arial',
          'sans-serif',
        ],

        display: [
          'var(--font-sans)',
          'Inter',
          'Arial',
          'sans-serif',
        ],
      },

      fontSize: {
        'display-xs': [
          '1.875rem',
          {
            lineHeight:
              '1.15',

            letterSpacing:
              '-0.02em',

            fontWeight:
              '700',
          },
        ],

        'display-sm': [
          '2.25rem',
          {
            lineHeight:
              '1.12',

            letterSpacing:
              '-0.025em',

            fontWeight:
              '700',
          },
        ],

        'display-md': [
          '3rem',
          {
            lineHeight:
              '1.08',

            letterSpacing:
              '-0.03em',

            fontWeight:
              '700',
          },
        ],

        'label-xs': [
          '0.625rem',
          {
            lineHeight:
              '1rem',

            letterSpacing:
              '0.14em',

            fontWeight:
              '700',
          },
        ],

        'label-sm': [
          '0.75rem',
          {
            lineHeight:
              '1rem',

            letterSpacing:
              '0.18em',

            fontWeight:
              '700',
          },
        ],
      },

      borderRadius: {
        card:
          '1rem',

        panel:
          '1.5rem',

        shell:
          '2rem',
      },

      boxShadow: {
        card:
          '0 1px 2px 0 rgb(15 23 42 / 0.05)',

        panel:
          '0 8px 24px -16px rgb(15 23 42 / 0.20)',

        elevated:
          '0 18px 48px -28px rgb(15 23 42 / 0.30)',
      },

      spacing: {
        '4.5':
          '1.125rem',

        '5.5':
          '1.375rem',

        '7.5':
          '1.875rem',

        '9.5':
          '2.375rem',
      },

      maxWidth: {
        content:
          '80rem',

        readable:
          '52rem',
      },

      transitionDuration: {
        250:
          '250ms',
      },

      backgroundImage: {
        'brand-line':
          'linear-gradient(to left, rgba(103, 232, 249, 0.30), transparent)',

        'brand-soft':
          'linear-gradient(135deg, #F8FAFC 0%, #F0FAFC 100%)',
      },
    },
  },

  plugins: [],
}

export default config