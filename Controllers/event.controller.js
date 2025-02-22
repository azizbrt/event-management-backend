import Event from "../models/Event.js";
import mongoose from "mongoose";

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
      categorieId,
      lienInscription,
      image,
      tag,
      prix,
      organisateurId,
    } = req.body;

    //  Vérifions si toutes les infos importantes sont là
    if (
      !titre ||
      !description ||
      !dateDebut ||
      !dateFin ||
      !typeEvenement ||
      !lieu ||
      !capacite ||
      !categorieId ||
      !image ||
      !organisateurId
    ) {
      return res.status(400).json({
        success: false,
        message: "Remplis tous les champs obligatoires !",
      });
    }

    // ⏳ Vérifions la date
    if (new Date(dateFin) <= new Date(dateDebut)) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être après la date de début !",
      });
    }

    // 🛑 Vérifier que les événements physiques ont une adresse valide
    if (typeEvenement === "physique" && lieu.startsWith("http")) {
      return res.status(400).json({
        success: false,
        message:
          "Un événement physique doit avoir une adresse physique, pas un lien !",
      });
    }

    // 🔍 Vérifions si un événement avec le même titre existe déjà pour cet organisateur
    const evenementExiste = await Event.findOne({ titre, organisateurId });
    if (evenementExiste) {
      return res.status(409).json({
        success: false,
        message: "Tu as déjà créé un événement avec ce titre !",
      });
    }

    // 🎉 Créons l'événement
    const nouvelEvenement = new Event({
      titre,
      description,
      dateDebut,
      dateFin,
      typeEvenement,
      lieu,
      capacite,
      categorieId,
      organisateurId,
      lienInscription,
      image,
      tag,
      prix,
      etat: "en attendant",
    });

    await nouvelEvenement.save();

    res.status(201).json({
      success: true,
      message: "Événement créé avec succès ! En attente de validation.",
      event: nouvelEvenement,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'événement :", error);
    res.status(500).json({
      success: false,
      message: "Oups ! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const getAllEvents = async (req, res) => {
  try {
    // 📢 On prend tous les événements dans la base de données
    const events = await Event.find();

    // ✅ On envoie la liste au frontend
    res.status(200).json({
      success: true,
      message: "Tous les événements récupérés avec succès !",
      total: events.length, // 🔢 Nombre total d'événements
      events, // 📄 La liste des événements
    });
  } catch (error) {
    // ❌ Si ça ne marche pas, on affiche l'erreur
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
    // 1️⃣ On récupère l'ID de l'événement depuis l'URL
    const { id } = req.params;

    // 2️⃣ Vérifier si l'ID est valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "L'ID fourni est invalide !",
      });
    }

    // 3️⃣ Mettre à jour l'événement avec les nouvelles infos
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    // 4️⃣ Vérifier si l'événement existe
    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Aucun événement trouvé avec cet ID !",
      });
    }

    // 5️⃣ Envoyer la réponse
    res.status(200).json({
      success: true,
      message: "Événement mis à jour avec succès !",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Oups ! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Vérifier si l'ID est valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "L'ID fourni est invalide !",
      });
    }

    // 2️⃣ Vérifier si l'événement existe avant de le supprimer
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "L'événement n'existe pas ou a déjà été supprimé !",
      });
    }

    // 3️⃣ Supprimer l'événement
    await Event.findByIdAndDelete(id);

    // 4️⃣ Envoyer une réponse de confirmation
    res.status(200).json({
      success: true,
      message: "Événement supprimé avec succès !",
      event: event, // Retourner l'événement supprimé pour le frontend
    });
  } catch (error) {
    console.error("❌ Erreur de suppression :", error);
    res.status(500).json({
      success: false,
      message: "Oups ! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const updateEventState = async (req, res) => {
  try {
    const { id } = req.params; // 📌 Récupérer l'ID de l'événement
    const { etat } = req.body; // 📌 Récupérer le nouvel état

    // ✅ Vérifier si l'état est valide
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
      message: "⚠️ Oups ! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const getEventsByGestionnaire = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Vérifier si l'ID est valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "L'ID du gestionnaire est invalide !",
      });
    }

    // 2️⃣ Récupérer les événements créés par ce gestionnaire
    const events = await Event.find({ organisateurId: id });

    res.status(200).json({
      success: true,
      message: `Liste des événements créés par le gestionnaire ${id}`,
      total: events.length,
      events,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des événements :", error);
    res.status(500).json({
      success: false,
      message: "Oups! Quelque chose s'est mal passé...",
      error: error.message,
    });
  }
};
export const getEventById  = async (req,res)=>{
    try {
        const {id}=req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({
                success: false,
                message: "L'ID fourni est invalide!",
            })
            
        }
        //recuperer l'evenement  par son ID
        const event= await Event.findById(id);
        //verifier si l'evenement existe
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Aucun événement trouvé avec cet ID!",
            })
            
        }
        res.status(200).json({
            success: true,
            message: "Événement trouvé avec succès!",
            event,
        }) 
    } catch (error) {
        console.error("Erreur lors de la récupération de l'événement :", error);
        res.status(500).json({
            success: false,
            message: " Oups! Quelque chose s'est mal passé...",
            error: error.message,
        })
        
    }
}
