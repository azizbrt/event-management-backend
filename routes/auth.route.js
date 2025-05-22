import express from "express";
import { login, logout, signup, verifyEmail, forgotpassword, resetPassword ,checkAuth, updateUserProfile, resendVerificationCode} from "../Controllers/auth.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router= express.Router();

router.get("/check-auth",verifyToken, checkAuth);
router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password/:token", resetPassword);
router.put("/profile",verifyToken,updateUserProfile)
router.post('/resend-code', resendVerificationCode);



export default router;