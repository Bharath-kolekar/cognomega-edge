import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  // Main configuration for TypeScript/React files
  {
<<<<<<< HEAD
    files: [
      'src/**/*.{ts,tsx}',
      'packages/**/*.{ts,tsx}'
=======
    // Ignore files outside of packages and src directories
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/out/**',
      'imports/**',
      '_ops/**',
      'proxy/**',
      'eslint.config.js',
      'tailwind.config.cjs',
      'postcss.config.cjs',
      'index.html',
      '**/vite.config.ts',
      '**/vite.config.js',
      '**/legacy/**',
      '**/functions/**',
>>>>>>> 4f266197cacbf600be251d50d18e29c95aea3055
    ],
  },
  {
    // TypeScript files in packages and src
    files: ['packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
<<<<<<< HEAD
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly'
=======
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
>>>>>>> 4f266197cacbf600be251d50d18e29c95aea3055
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react': reactPlugin,
    },
    rules: {
<<<<<<< HEAD
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
=======
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        }
      ],
    },
  },
  {
    // JavaScript files - no type checking
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-var-requires': 'off',
>>>>>>> 4f266197cacbf600be251d50d18e29c95aea3055
    },
  },

  // Configuration for JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react': reactPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Global ignores for problematic directories
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      'packages/si-core/dist/**',
      'imports/v0-20250927-003305/**',
      '_ops/snapshot/**',
      'proxy/**',
      'packages/frontend/legacy/**',
      '**/*.d.ts',
      '**/*.min.js',
      '**/*.min.css',
      '**/*.config.js',
      '**/*.config.ts',
    ]
  },
];