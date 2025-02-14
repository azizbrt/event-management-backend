import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { 
  verificationMailTemplate, 
  welcomeMailTemplate, 
  passwordResetRequestTemplate, 
  passwordResetSuccessTemplate 
} from "./templateMail.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, userName, token) => {
    try {
      if (!token) {
        throw new Error("Le token de vérification est manquant !");
      }
  
      const verificationLink = `http://localhost:8000/api/auth/verify-email?token=${token}`;
      console.log("🔗 Lien de vérification :", verificationLink);
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Vérification de votre compte",
        html: verificationMailTemplate(userName, verificationLink),
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`📩 Email de vérification envoyé à ${email} !`);
    } catch (error) {
      console.error("❌ Erreur d'envoi de l'email de vérification :", error.message);
    }
  };
  

export const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Bienvenue sur notre plateforme ! 🎉",
      html: welcomeMailTemplate(userName),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email de bienvenue envoyé à ${email} avec succès !`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email de bienvenue :", error.message);
  }
};

export const sendPasswordResetEmail = async (email, userName, resetToken) => {
  try {
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;;
    console.log("Reset Link: mta3 email service", resetLink);


    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation du mot de passe",
      html: passwordResetRequestTemplate(userName, resetLink),
      category: "password reset",
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email de réinitialisation envoyé à ${email} avec succès !`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email de réinitialisation :", error.message);
  }
};

export const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre mot de passe a été modifié",
      html: passwordResetSuccessTemplate(userName),
      category: "password reset",
    }; 
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email de confirmation de changement de mot de passe envoyé à ${email} !`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email de confirmation :", error.message);
  }
};
