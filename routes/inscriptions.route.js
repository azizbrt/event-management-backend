import express from "express";
import { annulerInscription, consulterInscriptions, inscrireUtilisateur, supprimerInscription, validerInscription } from "../Controllers/inscription.controllers.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { verifyToken } from "../middleware/verifyToken.js";

const app = express();

//create inscription for the user
app.post("/creeinscription",verifyToken, verifyRole(["participant"]), inscrireUtilisateur);
//affichage les inscriptions 
app.get("/get", verifyToken, verifyRole(["gestionnaire", "admin","participant"]), consulterInscriptions);
//valider l'inscription
app.put("/valider/:id",verifyToken, verifyRole(["gestionnaire"]),validerInscription);
//annleree l'inscription por un gistionnaire
app.put("/annulee/:id",verifyToken, verifyRole(["gestionnaire"]),annulerInscription);
//annuler une inscription pour participation
app.delete("/annuleeinscription/:id",verifyToken,verifyRole(["participant"]),supprimerInscription) ;


export default app;
