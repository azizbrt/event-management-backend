import mongoose from "mongoose";

const inscriptionSchema = new mongoose.Schema({
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Utilisateur inscrit
    required: true,
  },
  evenementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event", // Événement concerné
    required: true,
  },
  utilisateurPublic: {
    nomAffiché: { type: String, required: true }, // Nom affiché lors de l’inscription
    email: { type: String },                      
    telephone: { type: String },                  
  },
  note: {
    type: String, // Note personnelle laissée lors de l’inscription
  },
  status: {
    type: String,
    enum: ["en attente", "validée", "annulée"], // État de l’inscription
    default: "en attente",
  },
  dateInscription: {
    type: Date,
    default: Date.now, // Date automatique d’inscription
  },
}, { timestamps: true });

// Empêcher une double inscription du même utilisateur au même événement
inscriptionSchema.index({ utilisateurId: 1, evenementId: 1 }, { unique: true });

const Inscription = mongoose.model("Inscription", inscriptionSchema);
export default Inscription;
