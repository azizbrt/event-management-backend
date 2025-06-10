import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["gestionnaire", "participant","admin"],
      default: "participant",
    },
    dateInscription: {
      type: Date,
      default: Date.now,
    },
    etatCompte: {
      type: String,
      enum: ["actif", "suspendu"],
      default: "actif",
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationExpiresAt: Date,
  },
  { timestamps: true }
);

// Create the model
const User = mongoose.model("User", userSchema);

export default User;
