import Inscription from "../models/inscription.model.js";
import Event from "../models/Event.js";
import User from "../models/user.model.js"; // Mets le bon chemin vers ton modèle
import {
  sendInscriptionEmail,
  sendValidationEmail,
} from "../services/emailService.js";
import mongoose from "mongoose";
import Payment from "../models/payment.model.js";

export const inscrireUtilisateur = async (req, res) => {
  try {
    const { evenementId, note, telephone, nomAffiché } = req.body;
    const utilisateurId = req.user?.id;

    // 1. Vérifier l'authentification
    if (!utilisateurId) {
      return res.status(401).json({
        success: false,
        message: "Vous devez être connecté pour vous inscrire.",
      });
    }

    // 2. Vérifier l'ID de l'événement
    if (!mongoose.Types.ObjectId.isValid(evenementId)) {
      return res.status(400).json({
        success: false,
        message: " L'ID de l'événement est invalide.",
      });
    }

    // 3. Vérifier l'existence de l'événement
    const event = await Event.findById(evenementId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: " Événement non trouvé.",
      });
    }

    // 4. Vérifier la capacité
    const inscriptionsCount = await Inscription.countDocuments({ evenementId });
    if (inscriptionsCount >= event.capacite) {
      return res.status(400).json({
        success: false,
        message: " L'événement est complet.",
      });
    }

    // 5. Vérifier si l'utilisateur est déjà inscrit
    const dejaInscrit = await Inscription.findOne({
      utilisateurId,
      evenementId,
    });
    if (dejaInscrit) {
      return res.status(400).json({
        success: false,
        message: "  Vous êtes déjà inscrit à cet événement.",
      });
    }

    // 6. Récupérer l'utilisateur
    const utilisateur = await User.findById(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "  Utilisateur introuvable.",
      });
    }

    // 7. Valider téléphone
    if (!telephone) {
      return res.status(400).json({
        success: false,
        message: "  Le numéro de téléphone est requis.",
      });
    }

    // 8. Déterminer le nom à afficher
    const nomPublic = nomAffiché?.trim() || utilisateur.name;

    // 9. Créer l'inscription
    const nouvelleInscription = new Inscription({
      utilisateurId,
      evenementId,
      telephone,
      note,
      utilisateurPublic: {
        nomAffiché: nomPublic,
        email: utilisateur.email,
        telephone,
      },
    });

    await nouvelleInscription.save();

    // 10. Envoyer un email
    await sendInscriptionEmail(
      utilisateur.email,
      utilisateur.name,
      event.titre,
      event.dateDebut
    );

    // 11. Réponse finale
    res.status(201).json({
      success: true,
      message: "Inscription réussie ! Un email de confirmation a été envoyé.",
      inscription: nouvelleInscription,
    });
  } catch (error) {
    console.error("  Erreur lors de l'inscription :", error);
    res.status(500).json({
      success: false,
      message: "  Une erreur s'est produite.",
      error: error.message,
    });
  }
};

// 🔍 Voir les inscriptions des événements d’un gestionnaire
export const consulterInscriptions = async (req, res) => {
  try {
    const user = req.user; // Qui est connecté ?

    // 🔒 Autorisation : seuls les gestionnaires ont accès
    if (user.role !== "gestionnaire") {
      return res.status(403).json({
        success: false,
        message: " Seuls les gestionnaires peuvent voir ces inscriptions.",
      });
    }

    // 🔍 On cherche les événements créés par ce gestionnaire
    const evenements = await Event.find({ organisateur: user.id }).select(
      "_id"
    );
    const evenementIds = evenements.map((e) => e._id);

    // 📥 On récupère les inscriptions liées à ces événements
    const inscriptions = await Inscription.find({
      evenementId: { $in: evenementIds },
    })
      .populate("utilisateurId", "nomAffiché email telephone") // on veut les infos du participant
      .populate("evenementId", "titre dateDebut dateFin"); // on veut les infos de l’événement

    // 💳 Pour chaque inscription, on va chercher le paiement (s'il existe)
    const result = await Promise.all(
      inscriptions.map(async (inscription) => {
        const paiement = await Payment.findOne({
          inscriptionId: inscription._id,
        });

        return {
          id: inscription._id.toString(),
          participant: {
            nom: inscription.utilisateurPublic?.nomAffiché || "Non spécifié",
            email: inscription.utilisateurPublic?.email || "Non spécifié",
            telephone:
              inscription.utilisateurPublic?.telephone || "Non spécifié",
          },
          evenement: {
            titre: inscription.evenementId?.titre || "Sans titre",
            dateDebut: inscription.evenementId?.dateDebut,
            dateFin: inscription.evenementId?.dateFin,
          },
          note: inscription.note || "",
          status: inscription.status,
          dateInscription: inscription.dateInscription,
          paiement: paiement
            ? {
                montant: paiement.montant,
                reference: paiement.reference,
                statut: paiement.statut,
                datePaiement: paiement.datePaiement,
              }
            : null,
        };
      })
    );

    // 📭 Si aucune inscription trouvée
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "  Aucun participant trouvé pour vos événements.",
      });
    }

    // Réponse envoyée
    res.status(200).json({
      success: true,
      message: "📋 Inscriptions et paiements récupérés avec succès",
      total: result.length,
      inscriptions: result,
    });
  } catch (error) {
    console.error("  Erreur :", error.message);
    res.status(500).json({
      success: false,
      message: "  Une erreur s’est produite.",
      error: error.message,
    });
  }
};

export const consulterInscriptionsParticipant = async (req, res) => {
  const user = req.user;
  try {
    const mesInscriptions = await Inscription.find({
      utilisateurId: user.id,
    }).populate("evenementId", "titre dateDebut dateFin prix");
    if (mesInscriptions.length === 0) {
      return res.status(404).json({
        message: "  Vous n'avez encore participé à aucun événement.",
      });
    }
    const inscriptions = mesInscriptions.map((inscription) => ({
      _id: inscription._id,
      evenement: {
        id: inscription.evenementId?._id,
        titre: inscription.evenementId?.titre || "Sans titre",
        dateDebut: inscription.evenementId?.dateDebut,
        dateFin: inscription.evenementId?.dateFin,
        prix: inscription.evenementId?.prix || 0,
      },
      note: inscription.note || "",
      status: inscription.status,
      dateInscription: inscription.dateInscription,
    }));

    res.status(200).json({
      success: true,
      message: "📋 Voici vos inscriptions",
      total: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    console.error(
      "  Erreur pendant la récupération des inscriptions :",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "  Une erreur s’est produite.",
      error: error.message,
    });
  }
};

export const validerInscription = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    // 👉 Vérifie si l'ID est bien fourni
    if (!id || id === "undefined") {
      return res.status(400).json({ message: " ID d'inscription invalide." });
    }

    // 🔍 Cherche l'inscription par son ID et récupère aussi l'événement lié
    const inscription = await Inscription.findById(id).populate("evenementId");

    if (!inscription) {
      return res.status(404).json({ message: " Inscription introuvable !" });
    }

    // 🔍 Cherche l'utilisateur lié à cette inscription
    const utilisateur = await User.findById(inscription.utilisateurId).select(
      "name email"
    );

    if (!utilisateur) {
      return res.status(404).json({ message: " Utilisateur introuvable !" });
    }

    //  Si déjà validée, on arrête
    if (inscription.status === "validée") {
      return res
        .status(400)
        .json({ message: " Cette inscription est déjà validée !" });
    }

    //  Si annulée, on ne peut pas valider
    if (inscription.status === "annulée") {
      return res.status(400).json({
        message: "Impossible de valider une inscription annulée !",
      });
    }

    //  Si l'événement n'existe plus, on arrête
    if (!inscription.evenementId) {
      return res
        .status(400)
        .json({ message: "L'événement associé n'existe plus !" });
    }

    // 🧾 On cherche le paiement associé à cette inscription
    const paiement = await Payment.findOne({
      inscriptionId: new mongoose.Types.ObjectId(inscription._id),
    });

    //  Aucun paiement trouvé
    if (!paiement) {
      return res
        .status(400)
        .json({ message: " Aucun paiement trouvé pour cette inscription." });
    }

    //  Paiement annulé → pas possible de valider
    if (paiement.statut === "refusé") {
      return res.status(400).json({ message: "Le paiement est annulé." });
    }

    //  Paiement pas encore validé
    if (paiement.statut !== "validé") {
      return res.status(400).json({
        message:
          " Le paiement n'est pas encore validé. On ne peut pas valider l'inscription.",
      });
    }

    // Si tout est bon, on valide l'inscription
    inscription.status = "validée";
    inscription.dateValidation = new Date();
    await inscription.save();

    // 📩 On envoie un e-mail de confirmation à l'utilisateur
    if (utilisateur.email) {
      await sendValidationEmail(utilisateur.email, utilisateur.name);
      console.log(`📩 Email envoyé à ${utilisateur.email}`);
    }

    // Réponse finale
    return res.status(200).json({
      message: " Inscription validée avec succès !",
      inscription,
    });
  } catch (error) {
    console.error(" Erreur pendant la validation :", error);
    return res.status(500).json({
      message: " Une erreur est survenue.",
      error: error.message,
    });
  }
};

export const annulerInscription = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Vérifier si l'inscription existe
    const inscription = await Inscription.findById(id);
    if (!inscription) {
      return res.status(404).json({
        success: false,
        message: "  Inscription introuvable !",
      });
    }

    //   Déjà annulée ?
    if (inscription.status === "annulée") {
      return res.status(400).json({
        success: false,
        message: "  Cette inscription est déjà annulée !",
      });
    }

    //  Déjà validée → pas d'annulation possible
    if (inscription.status === "validée") {
      return res.status(400).json({
        success: false,
        message: " Impossible d'annuler une inscription validée !",
      });
    }

    // 🛑 Annuler l'inscription
    inscription.status = "annulée";
    inscription.dateAnnulation = new Date();
    await inscription.save();

    return res.status(200).json({
      success: true,
      message: "Inscription annulée avec succès !",
      data: {
        id: inscription._id,
        status: inscription.status,
        dateAnnulation: inscription.dateAnnulation,
      },
    });
  } catch (error) {
    console.error(
      "  Erreur lors de l'annulation de l'inscription :",
      error.message
    );
    return res.status(500).json({
      success: false,
      message:
        "  Une erreur s'est produite lors de l'annulation de l'inscription",
      error: error.message,
    });
  }
};

export const supprimerInscription = async (req, res) => {
  try {
    const utilisateur = req.user;
    const { id } = req.params;
    console.log("ID reçu :", id);

    // Vérification que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Trouver l'inscription
    const inscription = await Inscription.findById(id);
    if (!inscription) {
      return res.status(404).json({ message: "Inscription introuvable !" });
    }

    // Supprimer l'inscription
    await inscription.deleteOne();
    res.status(200).json({ message: "Inscription supprimée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'inscription :", error);
    res.status(500).json({
      message:
        "Une erreur s'est produite lors de la suppression de l'inscription",
      error: error.message,
    });
  }
};
