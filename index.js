import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/userRoutes.js";
import CategorieRoutes from "./routes/categorieRoutes.js";
import eventRoutes from "./routes/event.routes.js";
import inscriptionRoutes from "./routes/inscriptions.route.js";
import commentaireRoutes from "./routes/commentaire.route.js";
import adminRoutes from "./routes/admin.routes.js";
import messageRoutes from "./routes/message.route.js";
import paymentRoutes from "./routes/payment.routes.js";
import gestionnaireRoutes from "./routes/gestionnaire.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//  Définir corsOption AVANT de l'utiliser
const corsOption = {
  origin: "http://localhost:5173",
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
//Categorie routes
app.use("/api/categories", CategorieRoutes);
//events routes
app.use("/api/events", eventRoutes);
//image route
app.use("/images", express.static("public/images"));
//inscription routes
app.use("/api/inscription", inscriptionRoutes);
//commentaires routes
app.use("/api/commentaires", commentaireRoutes);
//admin routes
app.use("/api/admin", adminRoutes);
app.use("/api/gestionnaire", gestionnaireRoutes);

//message routes
app.use("/api/message", messageRoutes);
//payments routes
app.use("/api/payments", paymentRoutes);


app.get("/home", (req, res) => {
  return res
    .status(200)
    .json({ message: "hello from backend", success: true });
});

// Connexion à la base de données et démarrage du serveur
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("❌ Could not start server:", err));
