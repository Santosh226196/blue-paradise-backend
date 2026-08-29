import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import duePaymentsRoutes from "./routes/duePayments.routes.js";
import { membershipPlansRouter, staffRouter, scheduleRouter, announcementsRouter } from "./routes/resource.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes("*") || env.clientOrigins.includes(origin)) return callback(null, true);
    callback(Object.assign(new Error("Origin is not allowed by CORS"), { statusCode: 403 }));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (env.nodeEnv !== "test") app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "blue-paradise-backend" }));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/customers", requireAuth, customersRoutes);
app.use("/api/billing", requireAuth, billingRoutes);
app.use("/api/reports", requireAuth, reportsRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/membership-plans", requireAuth, membershipPlansRouter);
app.use("/api/staff", requireAuth, staffRouter);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/due-payments", requireAuth, duePaymentsRoutes);
app.use("/api/schedule", requireAuth, scheduleRouter);
app.use("/api/announcements", requireAuth, announcementsRouter);

app.use(notFound);
app.use(errorHandler);
export default app;
