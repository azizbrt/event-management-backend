import mongoose from "mongoose";
const commentaireSchema = new mongoose.Schema({
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    evenementId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    contenu: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 500,
    },
    datecommentaire:{
        type: Date,
        default: Date.now,
    },
    note:{
        type: Number,
        min: 1,
        max: 5,
    },
    responses:[{
        utilisateurId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        contenu: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 500,
        },
        dateResponse:{
            type: Date,
            default: Date.now,
        },  
    }]
},
{ timestamps: true }
);

const Commentaire = mongoose.model("Commentaire", commentaireSchema);

export default Commentaire;