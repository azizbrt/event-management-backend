import express from "express";
import { afficherCommentaires, ajouterResponse, creerCommentaire, modifierCommentaire, supprimerCommentaire } from "../Controllers/commentaire.controlles.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";

const router = express.Router();

// 🛠️ Route pour créer un commentaire (⚠️ verifyToken doit être AVANT le contrôleur)
router.post("/creecommentaire", verifyToken, creerCommentaire);
//modifier un commentaire
router.put("/modifiercommentaire/:id",verifyToken,modifierCommentaire)
//supprimer un commentaire
router.delete("/supprimercommentaire/:id",verifyToken,verifyRole("gestionnaire", "admin"),supprimerCommentaire);
//afficher les commentaire (10 comments par page defauler)
router.get("/affcommentaire/:id",afficherCommentaires)
//repond au commentaire
router.post("/repondrecommentaire/:id",ajouterResponse);

export default router;
