import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized - Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Now decoded.userId, decoded.name, and decoded.role should have proper values.
    req.user = {
      id: decoded.userId,
      name: decoded.name,
      role: decoded.role,
    };
    console.log("🔑 Utilisateur authentifié :", req.user);
    next();
  } catch (error) {
    console.log("Erreur vérification token:", error);
    return res.status(401).json({ success: false, message: "Erreur serveur" });
  }
}
