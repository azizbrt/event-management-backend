import Payment from "../models/payment.model.js";
import Inscription from "../models/inscription.model.js";

// POST /api/payments
export const createPayment = async (req, res) => {
  console.log("🔍 req.body:", req.body);
  console.log("📸 req.file:", req.file);

  try {
    const {
      utilisateurId,
      evenementId,
      montant,
      paymentMethode,
      remarque,
    } = req.body;

    // 1. Vérifie les champs obligatoires
    if (!evenementId || !montant || !paymentMethode) {
      return res.status(400).json({
        message: "Champs obligatoires manquants.",
      });
    }

    // 2. Si méthode = virement, le fichier doit être présent
    if (paymentMethode === "virement" && !req.file) {
      return res.status(400).json({
        message: "Preuve obligatoire pour un virement.",
      });
    }

    // 3. Vérifie si un paiement existe déjà pour cet utilisateur & événement
    const existing = await Payment.findOne({ utilisateurId, evenementId });
    if (existing) {
      return res.status(409).json({
        message: "Paiement déjà soumis pour cet événement.",
      });
    }

    // 4. Vérifie que l'utilisateur est bien inscrit à l'événement
    const inscription = await Inscription.findOne({ utilisateurId, evenementId });
    if (!inscription) {
      return res.status(400).json({
        message: "Impossible de payer : l'utilisateur n'est pas inscrit à cet événement.",
      });
    }

    // 5. Récupère les infos publiques de l'utilisateur via l'inscription
    const utilisateurPublic = {
      nom: inscription.utilisateurPublic.nomAffiché,
      email: inscription.utilisateurPublic.email,
      telephone: inscription.utilisateurPublic.telephone || inscription.telephone,
    };

    // 6. Gère le fichier image (preuve)
    const preuveUrl = req.file ? `/images/${req.file.filename}` : undefined;

    // 7. Crée l'objet Payment
    const newPayment = new Payment({
      utilisateurId,
      evenementId,
      inscriptionId: inscription._id,
      utilisateurPublic,
      montant,
      paymentMethode,
      preuveUrl,
      remarque,
    });

    // 8. Sauvegarde en base
    const savedPayment = await newPayment.save();

    // 9. Répondre avec succès
    res.status(201).json(savedPayment);

  } catch (error) {
    console.error("💥 Erreur lors du paiement :", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Paiement déjà existant (doublon).",
      });
    }

    res.status(500).json({
      message: "Erreur serveur lors de la création du paiement.",
    });
  }
};
