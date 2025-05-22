import mongoose from "mongoose";
import Event from "../models/Event.js";
import Inscription from "../models/inscription.model.js";
import Payment from "../models/payment.model.js";

export const createEvent = async (req, res) => {
  try {
    const {
      titre,
      description,
      dateDebut,
      dateFin,
      typeEvenement,
      lieu,
      capacite,
      categorieName,
      lienInscription,
      tag,
      prix,
      restrictionAge, // New field
    } = req.body;

    const imageFile = req.file;
    const organisateur = req.user?.id;

    console.log("Utilisateur authentifié :", req.user);

    const requiredFields = [
      titre,
      description,
      dateDebut,
      dateFin,
      typeEvenement,
      lieu,
      capacite,
      categorieName,
      imageFile,
      organisateur,
    ];

    if (requiredFields.some((field) => !field)) {
      return res.status(400).json({
        success: false,
        message: "Remplis tous les champs obligatoires !",
      });
    }

    if (new Date(dateFin) <= new Date(dateDebut)) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être après la date de début !",
      });
    }

    if (typeEvenement === "Presentiel" && lieu.startsWith("http")) {
      return res.status(400).json({
        success: false,
        message: "Un événement physique nécessite une adresse physique valide",
      });
    }

    const existingEvent = await Event.findOne({ titre, organisateur });
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: "Vous avez déjà créé un événement avec ce titre !",
      });
    }

    const nouvelEvenement = new Event({
      titre,
      description,
      dateDebut,
      dateFin,
      typeEvenement,
      lieu,
      capacite,
      categorieName,
      lienInscription,
      image: imageFile.filename,
      organisateur,
      tag: tag.split(",").map((t) => t.trim()),
      prix,
      restrictionAge: restrictionAge || "tout public", // Use default if not sent
      etat: "en attendant",
    });

    await nouvelEvenement.save();
    await nouvelEvenement.populate("organisateur", "name email");

    return res.status(201).json({
      success: true,
      message: "Événement créé avec succès ! En attente de validation.",
      event: nouvelEvenement,
    });
  } catch (error) {
    console.error(" Erreur lors de la création de l'événement :", error);

    if (error.message.includes("Invalid category name")) {
      return res.status(400).json({
        success: false,
        message:
          "Catégorie invalide - Veuillez choisir parmi les catégories existantes",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    // 📢 On prend tous les événements dans la base de données
    const events = await Event.find().populate("organisateur", "name email");
    // On envoie la liste au frontend
    res.status(200).json({
      success: true,
      message: "Tous les événements récupérés avec succès !",
      total: events.length, // 🔢 Nombre total d'événements
      events, // 📄 La liste des événements
    });
  } catch (error) {
    //  Si ça ne marche pas, on affiche l'erreur
    console.error("Erreur lors de la récupération des événements :", error);
    res.status(500).json({
      success: false,
      message: "Oups ! Quelque chose s'est mal passé...",
      error: error.message, // 🛠️ On explique pourquoi ça a planté
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "L'ID fourni est invalide !",
      });
    }

    const updateFields = { ...req.body };

    // Si une image a été envoyée
    if (req.file) {
      updateFields.image = req.file.filename;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Aucun événement trouvé avec cet ID !",
      });
    }

    res.status(200).json({
      success: true,
      message: "Événement mis à jour avec succès",
      data: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'ID est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "L'ID fourni est invalide !",
      });
    }

    // 🗑️ Supprimer l'événement
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "L'événement n'existe pas ou a déjà été supprimé !",
      });
    }

    // 🗑️ Supprimer les inscriptions liées à cet événement
    const inscriptions = await Inscription.find({ evenementId: id });

    const inscriptionIds = inscriptions.map((i) => i._id);

    await Inscription.deleteMany({ evenementId: id });

    // 🗑️ Supprimer les paiements liés à ces inscriptions
    await Payment.deleteMany({ inscriptionId: { $in: inscriptionIds } });

    // 🔁 Ajouter ici d’autres suppressions si tu as des messages, commentaires, etc.
    // await Message.deleteMany({ eventId: id });

    // Réponse de succès
    res.status(200).json({
      success: true,
      message:
        "Événement et toutes les données associées supprimés avec succès.",
      event: deletedEvent,
    });
  } catch (error) {
    console.error(" Erreur de suppression :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'événement.",
      error: error.message,
    });
  }
};

export const updateEventState = async (req, res) => {
  try {
    const { id } = req.params; // 📌 Récupérer l'ID de l'événement
    const { etat } = req.body; // 📌 Récupérer le nouvel état

    // Vérifier si l'état est valide
    const etatsAutorises = ["en attente", "accepter", "refusé"];
    if (!etatsAutorises.includes(etat)) {
      return res.status(400).json({
        success: false,
        message:
          " L'état fourni est invalide ! Choisissez parmi : 'en attente', 'accepter', 'refusé'.",
      });
    }

    // 🔍 Vérifier si l'événement existe
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Aucun événement trouvé avec cet ID !",
      });
    }

    //  Vérifier si l'événement est déjà "accepté" et empêcher un autre changement vers "accepter"
    if (event.etat === "accepter" && etat === "accepter") {
      return res.status(400).json({
        success: false,
        message:
          " Cet événement est déjà accepté, vous ne pouvez pas l'accepter à nouveau !",
      });
    }

    // 🔄 Mettre à jour l'état de l'événement
    event.etat = etat;
    await event.save();

    // 🎉 Réponse de succès
    res.status(200).json({
      success: true,
      message: ` L'état de l'événement a été mis à jour en '${etat}'`,
      event,
    });
  } catch (error) {
    console.error(" Erreur lors de la mise à jour de l'état :", error);
    res.status(500).json({
      success: false,
      message: " Oups ! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};

export const getEventsByOrganisateurId = async (req, res) => {
  try {
    const { id } = req.params;

    // Find events and populate organizer details
    const events = await Event.find({ organisateur: id }).populate(
      "organisateur",
      "name"
    );

    if (!events.length) {
      return res.status(200).json({
        success: true,
        message: "No events found",
        events: [],
      });
    }

    // Format response to include organizer name
    const formattedEvents = events.map((event) => ({
      ...event.toObject(),
      organisateurName: event.organisateur.name, // Add the name
    }));

    res.status(200).json({
      success: true,
      events: formattedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: "L'ID fourni est invalide!",
      });
    }
    //recuperer l'evenement  par son ID
    const event = await Event.findById(id);
    //verifier si l'evenement existe
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Aucun événement trouvé avec cet ID!",
      });
    }
    res.status(200).json({
      success: true,
      message: "Événement trouvé avec succès!",
      event,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement :", error);
    res.status(500).json({
      success: false,
      message: " Oups! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const getRandomEvents = async (req, res) => {
  try {
    // This picks 5 random events from your collection
    const randomEvents = await Event.aggregate([{ $sample: { size: 5 } }]);
    res.json(randomEvents);
  } catch (error) {
    console.error("Error fetching random events:", error);
    res.status(500).json({ message: "Error fetching random events" });
  }
};
