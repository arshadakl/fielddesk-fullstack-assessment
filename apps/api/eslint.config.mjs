import nestConfig from '@fielddesk/eslint-config/nest';

export default [
  ...nestConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
];
