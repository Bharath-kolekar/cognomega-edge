import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
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
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
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
    },
  },
];