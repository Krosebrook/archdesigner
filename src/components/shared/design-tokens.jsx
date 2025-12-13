// 🎬 Cinema-Grade Design System Tokens
// Full-frame production standards with studio-quality details

export const designTokens = {
  // Typography System - Space Grotesk + Inter
  typography: {
    fontFamily: {
      heading: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
      body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace'
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem'  // 60px
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },

  // Cinema-grade color grading (teal-orange, muted pastels)
  colors: {
    cinematic: {
      teal: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a'
      },
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12'
      },
      slate: {
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
        950: '#020617'
      }
    }
  },

  // Studio lighting effects
  lighting: {
    keyLight: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.25))',
    fillLight: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))',
    rimLight: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
    goldenHour: 'drop-shadow(0 10px 30px rgba(251, 146, 60, 0.3))',
    rgbEdge: `
      drop-shadow(2px 0 0 rgba(59, 130, 246, 0.5))
      drop-shadow(-2px 0 0 rgba(236, 72, 153, 0.5))
    `
  },

  // Depth system (8px baseline)
  spacing: {
    0: '0',
    1: '0.5rem',   // 8px
    2: '1rem',     // 16px
    3: '1.5rem',   // 24px
    4: '2rem',     // 32px
    5: '2.5rem',   // 40px
    6: '3rem',     // 48px
    8: '4rem',     // 64px
    10: '5rem',    // 80px
    12: '6rem',    // 96px
    16: '8rem'     // 128px
  },

  // Professional shadow system
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(99, 102, 241, 0.4)',
    cinematic: '0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 18px 36px -18px rgba(0, 0, 0, 0.3)'
  },

  // Animation timing (Disney's 12 Principles adapted)
  animation: {
    // Easing curves
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Standard smooth
      snappy: 'cubic-bezier(0.4, 0, 0.6, 1)',      // Quick & responsive
      gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',  // Soft & gentle
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful bounce
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'  // Spring physics
    },
    
    // Duration scale
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      glacial: '1000ms'
    },

    // Stagger delays for sequential animations
    stagger: {
      fast: 50,
      normal: 100,
      slow: 150
    }
  },

  // Glassmorphism presets
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropBlur: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.18)'
    },
    dark: {
      background: 'rgba(15, 23, 42, 0.7)',
      backdropBlur: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    colored: {
      background: 'rgba(99, 102, 241, 0.15)',
      backdropBlur: 'blur(16px)',
      border: '1px solid rgba(99, 102, 241, 0.2)'
    }
  },

  // Cinematic lens effects
  lens: {
    bokeh: {
      filter: 'blur(0px)',
      transition: 'filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    vignette: {
      background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
    },
    chromaticAberration: {
      filter: `
        drop-shadow(2px 0 0 rgba(255, 0, 0, 0.3))
        drop-shadow(-2px 0 0 rgba(0, 0, 255, 0.3))
      `
    }
  },

  // Grid system
  grid: {
    columns: 12,
    gutter: '1rem', // 16px
    margin: '1.5rem' // 24px
  },

  // Breakpoints
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Utility function to get token
export const token = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], designTokens);
};

export default designTokens;