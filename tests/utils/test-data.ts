// tests/utils/test-data.ts

export const defaultUser = {
  email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
  password: process.env.TEST_USER_PASSWORD ?? 'ChangeMe123!',
};

