import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 🔗 Qui a payé
      required: true,
    },
    evenementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // 🔗 Pour quel événement
      required: true,
    },
    inscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscription", // 🔗 S'il est inscrit (facultatif)
    },

    // 👤 Copie figée des infos de l'utilisateur (pratique pour l'historique)
    utilisateurPublic: {
      nom: { type: String },
      email: { type: String },
      telephone: { type: String },
    },

    montant: {
      type: Number,
      required: true,
      min: 0, // ❗Pas de montant négatif
    },

    paymentMethode: {
      type: String,
      enum: ["virement"],
      required: true,
    },


    statut: {
      type: String,
      enum: ["en attente", "validé", "refusé"],
      default: "en attente", // ⏳ En cours jusqu'à vérification
    },
    datePaiement: {
      type: Date,
      default: () => new Date(), // 🕒 Prise automatiquement à la création
    },
  },
  { timestamps: true }
);

// 🚫 Empêcher un utilisateur de payer deux fois pour le même événement
paymentSchema.index({ utilisateurId: 1, evenementId: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
