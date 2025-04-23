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
    // 🎁 On prend les infos du corps de la requête (eventId et inscriptionId)
    const { eventId, inscriptionId } = req.body;

    // 🧒 On récupère l'ID de la personne qui est connectée
    const userId = req.user.id;

    // ✅ 1. Vérifier si l'événement existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    // ✅ 2. Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // ✅ 3. Si on a donné un ID d'inscription, vérifier que c’est bien la sienne
    let inscription = null;
    if (inscriptionId) {
      inscription = await Inscription.findById(inscriptionId);
      const estProprio = inscription?.utilisateurId.toString() === userId;
      if (!inscription || !estProprio) {
        return res.status(400).json({ message: "Inscription invalide." });
      }
    }

    // ✅ 4. Créer le paiement avec les infos visibles de l'utilisateur
    const newPayment = new Payment({
      utilisateurId: userId,
      evenementId: eventId,
      inscriptionId: inscriptionId || null,
      utilisateurPublic: getPublicUserInfo(user, inscription),

      montant: event.prix || 0,
      statut: "en attente",
      reference: uuidv4().slice(0, 8).toUpperCase(), // 🎫 Référence unique
    });

    // ✅ 5. Enregistrer dans la base de données
    await newPayment.save();

    // ✅ 6. Répondre avec succès
    return res.status(201).json({
      message: "Paiement enregistré en attente.",
      paiment: newPayment,
    });

  } catch (error) {
    // ❌ Si erreur, on affiche et on renvoie une réponse d’erreur
    console.error("Error creating payment:", error);
    return res.status(500).json({
      message: "Erreur lors de l'enregistrement du paiement.",
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





