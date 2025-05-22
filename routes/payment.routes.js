import express from "express";
import { createPayment, getAllPaiementsWithDetails, getPaiementWithDetails, validerOuRefuserPaiement } from "../Controllers/payment.controllers.js";
import upload from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";



const app= express();

app.post("/create",verifyToken,verifyRole("participant"),upload.single("preuve"), createPayment)
app.get("/get",verifyToken,verifyRole("gestionnaire"), getAllPaiementsWithDetails);
app.put("/valider/:id",verifyToken,verifyRole("gestionnaire"), validerOuRefuserPaiement);
app.get("/get/:inscriptionId",verifyToken,verifyRole("gestionnaire"), getPaiementWithDetails);







export default app;