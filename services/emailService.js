import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { 
  verificationMailTemplate, 
  welcomeMailTemplate, 
  passwordResetRequestTemplate, 
  passwordResetSuccessTemplate, 
  inscriptionMailTemplate,
  validationMailTemplate
} from "./templateMail.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, userName, verificationCode) => {
  try {
    if (!verificationCode) {
      throw new Error("Le code de vérification est manquant !");
    }

    // Create a transporter using your email configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare the email content using the updated template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Vérification de votre compte",
      html: verificationMailTemplate(userName, verificationCode),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email de vérification envoyé à ${email} !`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email de vérification :", error.message);
    throw error;
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
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
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
export const sendInscriptionEmail = async (email, userName, eventName, eventDate) => {
  try {
    if (!email) throw new Error("❌ L'adresse email est manquante !");
    if (!userName) throw new Error("❌ Le nom d'utilisateur est manquant !");
    if (!eventName) throw new Error("❌ Le nom de l'événement est manquant !");
    if (!eventDate) throw new Error("❌ La date de l'événement est manquante !");

    console.log(`📧 Préparation de l'envoi d'email d'inscription à : ${email}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `📅 Confirmation d'inscription à ${eventName}`,
      html: inscriptionMailTemplate(userName, eventName, eventDate),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email de confirmation d'inscription envoyé à ${email} !`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de l'email d'inscription :", error.message);
  }
  
};
export const sendValidationEmail = async (email, userName) => {
  try {
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "🎉 Inscription validée !",
          html: validationMailTemplate(userName),
      };

      await transporter.sendMail(mailOptions);
      console.log(`📩 Email de validation envoyé à ${email} avec succès !`);
  } catch (error) {
      console.error("❌ Erreur d'envoi de l'email de validation :", error.message);
  }
}

