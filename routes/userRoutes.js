import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";

const router = express.Router();

// Seuls les admins peuvent accéder
router.get("/admin", verifyToken, verifyRole("admin"), (req, res) => {
    res.json({ success: true, message: "Bienvenue sur le tableau de bord Admin" });
});

// Admin et gestionnaire ont accès
router.get("/manager", verifyToken, verifyRole(["admin", "gestionnaire"]), (req, res) => {
    res.json({ success: true, message: "Bienvenue sur le tableau de bord Gestionnaire" });
});

// Tous les utilisateurs connectés (participant inclus) peuvent accéder
router.get("/participant", verifyToken, verifyRole(["admin", "gestionnaire", "participant"]), (req, res) => {
    res.json({ success: true, message: "Bienvenue sur votre espace particiânt" });
});

//  Route publique accessible à tout le monde
router.get("/public", (req, res) => {
    res.json({ success: true, message: "Bienvenue sur le site public" });
});

export default router;
