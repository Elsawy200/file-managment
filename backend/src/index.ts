import express from "express";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 3000;
import authRoutes from "./modules/user/auth.route.js";
import fileRoutes from "./modules/files/files.route.js";
import adminRoutes from "./modules/admin/admin.route.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import "dotenv/config";

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
