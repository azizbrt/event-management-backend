import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema({
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    evenementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    montant : {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["en attente", "validée", "échouée"],
        default: "en attente"
    },
    datePaiment:{
        type: Date,
        default: ()=>new Date,
    },
    paymentMethode:{
        type: String,
        enum: ["carte-bancaire", "virement", "especes"],
        required: true,
    }

},
{timestamps:true});
//verifier l'utilisateur de payer un seul fois por chaque evenement
paymentSchema.index({ utilisateurId:1,evenementId:1},{unique:true})
// ✅ Prevent invalid status updates
paymentSchema.pre("save", function (next) {
    if (!["en attente", "validée", "échouée"].includes(this.status)) {
        return next(new Error("Statut de paiement invalide."));
    }
    next();
});
const Payment = mongoose.model("Payment",paymentSchema);
export default Payment;