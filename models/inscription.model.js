import mongoose from "mongoose";

const inscriptionSchema = new mongoose.Schema({
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Link to the user who signed up
    required: true,
  },
  evenementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event", // Link to the event
    required: true,
  },
  utilisateurPublic: {
    nom: String,
    email: String,
    telephone: String
  },
  note: {
    type: String, 
  },
  telephone: {
    type: String, 
    require: true,
    // User phone (optional)
  },
  status: {
    type: String,
    enum: ["en attente", "validée", "annulée"], // Pending, confirmed or cancelled
    default: "en attente",
  },
  dateInscription: {
    type: Date,
    default: Date.now, // Automatically set when user signs up
  },
}, { timestamps: true });

// Prevent same user from signing up to same event twice
inscriptionSchema.index({ utilisateurId: 1, evenementId: 1 }, { unique: true });

const Inscription = mongoose.model("Inscription", inscriptionSchema);
export default Inscription;
