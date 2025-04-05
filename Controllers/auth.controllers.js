import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendWelcomeEmail } from "../services/emailService.js";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../services/emailService.js"; // Import correct de l'email service

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
  
    try {
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Utilisateur déjà existant" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  
      const user = new User({
        email,
        password: hashedPassword,
        name,
        verificationToken,
        verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expiration après 24h
      });
  
      await user.save();
  
      // Correction ici : passer arguments à sendVerificationEmail
      await sendVerificationEmail(user.email, user.name, verificationToken);
  
      res.status(201).json({ message: "Compte créé ! Vérifiez votre email." });
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error.message);
      res.status(500).json({ message: "Erreur d'inscription", error });
    }
  };


  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: "Utilisateur non trouvé." });
      }
  
      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Mot de passe incorrect." });
      }
  
      // Vérifier si l'utilisateur a confirmé son email
      if (!user.isVerified) {
        return res.status(401).json({ success: false, message: "Veuillez vérifier votre email avant de vous connecter." });
      }
  
      // Générer le token et l'envoyer via un cookie
      generateTokenAndSetCookie(res, user._id, user.role);
  
      // Mettre à jour la date de dernière connexion
      user.lastLogin = new Date();
      await user.save();
  
      // Réponse avec les infos de l'utilisateur (sans le mot de passe)
      res.status(200).json({
        success: true,
        message: "Vous êtes connecté !",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
        },
      });
  
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      res.status(500).json({ success: false, message: "Erreur lors de la connexion", error: error.message });
    }
  };
  

export const logout = async (req, res) => { 
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Déconnexion réussie !" });
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  console.log("Code reçu :", code); // 👈 Vérifie bien qu'il arrive

  try {
    console.log("Code reçu :", code);
console.log("Date actuelle :", new Date());
const codeStr = String(code).trim();
console.log("🔍 Code nettoyé :", codeStr);

const user = await User.findOne({
  verificationToken: codeStr,
  verificationExpiresAt: { $gt: Date.now() },
});
console.log("✅ Sans date, utilisateur trouvé ?", user);
    console.log("Utilisateur trouvé :", user); // 👈 Vérifie si un user est trouvé

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code de vérification invalide ou expiré.",
      });
    }

    // Marquer l'utilisateur comme vérifié
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpiresAt = undefined;
    
    await user.save();

    // Envoi de l'email de bienvenue
    await sendWelcomeEmail(user.email, user.name);

    // Réponse avec succès sans mot de passe
    const { password, ...userData } = user._doc;

    res.status(200).json({
      success: true,
      message: "Email vérifié avec succès.",
      user: userData,
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification.",
    });
  }
};

export const forgotpassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Adresse email inconnue" });
    }

    // Génération du token
    const resetToken = crypto.randomBytes(20).toString("hex");
    console.log("Reset Token:", resetToken);

    const resetTokenExpiredsAt = Date.now() + 1 * 60 * 60 * 1000; // 1 heure
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiredsAt;
    await user.save();
    console.log("User après save:", user);


    // Vérification de BASE_URL
    console.log("BASE_URL:", process.env.BASE_URL); // DEBUG

    // Envoi de l'email
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    console.log("Reset Link: mta3 auth controller", resetLink); // DEBUG

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({ message: "Un email de réinitialisation de mot de passe a été envoyé" });
  } catch (error) {
    console.error("Erreur dans forgotpassword:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
//resetPassword
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password: newPassword } = req.body; // Fix ici

    console.log("Corps de la requête:", req.body); // DEBUG
    console.log("token:", token);
    console.log("newPassword:", newPassword);

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "Le nouveau mot de passe est requis !" });
    }

    // Vérification du token
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token de réinitialisation de mot de passe expiré ou invalide." });
    }

    // Mise à jour du mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();
    await sendPasswordResetSuccessEmail(user.email, user.name);

    res.status(200).json({ success: true, message: "Mot de passe mis à jour avec succès." });

  } catch (error) {
    console.error("Erreur dans resetPassword:", error);
    res.status(500).json({ success: false, message: "Erreur interne du serveur" });
  }
};
export const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });
    }

    // Utilise req.user.id au lieu de req.user._id
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    // Supprimer le mot de passe avant d'envoyer la réponse
    const { password, ...userWithoutPassword } = user._doc;

    return res.status(200).json({ success: true, user: userWithoutPassword });

  } catch (error) {
    console.error("❌ Erreur dans checkAuth:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};


