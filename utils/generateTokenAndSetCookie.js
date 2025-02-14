import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, userId, role) => {
    const token = jwt.sign(
        { userId, role },  // On ajoute le rôle dans le token
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Expiration du token après 7 jours
    );

    res.cookie("token", token, {
        httpOnly: true,  // Empêche JavaScript d’accéder au cookie (protection contre les attaques XSS)
        secure: process.env.NODE_ENV === 'production',  // Active le mode sécurisé en production (HTTPS)
        maxAge: 7 * 24 * 60 * 60 * 1000,  // Expire après 7 jours
        sameSite: "Strict",  // Protection contre les attaques CSRF
    });

    return token; // On retourne le token pour l’utiliser si nécessaire
};
