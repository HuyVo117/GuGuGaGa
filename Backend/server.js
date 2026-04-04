import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRouter from "./routes/admin.route.js";
import publicRouter from "./routes/public.route.js";
import shipperRouter from "./routes/shipper.route.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

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