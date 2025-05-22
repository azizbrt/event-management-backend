import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Tous les champs sont requis" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Utilisateur déjà existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expiration après 24h
    });

    await user.save();
    //jwt
    generateTokenAndSetCookie(res, user);

    // Correction ici : passer arguments à sendVerificationEmail
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(201).json({
      message: "Compte créé ! Vérifiez votre email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error.message);
    res.status(500).json({ message: "Erreur d'inscription", error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Utilisateur non trouvé." });
    }

    // Step 2: Check the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Mot de passe incorrect." });
    }

    // Step 4: Check the user's account status (etatCompte)
    if (user.etatCompte === "inactif") {
      return res.status(403).json({
        success: false,
        message:
          "Votre compte est inactif. Veuillez contacter l'administration.",
      });
    }

    if (user.etatCompte === "suspendu") {
      return res.status(403).json({
        success: false,
        message:
          "Votre compte a été suspendu. Veuillez contacter l'administration.",
      });
    }

    // Step 5: Generate the token and set it in a cookie
    generateTokenAndSetCookie(res, user);

    // Step 6: Update last login date
    user.lastLogin = new Date();
    await user.save();

    // Step 7: Return the user info (excluding password)
    res.status(200).json({
      success: true,
      message: "Vous êtes connecté !",
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        etatCompte: user.etatCompte, // Include account status in the response
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Déconnexion réussie !" });
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
    console.log("Sans date, utilisateur trouvé ?", user);
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
    console.log("👤 User before token:", user);
    console.log("📛 Name:", user.name, "| 🎭 Role:", user.role);

    // 🔐 Générer un token JWT et le stocker dans un cookie
    generateTokenAndSetCookie(res, user);

    // Réponse avec succès sans mot de passe
    const { password, ...userData } = user._doc;

    res.status(200).json({
      success: true,
      message: "Email vérifié avec succès.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification.",
    });
  }
};
export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Trouver l'utilisateur par email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé avec cet email.",
      });
    }

    // 2. Vérifier s’il est déjà vérifié
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà vérifié.",
      });
    }

    // 3. Générer un nouveau code
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresIn = 10 * 60 * 1000; // 10 minutes

    user.verificationToken = verificationToken;
    user.verificationExpiresAt = Date.now() + expiresIn;

    // 4. Sauvegarder les nouvelles infos
    await user.save();

    // 5. Envoyer le code par email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // 6. Répondre avec succès
    res.status(200).json({
      success: true,
      message: "Nouveau code envoyé avec succès. Vérifie ton email !",
    });

  } catch (error) {
    console.error("Erreur lors du renvoi du code :", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue. Réessaie plus tard.",
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

    res.status(200).json({
      message: "Un email de réinitialisation de mot de passe a été envoyé",
    });
  } catch (error) {
    console.error("Erreur dans forgotpassword:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
//resetPassword
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password: newPassword } = req.body;

    console.log("Corps de la requête:", req.body);
    console.log("token:", token);
    console.log("newPassword:", newPassword);

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe est requis !",
      });
    }

    // Vérification du token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Token de réinitialisation de mot de passe expiré ou invalide.",
      });
    }

    // Mise à jour du mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();
    await sendPasswordResetSuccessEmail(user.email, user.name);

    res
      .status(200)
      .json({ success: true, message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur dans resetPassword:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};
export const checkAuth = async (req, res) => {
  try {
    const userId = req.user?.id; // récupère le userId injecté par le middleware

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non authentifié" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(" Erreur dans checkAuth:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
// Mise à jour du profil utilisateur

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log("Utilisateur trouvé dans la requête:", req.user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    // Mise à jour de la date de modification
    user.lastupdate = new Date();

    await user.save();

    // Renvoie un nouveau token avec les données actuelles
    generateTokenAndSetCookie(res, user);

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastupdate: user.lastupdate,
      },
    });
  } catch (error) {
    console.error(" Erreur dans updateUserProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
