export const verificationMailTemplate = (userName, verificationCode) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #FF9800;">Vérification de votre compte</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Merci de vous être inscrit ! Voici votre code de vérification :</p>
    <div style="font-size: 24px; font-weight: bold; margin: 20px auto; padding: 10px; background-color: #FF9800; color: white; border-radius: 5px; width: fit-content;">
      ${verificationCode}
    </div>
    <p>Ce code expirera dans 24 heures.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;

export const welcomeMailTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #FF9800;">Bienvenue ${userName} ! 🎉</h2>
    <p>Félicitations ! Votre compte est maintenant vérifié.</p>
    <p>Profitez pleinement de notre plateforme.</p>
    <a href="http://localhost:5173/" style="display: inline-block; background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à mon compte</a>
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
    <h2 style="color: #FF9800;">Mot de passe réinitialisé</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Votre mot de passe a été changé avec succès ! 🎉</p>
    <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;
export const inscriptionMailTemplate = (userName, eventName, eventDate) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h2 style="color: #FF9800;">📅 Confirmation d'Inscription</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Vous êtes inscrit à l'événement <strong>${eventName}</strong> prévu le <strong>${eventDate}</strong>.</p>
    <p>Nous avons hâte de vous y voir ! 🎉</p>
    <p>Pour plus d'informations, connectez-vous à votre compte.</p>
    <p style="margin-top: 20px; color: #777;">🚀 L'équipe Event Management</p>
  </div>
`;
export const validationMailTemplate = (userName) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; padding: 40px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
        
        <div style="background-color: #FF9800; padding: 20px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">🎉 Félicitations, ${userName} !</h2>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 18px; color: #333; line-height: 1.6;">
            Votre inscription à l'événement a été <strong>validée avec succès</strong>.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Nous sommes impatients de vous voir parmi nous ! N'oubliez pas de noter la date de l'événement dans votre agenda 📅.
          </p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="#" style="padding: 12px 24px; background-color: #FF9800; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Voir les détails de l'événement
            </a>
          </div>
          
          <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 14px; color: #999; text-align: center;">
            Si vous avez des questions, vous pouvez nous contacter à tout moment.<br>
            Merci et à très bientôt !
          </p>
        </div>
      </div>
    </div>
  `;
};

export const gestionnaireVerificationTemplate = (
  userName,
  verificationCode,
  plainPassword
) => `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; color: #333;">
    <h2 style="color: #f97316;">Activation de votre compte</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>

    <p>Votre compte  a été créé avec succès par l’administrateur.</p>

    <p>Voici vos identifiants temporaires pour vous connecter :</p>

    <div style="margin: 20px auto; text-align: left; display: inline-block; background: #f9f9f9; padding: 15px 20px; border-radius: 8px; border: 1px solid #ddd;">
      <p><strong>Mot de passe :</strong> ${plainPassword}</p>
      <p><strong>Code de vérification :</strong> <span style="font-size: 20px; font-weight: bold; color: #f97316;">${verificationCode}</span></p>
    </div>

    <p> Ce code de vérification expirera dans 24 heures.</p>
    
    <p>Connectez-vous avec ces informations, puis suivez les instructions pour vérifier votre compte.</p>

    <p style="margin-top: 30px; color: #777;">🚀 L’équipe Event Management</p>
  </div>
`;
