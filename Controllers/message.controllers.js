import Message from "../models/message.model.js";

export const envoyerMessage = async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Vous devez être connecté pour envoyer un message." });
        }

        const { email, contenu } = req.body; 

        // Make sure email and message are not empty
        if (!email || !contenu) {
            return res.status(400).json({ error: "L'email et le message sont obligatoires." });
        }

        // Create the message
        const message = new Message({
            expediteurId: req.user.id,
            email,
            contenu,
            statut: "en attente",
        });

        // Save to database
        await message.save();

        return res.status(201).json({ message: "Message envoyé avec succès" });
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de l'envoi du message." });
    }
};
export const getAllMessagesForAdmin = async (req,res)=>{
    try {
        // Get all messages from the database
        const message = await Message.find({});
        //verifier si des messages exist
        if (message.length===0) {
            return res.status(404).json({ error: "Aucun message trouvé." });
            
        }
        //retourner la liste des messages
        return res.status(200).json(message);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de récupération des messages." });
        
    }
}
export const updateMessageStatus = async (req,res)=>{
    try {
        const {id} = req.params;
        const {statut} = req.body;
        //verifier status resou ou en cours
        if (!["résolu","en cours"].includes(statut)) {
            return res.status(400).json({ error: "Statut non valide." });
            
        }
        //chercher le message by ID 
        const message = await Message.findByIdAndUpdate(
        id,
        {statut},
        {new:true});
        //verifier si le message est trouvé
        if (!message) {
            return res.status(404).json({ error: "Message non trouvé." });
            
        }
        //retourner le message mis à jour
        return res.status(200).json({ message: "Statut mis à jour avec succès", data: message });
        } catch (error) {
            return res.status(500).json({ error: "Erreur lors de la mise à jour du statut du message." });
            
    
        
    }
}
