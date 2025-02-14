import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔴 Définir corsOption AVANT de l'utiliser
const corsOption = {
  origin: "http://localhost:3000",
  credentials: true,
};

// Middleware
app.use(cors(corsOption)); //   correctement
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
//user routes
app.use("/api/users", userRoutes);

app.get("/home", (req, res) => {
  return res
    .status(200)
    .json({ message: "ena jit mel backend ya sayed ooyyyy", success: true });
});

// Connexion à la base de données et démarrage du serveur
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("❌ Could not start server:", err));
