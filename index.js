import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
//middleware
app.use(express.json());//allow us to parse icoming request :req.body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOption = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.get("/home", (req, res) => {
  return res
    .status(200)
    .json({ message: "ena jit mel backend ya sayed ooyyyy", sucess: true });
});
app.use("/api/auth",authRoutes);
app.use(cors(corsOption));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch(err => console.log("❌ Could not start server:", err));