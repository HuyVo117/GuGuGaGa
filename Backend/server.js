import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import adminRouter from "./routes/admin.route.js";
import publicRouter from "./routes/public.route.js";
import shipperRouter from "./routes/shipper.route.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

app.use(cors());
app.use(express.json());

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/shipper", shipperRouter);
app.use("/api/public", publicRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});