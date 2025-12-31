module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-refresh',
  ],
  settings: {
    react: {
      version: '18.2',
    },
  },
  rules: {
    // React Refresh
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // TypeScript-specific
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // React-specific
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with React 18+ JSX transform

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-case-declarations': 'error',
  },
  overrides: [
    {
      // Enable type-aware linting for source files only
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
};
