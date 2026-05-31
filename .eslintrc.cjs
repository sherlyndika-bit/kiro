/* ESLint configuration for the Sudut Ruang dashboard (Vite + React + TS). */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  ignorePatterns: [
    'dist',
    'node_modules',
    'n8n-workflows',
    '.eslintrc.cjs',
    'postcss.config.js',
    'tailwind.config.js',
    'vite.config.ts',
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    // The data layer polls on intervals; exhaustive-deps would add noise here.
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
    // Webhook/Supabase payloads are intentionally loosely typed.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
}
