import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    typeEvenement: {
      type: String,
      enum: ["en ligne", "physique"],
      required: true,
    },
    lieu: { type: String },
    capacite: { type: Number, required: true },
    categorieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
    },
    lienInscription: { type: String },
    image: { type: String, required: true },
    organisateurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    etat: {
      type: String,
      enum: ["en attendant", "accepter", "refusé"],
      default: "en attendant",
    },
    tag: [{ type: String, required: true, minlength: 1 }],
    prix: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Event = mongoose.model("Event", eventSchema);

export default Event;
