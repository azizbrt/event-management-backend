export const verificationMailTemplate = (userName, verificationLink) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #4CAF50;">Vérification de votre compte</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Merci de vous être inscrit ! Veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
    <a href="${verificationLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon compte</a>
    <p>Ce lien expirera dans 24 heures.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;

export const welcomeMailTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #4CAF50;">Bienvenue ${userName} ! 🎉</h2>
    <p>Félicitations ! Votre compte est maintenant vérifié.</p>
    <p>Profitez pleinement de notre plateforme.</p>
    <a href="http://localhost:3000/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à mon compte</a>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;

export const passwordResetRequestTemplate = (userName, resetLink) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #FF9800;">Réinitialisation du mot de passe</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
    <a href="${resetLink}" style="display: inline-block; background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
    <p>Ce lien expirera dans 30 minutes.</p>
    <p style="margin-top: 20px; color: #777;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  </div>
`;

export const passwordResetSuccessTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #4CAF50;">Mot de passe réinitialisé</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Votre mot de passe a été changé avec succès ! 🎉</p>
    <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;
