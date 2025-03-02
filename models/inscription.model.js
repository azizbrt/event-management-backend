import mongoose from "mongoose";

const inscriptionSchema = new mongoose.Schema({
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    evenementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    status: {
        type: String,
        enum: ["en attente", "validée", "annulée"],
        default: "en attente"
    }
}, { timestamps: true }); 

// Empêcher un utilisateur de s'inscrire plusieurs fois au même événement
inscriptionSchema.index({ utilisateurId: 1, evenementId: 1 }, { unique: true });

const Inscription = mongoose.model("Inscription", inscriptionSchema);

export default Inscription;
