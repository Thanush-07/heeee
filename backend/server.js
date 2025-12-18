
// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import companyRouter from "./routes/company.js";
import authRouter from "./routes/auth.js";
import institutionRouter from "./routes/institution.js";
import branchRouter from "./routes/branch.js";
import inventoryRouter from "./routes/inventory.js";
import staffRouter from "./routes/staff.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/first-crop_db";
  //  process.env.MONGO_URL||"mongodb+srv://DTW:secret123@cluster0.vwhagph.mongodb.net/DTW?appName=Cluster0"; //Atlas
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use("/api/company", companyRouter);
app.use("/api/auth", authRouter);
app.use("/api/institution", institutionRouter);
app.use("/api/branch", branchRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/staff", staffRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
