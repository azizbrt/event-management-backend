import express from "express";
import { createPayment, getAllPaiementsWithDetails, validerOuRefuserPaiement } from "../Controllers/payment.controllers.js";
import upload from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";



const app= express();

app.post("/create",verifyToken,verifyRole("participant"), createPayment)
app.get("/get",verifyToken,verifyRole("gestionnaire"), getAllPaiementsWithDetails);
app.patch("/valider/:id",verifyToken,verifyRole("gestionnaire"), validerOuRefuserPaiement);







export default app;