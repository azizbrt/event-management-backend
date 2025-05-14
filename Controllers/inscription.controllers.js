import Inscription from "../models/inscription.model.js";
import Event from "../models/Event.js";
import User from "../models/user.model.js"; // Mets le bon chemin vers ton modèle
import {
  sendInscriptionEmail,
  sendValidationEmail,
} from "../services/emailService.js";
import mongoose from "mongoose";

export const inscrireUtilisateur = async (req, res) => {
  try {
    const { evenementId, note, telephone, nomAffiché } = req.body;
    const utilisateurId = req.user?.id;

    // 1. Vérifier l'authentification
    if (!utilisateurId) {
      return res.status(401).json({
        success: false,
        message: "❌ Vous devez être connecté pour vous inscrire.",
      });
    }

    // 2. Vérifier l'ID de l'événement
    if (!mongoose.Types.ObjectId.isValid(evenementId)) {
      return res.status(400).json({
        success: false,
        message: "❌ L'ID de l'événement est invalide.",
      });
    }

    // 3. Vérifier l'existence de l'événement
    const event = await Event.findById(evenementId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "❌ Événement non trouvé.",
      });
    }

    // 4. Vérifier la capacité
    const inscriptionsCount = await Inscription.countDocuments({ evenementId });
    if (inscriptionsCount >= event.capacite) {
      return res.status(400).json({
        success: false,
        message: "⚠️ L'événement est complet.",
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
        message: "⚠️ Vous êtes déjà inscrit à cet événement.",
      });
    }

    // 6. Récupérer l'utilisateur
    const utilisateur = await User.findById(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "❌ Utilisateur introuvable.",
      });
    }

    // 7. Valider téléphone
    if (!telephone) {
      return res.status(400).json({
        success: false,
        message: "⚠️ Le numéro de téléphone est requis.",
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
    // await sendInscriptionEmail(
    //   utilisateur.email,
    //   utilisateur.name,
    //   event.titre,
    //   event.dateDebut
    // );

    // 11. Réponse finale
    res.status(201).json({
      success: true,
      message:
        "✅ Inscription réussie ! Un email de confirmation a été envoyé.",
      inscription: nouvelleInscription,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription :", error);
    res.status(500).json({
      success: false,
      message: "❌ Une erreur s'est produite.",
      error: error.message,
    });
  }
};

// 🔍 Voir les inscriptions des événements d’un gestionnaire
export const consulterInscriptions = async (req, res) => {
  try {
    const user = req.user; // utilisateur connecté

    // 👮‍♂️ Si ce n’est pas un gestionnaire → pas le droit
    if (user.role !== "gestionnaire") {
      return res.status(403).json({
        success: false,
        message: "⛔ Seuls les gestionnaires peuvent voir ces inscriptions.",
      });
    }

    // 📋 Chercher les événements créés par ce gestionnaire
    const mesEvenements = await Event.find({ organisateur: user.id }).select(
      "_id"
    );
    const mesEvenementIds = mesEvenements.map((e) => e._id);

    // 📦 Chercher les inscriptions liées à ses événements
    const inscriptionsTrouvées = await Inscription.find({
      evenementId: { $in: mesEvenementIds },
    })
      .populate("utilisateurId", "name email") // infos de base du participant
      .populate("evenementId", "titre dateDebut dateFin"); // infos de l'événement

    // ❌ Si aucune inscription
    if (inscriptionsTrouvées.length === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ Aucun participant trouvé pour vos événements.",
      });
    }

    // 🧹 Nettoyage → on garde que l’essentiel
    const inscriptions = inscriptionsTrouvées.map((inscription) => ({
      id: inscription._id.toString(), // ✅ AJOUT DE L’ID !
      participant: {
        nom: inscription.utilisateurPublic?.nomAffiché || "Non spécifié",
        email: inscription.utilisateurPublic?.email || "Non spécifié",
        telephone: inscription.utilisateurPublic?.telephone || "Non spécifié",
      },
      evenement: {
        titre: inscription.evenementId?.titre || "Sans titre",
        dateDebut: inscription.evenementId?.dateDebut,
        dateFin: inscription.evenementId?.dateFin,
      },
      note: inscription.note || "",
      status: inscription.status,
      dateInscription: inscription.dateInscription,
    }));

    // ✅ On renvoie le tout proprement
    res.status(200).json({
      success: true,
      message: "📋 Voici les inscriptions à vos événements",
      total: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    console.error("❌ Erreur pendant la récupération :", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Oups ! Une erreur s’est produite.",
      error: error.message,
    });
  }
};
export const consulterInscriptionsParticipant = async (req, res) => {
  const user = req.user;
  try {
    const mesInscriptions = await Inscription.find({
      utilisateurId: user.id,
    }).populate("evenementId", "titre dateDebut dateFin");
    if (mesInscriptions.length === 0) {
      return res.status(404).json({
        message: "❌ Vous n'avez encore participé à aucun événement.",
      });
    }
    const inscriptions = mesInscriptions.map((inscription) => ({
      _id: inscription._id,
      evenement: {
        titre: inscription.evenementId?.titre || "Sans titre",
        dateDebut: inscription.evenementId?.dateDebut,
        dateFin: inscription.evenementId?.dateFin,
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
      "❌ Erreur pendant la récupération des inscriptions :",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "❌ Une erreur s’est produite.",
      error: error.message,
    });
  }
};

export const validerInscription = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Vérification de la validité de l'ID
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "❌ ID d'inscription invalide." });
    }

    // 🔍 Vérifier si l'inscription existe
    const inscription = await Inscription.findById(id).populate("evenementId");
    if (!inscription) {
      return res.status(404).json({ message: "❌ Inscription introuvable !" });
    }

    // 🔍 Récupérer l'utilisateur inscrit
    const utilisateur = await User.findById(inscription.utilisateurId).select(
      "_id"
    );
    if (!utilisateur) {
      return res.status(404).json({ message: "❌ Utilisateur introuvable !" });
    }

    // ⚠️ Vérifier les états de l'inscription
    if (inscription.status === "validée") {
      return res
        .status(400)
        .json({ message: "⚠️ Cette inscription est déjà validée !" });
    }

    if (inscription.status === "annulée") {
      return res.status(400).json({
        message: "⚠️ Impossible de valider une inscription annulée !",
      });
    }

    // ❗ Vérifier si l'événement existe encore
    if (!inscription.evenementId) {
      return res.status(400).json({
        message: "❌ L'événement associé à cette inscription n'existe plus !",
      });
    }

    // ✅ Valider l'inscription
    inscription.status = "validée";
    inscription.dateValidation = new Date();
    await inscription.save();

    // ✉️ Envoyer un email de confirmation
    if (utilisateur.email) {
      await sendValidationEmail(utilisateur.email, utilisateur.name);
      console.log(`📩 Email de validation envoyé à ${utilisateur.email}`);
    }

    return res.status(200).json({
      message: "✅ Inscription validée avec succès !",
      inscription,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la validation de l'inscription :", error);
    return res.status(500).json({
      message:
        "❌ Une erreur s'est produite lors de la validation de l'inscription",
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
        message: "❌ Inscription introuvable !",
      });
    }

    // ⚠️ Déjà annulée ?
    if (inscription.status === "annulée") {
      return res.status(400).json({
        success: false,
        message: "⚠️ Cette inscription est déjà annulée !",
      });
    }

    // ⛔ Déjà validée → pas d'annulation possible
    if (inscription.status === "validée") {
      return res.status(400).json({
        success: false,
        message: "⛔ Impossible d'annuler une inscription validée !",
      });
    }

    // 🛑 Annuler l'inscription
    inscription.status = "annulée";
    inscription.dateAnnulation = new Date();
    await inscription.save();

    return res.status(200).json({
      success: true,
      message: "✅ Inscription annulée avec succès !",
      data: {
        id: inscription._id,
        status: inscription.status,
        dateAnnulation: inscription.dateAnnulation,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'annulation de l'inscription :",
      error.message
    );
    return res.status(500).json({
      success: false,
      message:
        "❌ Une erreur s'est produite lors de l'annulation de l'inscription",
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
      message: "Une erreur s'est produite lors de la suppression de l'inscription",
      error: error.message,
    });
  }
};

