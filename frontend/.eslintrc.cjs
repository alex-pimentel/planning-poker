/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: '19.0' },
  },
  plugins: ['react-refresh'],
  ignorePatterns: ['dist/', '.wrangler/', 'node_modules/'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': 'off',
    'react/no-unknown-property': ['error', {
      ignore: [
        'position', 'rotation', 'scale', 'args', 'map',
        'metalness', 'roughness', 'intensity', 'castShadow', 'receiveShadow',
        'emissive', 'emissiveIntensity',
        'shadow-mapSize-width', 'shadow-mapSize-height',
      ],
    }],
  },
};
