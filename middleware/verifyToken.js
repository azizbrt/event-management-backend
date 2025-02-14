import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized - Token manquant" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ success: false, message: "Unauthorized - Token invalide" });
        }

        req.user = {
            id: decoded.userId,
            role: decoded.role,  // On stocke aussi le rôle
        };

        next();
    } catch (error) {
        console.log("Erreur vérification token:", error);
        return res.status(401).json({ success: false, message: "Erreur serveur" });
    }
}

