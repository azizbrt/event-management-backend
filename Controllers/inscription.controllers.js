import Inscription from "../models/inscription.model.js";
import Event from "../models/Event.js";
import User from "../models/user.model.js"; // Mets le bon chemin vers ton modèle
import { sendInscriptionEmail, sendValidationEmail } from "../services/emailService.js";
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
    const dejaInscrit = await Inscription.findOne({ utilisateurId, evenementId });
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
    await sendInscriptionEmail(
      utilisateur.email,
      utilisateur.name,
      event.titre,
      event.dateDebut
    );

    // 11. Réponse finale
    res.status(201).json({
      success: true,
      message: "✅ Inscription réussie ! Un email de confirmation a été envoyé.",
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


export const consulterInscriptions = async (req, res) => {
  try {
    const utilisateur = req.user; // Récupérer l'utilisateur connecté
    const { evenementId } = req.query;
    let filter = {}; // Filtre par défaut (toutes les inscriptions)

    //  Gestionnaire : voir uniquement ses événements
    if (utilisateur.role === "gestionnaire") {
      const evenements = await Event.find({
        organisateurId: utilisateur.id,
      }).select("_id");
      const evenementsGeres = evenements.map((e) => e._id);
      filter.evenementId = { $in: evenementsGeres };
    }

    //  Admin : pas de restriction, il peut voir tout !
    if (utilisateur.role === "admin") {
      filter = {}; // Il voit toutes les inscriptions ✅
    }
    // Participant : voir uniquement SES propres inscriptions
    if (utilisateur.role === "participant") {
      filter.utilisateurId = utilisateur.id;
    }

    // Si un `evenementId` est fourni, on filtre dessus
    if (evenementId) {
      filter.evenementId = evenementId;
    }

    // Récupérer les inscriptions
    const inscriptions = await Inscription.find(filter)
      .populate("utilisateurId", "name email")
      .populate("evenementId", "titre dateDebut dateFin");

    if (inscriptions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Aucune inscription trouvée !" });
    }

    res.status(200).json({
      success: true,
      message: "📋 Liste des inscriptions récupérée avec succès",
      inscriptions,
    });
  } catch (error) {
    console.error(
      "⚠️ Erreur lors de la récupération des inscriptions :",
      error
    );
    res.status(500).json({
      success: false,
      message: "❌ Une erreur s'est produite",
      error: error.message,
    });
  }
};

export const validerInscription = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Vérifier si l'inscription existe
      const inscription = await Inscription.findById(id).populate("evenementId");
      if (!inscription) {
        return res.status(404).json({ message: "❌ Inscription introuvable !" });
      }
  
      // 🔍 Récupérer l'utilisateur inscrit
      const utilisateur = await User.findById(inscription.utilisateurId);
      if (!utilisateur) {
        return res.status(404).json({ message: "❌ Utilisateur introuvable !" });
      }
  
      // Vérifier si l'inscription est déjà validée
      if (inscription.status === "validée") {
        return res.status(400).json({ message: "⚠️ Cette inscription est déjà validée !" });
      }
  
      // Vérifier si l'inscription est annulée
      if (inscription.status === "annulée") {
        return res.status(400).json({
          message: "⚠️ Impossible de valider une inscription annulée !",
        });
      }
  
      // Vérifier si l'événement existe encore
      if (!inscription.evenementId) {
        return res.status(400).json({
          message: "❌ L'événement associé à cette inscription n'existe plus !",
        });
      }
  
      // Valider l'inscription
      inscription.status = "validée";
      inscription.dateValidation = new Date(); // Ajout de la date de validation
      await inscription.save();
  
      // 📩 Envoyer un email de confirmation
      if (utilisateur.email) {
        await sendValidationEmail(utilisateur.email, utilisateur.name);
        console.log(`📩 Email de validation envoyé à ${utilisateur.email}`);
      }
  
      res
        .status(200)
        .json({ message: "✅ Inscription validée avec succès !", inscription });
    } catch (error) {
      console.error("❌ Erreur lors de la validation de l'inscription :", error);
      res.status(500).json({
        message: "❌ Une erreur s'est produite lors de la validation de l'inscription",
        error: error.message,
      });
    }
  };
  
export const annulerInscription = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'inscription existe
    const inscription = await Inscription.findById(id);
    if (!inscription) {
      return res.status(404).json({ message: "❌ Inscription introuvable !" });
    }

    // Vérifier si l'inscription est déjà annulée
    if (inscription.status === "annulée") {
      return res
        .status(400)
        .json({ message: "⚠️ Cette inscription est déjà annulée !" });
    }

    // Vérifier si l'inscription est déjà validée
    if (inscription.status === "validée") {
      return res
        .status(400)
        .json({ message: "⛔ Impossible d'annuler une inscription validée !" });
    }

    // Annuler l'inscription
    inscription.status = "annulée";
    inscription.dateAnnulation = new Date(); // Ajout de la date d'annulation
    await inscription.save();

    res
      .status(200)
      .json({ message: "✅ Inscription annulée avec succès !", inscription });
  } catch (error) {
    console.error("❌ Erreur lors de l'annulation de l'inscription :", error);
    res.status(500).json({
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
    //trouver l'inscription
    const inscription = await Inscription.findById(id);
    if (!inscription) {
      return res.status(404).json({ message: "�� Inscription introuvable !" });
    }
    //Vérifier si l'utilisateur est admin ou gestionnaire
    if (inscription.utilisateurId.toString() == utilisateur.id) {
      return res
        .status(403)
        .json({
          message: "�� Vous n'êtes pas autorisé à supprimer cette inscription!",
        });
    }
    //Supprimer l'inscription
    await inscription.deleteOne();
    res.status(200).json({ message: "�� Inscription supprimée avec succès!" });
  } catch (error) {
    console.error("�� Erreur lors de la suppression de l'inscription :", error);
    res
      .status(500)
      .json({
        message:
          "�� Une erreur s'est produite lors de la suppression de l'inscription",
        error: error.message,
      });
  }
};
