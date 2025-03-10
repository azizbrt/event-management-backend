import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    expediteurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
        
    },
    email: {
        type: String,
        required: true, // Make sure the email is provided
        trim: true // Automatically trims spaces
    },
    contenu: {
        type: String,
        required: true,
        trim: true // Trim any unnecessary spaces from the content
    },
    dateEnvoi: {
        type: Date,
        default: Date.now
    },
    statut: {
        type: String,
        enum: ["en attente", "en cours", "résolu"],
        default: "en attente"
    },
    responseAdmin: {
        type: String,
        default: ""
    },
}, 
{ timestamps: true }); // Automatically adds createdAt and updatedAt fields

const Message = mongoose.model("Message", messageSchema);

export default Message;
