import express from "express";
import { createEvent, deleteEvent, getAllEvents, getEventById, getEventsByOrganisateurId, getRandomEvents, updateEvent, updateEventState } from "../Controllers/event.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import upload from "../middleware/uploadMiddleware.js";

const app = express();

//create event
app.post("/create",verifyToken,upload.single("image"), verifyRole("gestionnaire"),  createEvent);
//Récupérer tous les événements
app.get("/get",getAllEvents);
//Récupérer un événement spécifique par ID
app.get("/get/:id",verifyToken, getEventById);
//Modifier un événement spécifique par ID
app.put("/update/:id", verifyToken, verifyRole(["gestionnaire", "admin"]),upload.single("image"), updateEvent);
//Supprimer un événement spécifique par ID
app.delete("/delete/:id", verifyToken, verifyRole(["gestionnaire", "admin"]), deleteEvent);
//verifier l'etat de l'evenement
app.put("/etat/:id", verifyToken, verifyRole("admin"),updateEventState);
app.get("/gestionnaire/:id",verifyToken,verifyRole("gestionnaire", "admin"),getEventsByOrganisateurId);
  //recmmended events by category or tag
app.get("/recommended", getRandomEvents);

export default app;
