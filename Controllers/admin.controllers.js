import Event from "../models/Event.js";
import Inscription from "../models/inscription.model.js";
import User from "../models/user.model.js"


export const getTotalUsers = async (req,res)=>{
    try {
        const totalUsers = await User.countDocuments();
        res.status(200).json({ totalUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
} 
export const getTotalEvents = async (req,res)=>{
    try {
        const totalEvents = await Event.countDocuments();
        res.status(200).json({ totalEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
}
export const totalInscriptions  = async (req,res)=>{
    try {
        const totalinscription = await Inscription.countDocuments();
        res.status(200).json({ totalinscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
}
export const getEvenementsPopulaires = async (req, res) => {
    try {
      const evenements = await Event.aggregate([
        {
          $lookup: {
            from: "inscriptions", // Nom de la collection des inscriptions
            localField: "_id",
            foreignField: "evenementId",
            as: "participants"
          }
        },
        {
          $addFields: { nombreParticipants: { $size: "$participants" } }
        },
        { $sort: { nombreParticipants: -1 } }, // Trier par nombre de participants (descendant)
        { $limit: 5 } // Limiter aux 5 événements les plus populaires
      ]);
  
      res.status(200).json({ evenements });
    } catch (error) {
      console.error("Erreur récupération événements populaires :", error);
      res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
    }
  };
export const getDernieresInscriptions  = async (req,res) =>{
  try {
    const inscription = await Inscription.find()
    .populate("utilisateurId","name email")
    .populate("evenementId","title dateDebut")
    .sort({ dateInscription: -1 })
    .limit(5);
    res.status(200).json({ inscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
    
  }
}
  
  