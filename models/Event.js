import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },

    typeEvenement: {
      type: String,
      enum: ["enligne", "Presentiel", "hybride"],
      required: true,
    },

    lieu: { type: String },
    capacite: { type: Number, required: true },

    categorieName: {
      type: String,
      required: true,
      validate: {
        validator: async function (name) {
          const categorie = await mongoose.model("Categorie").findOne({ name });
          return !!categorie;
        },
        message: props => `${props.value} is not a valid category name`,
      },
    },

    image: { type: String, required: true },

    organisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restrictionAge: {
      type: String,
      enum: ["tout public", "+18"],
      default: "tout public",
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

// 🔎 Validate category name before saving
eventSchema.pre("save", async function (next) {
  if (this.isModified("categorieName")) {
    const categorie = await mongoose.model("Categorie").findOne({ name: this.categorieName });
    if (!categorie) {
      throw new Error(`Invalid category name: ${this.categorieName}`);
    }
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
