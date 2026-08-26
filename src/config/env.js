import dotenv from "dotenv";

dotenv.config({ quiet: true });

const requiredInProduction = ["MONGODB_URI", "JWT_SECRET"];
if (process.env.NODE_ENV === "production") {
  for (const key of requiredInProduction) {
    if (!process.env[key]) throw new Error(`${key} is required in production`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/blue_paradise",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@blueparadise.com",
  adminMobile: process.env.ADMIN_MOBILE ?? "9876543210",
  exposeDemoOtp: process.env.EXPOSE_DEMO_OTP === "true",
};
