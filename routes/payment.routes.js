import express from "express";
import { createPayment } from "../Controllers/payment.controllers.js";
import upload from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";



const app= express();

app.post("/create",upload.single("preuveUrl"),verifyToken,verifyRole("participant"), createPayment)






export default app;