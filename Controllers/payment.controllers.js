import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import Event from "../models/Event.js";
import { v4 as uuidv4 } from "uuid"; 
import Inscription from "../models/inscription.model.js";
function getPublicUserInfo(user, inscription) {
  return {
    nom: user.nom,
    email: user.email,
    telephone: inscription?.telephone || user.telephone || "",
  };
}

// POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const { inscriptionId } = req.body;

    if (!inscriptionId) {
      return res.status(400).json({ message: "inscriptionId est requis." });
    }

    const userId = req.user.id;

    // 📋 1. Récupérer l'inscription
    const inscription = await Inscription.findById(inscriptionId);
    if (!inscription) {
      return res.status(404).json({ message: "Inscription introuvable." });
    }

    // 🔒 2. Vérifier que l'utilisateur est bien le propriétaire
    if (inscription.utilisateurId.toString() !== userId) {
      return res.status(403).json({ message: "Accès refusé à cette inscription." });
    }

    // 📅 3. Charger l'événement
    const event = await Event.findById(inscription.evenementId);
    if (!event) {
      return res.status(404).json({ message: "Événement introuvable." });
    }

    // 🚫 4. Vérifier qu’il n’a pas déjà payé
    const paiementExistant = await Payment.findOne({
      utilisateurId: userId,
      evenementId: event._id,
    });
    if (paiementExistant) {
      return res.status(409).json({ message: "Paiement déjà effectué pour cet événement." });
    }

    // ✅ 5. Créer le paiement
    const newPayment = new Payment({
      utilisateurId: userId,
      evenementId: event._id,
      inscriptionId: inscription._id,
      utilisateurPublic: {
        nom: inscription.utilisateurPublic.nomAffiché,
        email: inscription.utilisateurPublic.email,
        telephone: inscription.telephone,
      },
      montant: event.prix || 0, // ✅ Récupéré automatiquement ici
      statut: "en attente",
      reference: uuidv4().slice(0, 8).toUpperCase(),
    });

    await newPayment.save();

    return res.status(201).json({
      message: "Paiement enregistré avec succès.",
      paiment: newPayment,
    });

  } catch (error) {
    console.error("Erreur lors de la création du paiement:", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      error: error.message,
    });
  }
};

export const getAllPaiementsWithDetails = async (req, res) => {
  try {
    const gestionnaireId = req.user.id;

    // 1️⃣ Find events created by this gestionnaire
    const events = await Event.find({ organisateur: gestionnaireId }).select("_id");

    const eventIds = events.map(event => event._id);

    // 2️⃣ Get related payments
    const paiements = await Payment.find({ evenementId: { $in: eventIds } })
      .populate("utilisateurId", "nom email")
      .populate("evenementId", "titre dateDebut prix")
      .populate("inscriptionId");

    // 3️⃣ Clean the response: map only useful fields
    const cleanedPaiements = paiements.map(p => ({
      _id: p._id,
      reference: p.reference,
      montant: p.montant,
      statut: p.statut,
      datePaiement: p.datePaiement,
      utilisateur: p.utilisateurId,
      evenement: p.evenementId,
      inscription: p.inscriptionId ? {
        _id: p.inscriptionId._id,
        note: p.inscriptionId.note,
        status: p.inscriptionId.status,
        dateInscription: p.inscriptionId.dateInscription,
        utilisateurId: p.inscriptionId.utilisateurId,
      } : null,
    }));

    res.status(200).json({ paiements: cleanedPaiements });

  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des paiements.",
      error: error.message
    });
  }
};
export const validerOuRefuserPaiement = async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const paiementId = req.params.id;
    const { statut } = req.body;

    // 🔒 Autoriser uniquement "validé" ou "refusé"
    if (!["validé", "refusé"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide. Utilisez 'validé' ou 'refusé'." });
    }

    // 🔍 Trouver le paiement
    const paiement = await Payment.findById(paiementId).populate("evenementId");

    if (!paiement) {
      return res.status(404).json({ message: "Paiement introuvable." });
    }

    // 🔐 Vérifier que l’événement appartient au gestionnaire
    if (paiement.evenementId.organisateur.toString() !== gestionnaireId) {
      return res.status(403).json({ message: "Accès refusé. Cet événement ne vous appartient pas." });
    }

    // 🔁 Mettre à jour le statut
    paiement.statut = statut;
    await paiement.save();

    res.status(200).json({
      message: `Paiement ${statut} avec succès.`,
      paiement,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du paiement:", error);
    res.status(500).json({
      message: "Erreur interne lors de la mise à jour du paiement.",
      error: error.message,
    });
  }
};





