import mongoose from "mongoose";
import Commentaire from "../models/commentaire.model.js";
import Event from "../models/Event.js";

// 📌 Créer un commentaire
export const creerCommentaire = async (req, res) => {
  try {
    const utilisateurId = req.user.id;
    const evenementId = req.params.evenementId; // 👉 on récupère depuis l'URL
    const { contenu } = req.body;

    if (!contenu?.trim()) {
      return res.status(400).json({ message: " Le contenu est requis !" });
    }

    const evenement = await Event.findById(evenementId);
    if (!evenement) {
      return res.status(404).json({ message: " Événement introuvable !" });
    }

    const commentaire = new Commentaire({
      utilisateurId,
      evenementId,
      contenu: contenu.trim(),
      dateCommentaire: new Date(),
    });

    await commentaire.save();
    res
      .status(201)
      .json({ message: "Commentaire créé avec succès !", commentaire });
  } catch (error) {
    console.error("Erreur création commentaire :", error);
    res.status(500).json({ message: ` Erreur serveur : ${error.message}` });
  }
};

// ✏️ Modifier un commentaire
export const modifierCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenu, note } = req.body;
    const utilisateurId = req.user.id;

    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return res.status(404).json({ message: " Commentaire introuvable !" });
    }

    if (commentaire.utilisateurId.toString() !== utilisateurId) {
      return res.status(403).json({
        message: " Vous ne pouvez modifier que vos propres commentaires !",
      });
    }

    const evenement = await Event.findById(commentaire.evenementId);
    if (!evenement) {
      return res
        .status(404)
        .json({ message: " Événement associé introuvable !" });
    }

    if (new Date() < new Date(evenement.dateFin)) {
      return res.status(400).json({
        message: " Modification autorisée après la fin de l’événement.",
      });
    }

    if (contenu?.trim()) commentaire.contenu = contenu.trim();
    if (note && note >= 1 && note <= 5) commentaire.note = note;

    await commentaire.save();
    res
      .status(200)
      .json({ message: "Commentaire modifié avec succès !", commentaire });
  } catch (error) {
    console.error("Erreur modification commentaire :", error);
    res.status(500).json({ message: ` Erreur serveur : ${error.message}` });
  }
};

// 🗑 Supprimer un commentaire
export const supprimerCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: utilisateurId, role } = req.user;

    const commentaire = await Commentaire.findById(id);
    if (!commentaire) {
      return res.status(404).json({ message: " Commentaire introuvable !" });
    }

    const evenement = await Event.findById(commentaire.evenementId);
    if (!evenement) {
      return res
        .status(404)
        .json({ message: " Événement associé introuvable !" });
    }

    if (
      role !== "admin" &&
      evenement.gestionnaireId.toString() !== utilisateurId
    ) {
      return res
        .status(403)
        .json({ message: " Non autorisé à supprimer ce commentaire." });
    }

    await commentaire.deleteOne();
    res.status(200).json({ message: "Commentaire supprimé avec succès !" });
  } catch (error) {
    console.error("Erreur suppression commentaire :", error);
    res.status(500).json({ message: ` Erreur serveur : ${error.message}` });
  }
};

// 📄 Afficher les commentaires d’un événement
export const afficherCommentaires = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: " ID d'événement invalide !" });
    }

    const evenement = await Event.findById(id);
    if (!evenement) {
      return res.status(404).json({ message: " Événement introuvable !" });
    }

    const commentaires = await Commentaire.find({ evenementId: id })
      .populate("utilisateurId", "name")
      .populate("responses.utilisateurId", "name") // pour les répondeurs
      .sort({ dateCommentaire: -1 });

    res
      .status(200)
      .json({ totalCommentaires: commentaires.length, commentaires });
  } catch (error) {
    console.error("Erreur affichage commentaires :", error);
    res.status(500).json({ message: ` Erreur serveur : ${error.message}` });
  }
};

// 💬 Ajouter une réponse à un commentaire
export const ajouterResponse = async (req, res) => {
  try {
    const { commentaireId } = req.params;
    const utilisateurId = req.user.id;
    const { contenu } = req.body;

    // Input validation
    if (!commentaireId || commentaireId === "undefined") {
      return res.status(400).json({ message: " ID de commentaire invalide !" });
    }
    if (!contenu?.trim()) {
      return res.status(400).json({ message: " Contenu requis !" });
    }

    // Add the response directly with findByIdAndUpdate for better performance
    const updatedComment = await Commentaire.findByIdAndUpdate(
      commentaireId,
      {
        $push: {
          responses: {
            utilisateurId,
            contenu: contenu.trim(),
            dateResponse: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("utilisateurId", "name")
      .populate("responses.utilisateurId", "name"); // This is the key line!

    if (!updatedComment) {
      return res.status(404).json({ message: " Commentaire introuvable !" });
    }

    res.status(201).json({
      message: "Réponse ajoutée avec succès!",
      commentaire: updatedComment,
    });
  } catch (error) {
    console.error("Erreur ajout réponse :", error);
    res.status(500).json({ message: ` Erreur serveur : ${error.message}` });
  }
};
export const supprimerReponse = async (req, res) => {
  try {
    const reponseId = req.params.id;
    if (!reponseId) {
      return res.status(400).json({ message: "ID de la réponse manquant" });
    }

    const commentaire = await Commentaire.findOneAndUpdate(
      { "responses._id": reponseId }, // chercher le commentaire contenant la réponse
      { $pull: { responses: { _id: reponseId } } }, // supprimer la réponse du tableau
      { new: true }
    );

    if (!commentaire) {
      return res.status(404).json({ message: "Réponse introuvable" });
    }

    res.status(200).json({ message: "Réponse supprimée" });
  } catch (err) {
    console.error("Erreur suppression réponse:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
