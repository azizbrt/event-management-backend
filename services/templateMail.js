export const verificationMailTemplate = (userName, verificationCode) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #4CAF50;">Vérification de votre compte</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Merci de vous être inscrit ! Voici votre code de vérification :</p>
    <div style="font-size: 24px; font-weight: bold; margin: 20px auto; padding: 10px; background-color: #4CAF50; color: white; border-radius: 5px; width: fit-content;">
      ${verificationCode}
    </div>
    <p>Ce code expirera dans 24 heures.</p>
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
export const inscriptionMailTemplate = (userName, eventName, eventDate) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #4CAF50;">📅 Confirmation d'Inscription</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Vous êtes inscrit à l'événement <strong>${eventName}</strong> prévu le <strong>${eventDate}</strong>.</p>
    <p>Nous avons hâte de vous y voir ! 🎉</p>
    <p>Pour plus d'informations, connectez-vous à votre compte.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;
export const validationMailTemplate = (userName) => {
  return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <h2 style="color: #4CAF50; text-align: center;">🎉 Félicitations, ${userName} !</h2>
              <p style="font-size: 16px; color: #333;">Votre inscription à l'événement a été validée avec succès.</p>
              <p style="font-size: 16px; color: #333;">Nous sommes impatients de vous voir participer à notre événement !</p>
              <hr style="border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #777;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              <p style="font-size: 14px; color: #777;">Merci et à bientôt !</p>
          </div>
      </div>
  `;
};
export const gestionnaireVerificationTemplate = (userName, verificationCode, plainPassword) => `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; color: #333;">
    <h2 style="color: #f97316;">Activation de votre compte</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>

    <p>Votre compte  a été créé avec succès par l’administrateur.</p>

    <p>Voici vos identifiants temporaires pour vous connecter :</p>

    <div style="margin: 20px auto; text-align: left; display: inline-block; background: #f9f9f9; padding: 15px 20px; border-radius: 8px; border: 1px solid #ddd;">
      <p><strong>Mot de passe :</strong> ${plainPassword}</p>
      <p><strong>Code de vérification :</strong> <span style="font-size: 20px; font-weight: bold; color: #f97316;">${verificationCode}</span></p>
    </div>

    <p>⚠️ Ce code de vérification expirera dans 24 heures.</p>
    
    <p>Connectez-vous avec ces informations, puis suivez les instructions pour vérifier votre compte.</p>

    <p style="margin-top: 30px; color: #777;">🚀 L’équipe Event Management</p>
  </div>
`;

