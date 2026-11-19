import 'dotenv/config';

const required = [ 'MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'GROQ_API_KEY' ];
for (const key of required) {
  if (!process.env[ key ]?.trim()) throw new Error(`Missing required environment variable: ${key}`);
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (![ 'development', 'test', 'production' ].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}
const port = Number(process.env.PORT || 5001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
if (!/^mongodb(\+srv)?:\/\/\S+$/.test(process.env.MONGODB_URI)) {
  throw new Error('MONGODB_URI must be a MongoDB connection string');
}
for (const key of [ 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET' ]) {
  if (process.env[ key ].length < 32) throw new Error(`${key} must contain at least 32 characters`);
}
if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('Access and refresh token secrets must be different');
}

export const env = Object.freeze({
  nodeEnv,
  port,
  mongoUri: process.env.MONGODB_URI,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
});
