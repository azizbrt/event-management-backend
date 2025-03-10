import express from "express";
import { envoyerMessage, getAllMessagesForAdmin, updateMessageStatus } from "../Controllers/message.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";

const router = express.Router();
//envoiyer un message to the admin

router.post("/send-message",verifyToken,envoyerMessage);
//recupere tous les message par l'admin

router.get("/affmessages",verifyToken, verifyRole("admin"),getAllMessagesForAdmin);

//uppdate le staute de message par l'admin sur le permission
router.put("/uppdatemessage/:id",verifyToken, verifyRole("admin"),updateMessageStatus)

export default router;
