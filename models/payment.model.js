import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // 👤 Qui a payé
    utilisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📅 Pour quel événement il a payé
    evenementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // 📋 L’inscription liée (facultatif)
    inscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inscription",
      required: true,
    },

    // 👀 Juste une copie des infos visibles de l’utilisateur
    utilisateurPublic: {
      nom: { type: String },
      email: { type: String },
      telephone: { type: String },
    },

    // 💰 Combien il a payé (le prix de l’événement)
    montant: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🔢 Référence du paiement (générée automatiquement, unique)
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    // models/Payment.js
    preuve: {
      type: String, // URL ou nom de fichier
      required: false,
    },

    // 🕒 Date du paiement (automatique)
    datePaiement: {
      type: Date,
      default: () => new Date(),
    },
    preuvePaiement: {
      type: String, // URL vers le fichier
    },

    // ⏳ Le statut du paiement
    statut: {
      type: String,
      enum: ["en attente", "validé", "refusé"],
      default: "en attente",
    },
  },
  { timestamps: true }
);

// 🚫 Empêcher qu’un utilisateur paye deux fois pour le même événement
paymentSchema.index({ utilisateurId: 1, evenementId: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
