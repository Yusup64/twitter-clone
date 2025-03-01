// src/shared/config/index.ts
export const CONFIG = {
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRATION: '12h',
    REFRESH_EXPIRATION: '7d',
  },
};
