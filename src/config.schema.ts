import * as Joi from '@hapi/joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432).required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  // Redis (optional)
  REDIS_URL: Joi.string(),
  REDIS_HOST: Joi.string(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string(),
  REDIS_DB: Joi.number(),
  // Back-compat: allow existing JWT_SECRET, but prefer JWT_ACCESS_SECRET moving forward.
  JWT_SECRET: Joi.string(),
  JWT_ACCESS_SECRET: Joi.string(),
  JWT_REFRESH_SECRET: Joi.string().default('defaultRefreshSecret'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('60s'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
}).or('JWT_SECRET', 'JWT_ACCESS_SECRET');
