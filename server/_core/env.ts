export const ENV = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  // RENDER_EXTERNAL_URL is auto-injected by Render on every web service —
  // used so password-reset links work there without hardcoding/guessing the URL.
  appUrl: process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000",
};
