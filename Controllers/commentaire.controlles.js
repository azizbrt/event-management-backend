import mongoose from "mongoose";
import Commentaire from "../models/commentaire.model.js";
import Event from "../models/Event.js"; 

export const creerCommentaire = async (req, res) => {
  try {
    const utilisateurId = req.user.id; // Récupération depuis le token
    const { evenementId, contenu, note } = req.body;

    // Vérifier si tous les champs sont remplis
    if (!evenementId || !contenu) {
      return res.status(400).json({ message: "⛔ Tous les champs sont requis !" });
    }

    // Vérifier si la note est valide (optionnelle)
    if (note && (note < 1 || note > 5)) {
      return res.status(400).json({ message: "⚠️ La note doit être entre 1 et 5 !" });
    }

    // Vérifier si l'événement existe
    const evenement = await Event.findById(evenementId);
    if (!evenement) {
      return res.status(404).json({ message: "❌ Événement introuvable !" });
    }

    // Vérifier si l'événement est terminé
    const now = new Date();
    if (now < new Date(evenement.dateFin)) {
      return res.status(400).json({ message: "⛔ Vous ne pouvez commenter qu’après la fin de l’événement !" });
    }

    // Créer le commentaire
    const commentaire = new Commentaire({
      utilisateurId,
      evenementId,
      contenu,
      note,
      dateCommentaire: new Date(),
    });

    await commentaire.save();
    res.status(201).json({ message: "✅ Commentaire créé avec succès !", commentaire });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `❌ Erreur lors de la création du commentaire : ${error.message}` });
  }
};
export const modifierCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenu, note } = req.body;
    const utilisateurId = req.user.id; // Récupération de l'utilisateur depuis le token

    // Vérifier si le commentaire existe
    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return res.status(404).json({ message: "❌ Commentaire introuvable !" });
    }

    // Vérifier si l'utilisateur est le propriétaire du commentaire
    if (commentaire.utilisateurId.toString() !== utilisateurId) {
      return res.status(403).json({ message: "⛔ Vous ne pouvez modifier que vos propres commentaires !" });
    }

    // Vérifier si l'événement lié est terminé
    const evenement = await Event.findById(commentaire.evenementId);
    if (!evenement) {
      return res.status(404).json({ message: "❌ Événement associé introuvable !" });
    }

    const now = new Date();
    if (now < new Date(evenement.dateFin)) {
      return res.status(400).json({ message: "⛔ Vous ne pouvez modifier votre commentaire qu’après la fin de l’événement !" });
    }

    // Vérifier que le contenu n'est pas vide
    if (contenu && contenu.trim().length === 0) {
      return res.status(400).json({ message: "⚠️ Le commentaire ne peut pas être vide !" });
    }

    // Vérifier si la note est valide
    if (note && (note < 1 || note > 5)) {
      return res.status(400).json({ message: "⚠️ La note doit être entre 1 et 5 !" });
    }

    // Mise à jour des champs
    if (contenu) commentaire.contenu = contenu;
    if (note) commentaire.note = note;
    await commentaire.save();

    res.status(200).json({ message: "✅ Commentaire modifié avec succès !", commentaire });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
  }
};
export const supprimerCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateurId = req.user.id;  // Récupération de l'ID de l'utilisateur depuis le token
    const role = req.user.role; // Récupération du rôle

    // Vérifier si le commentaire existe
    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return res.status(404).json({ message: "❌ Commentaire introuvable !" });
    }

    // Vérifier si l'utilisateur a le droit de supprimer (admin ou gestionnaire de l'événement)
    const evenement = await Event.findById(commentaire.evenementId);
    if (!evenement) {
      return res.status(404).json({ message: "❌ Événement associé introuvable !" });
    }

    if (role !== "admin" && evenement.gestionnaireId.toString() !== utilisateurId) {
      return res.status(403).json({ message: "⛔ Vous n'avez pas l'autorisation de supprimer ce commentaire !" });
    }

    // Supprimer le commentaire
    await Commentaire.findByIdAndDelete(id);
    res.status(200).json({ message: "✅ Commentaire supprimé avec succès !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
  }
};
export const afficherCommentaires = async (req, res) => {
  try {
    const { id } = req.params; // ID de l'événement

    // Vérifier si l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "❌ ID d'événement invalide !" });
    }

    // Vérifier si l'événement existe
    const evenement = await Event.findById(id);
    if (!evenement) {
      return res.status(404).json({ message: "❌ Événement introuvable !" });
    }
    // Récupérer tous les commentaires avec le nom des utilisateurs
    const commentaires = await Commentaire.find({ evenementId: id })
      .populate("utilisateurId", "name") // Récupère seulement le `name`
      .sort({ datecommentaire: -1 }); // Trier du plus récent au plus ancien

    res.status(200).json({ totalCommentaires: commentaires.length, commentaires });
  } catch (error) {
    console.error("Erreur affichage commentaires :", error);
    res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
  }
};
export const ajouterResponse = async (req, res) => {
  try {
    const { id } = req.params; // ID du commentaire
    const { utilisateurId, contenu } = req.body; // ID utilisateur et contenu de la réponse

    // Vérifier si le commentaire existe
    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return res.status(404).json({ message: "❌ Commentaire introuvable !" });
    }

    // Vérifier si l'utilisateurId est fourni
    if (!utilisateurId) {
      return res.status(400).json({ message: "⛔ utilisateurId est requis pour répondre !" });
    }

    // Ajouter la réponse avec utilisateurId
    commentaire.responses.push({ utilisateurId, contenu });
    await commentaire.save();

    res.status(201).json({ message: "✅ Réponse ajoutée avec succès!", commentaire });
  } catch (error) {
    console.error("Erreur ajout réponse :", error);
    res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
  }
};




