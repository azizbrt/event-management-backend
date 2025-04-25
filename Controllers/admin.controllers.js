import bcrypt from "bcryptjs/dist/bcrypt.js";
import Event from "../models/Event.js";
import Inscription from "../models/inscription.model.js";
import User from "../models/user.model.js"
import { sendVerificationEmail } from "../services/emailService.js";


export const getTotalUsers = async (req,res)=>{
    try {
        const totalUsers = await User.countDocuments();
        res.status(200).json({ totalUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
} 
export const getTotalEvents = async (req,res)=>{
    try {
        const totalEvents = await Event.countDocuments();
        res.status(200).json({ totalEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
}
export const totalInscriptions  = async (req,res)=>{
    try {
        const totalinscription = await Inscription.countDocuments();
        res.status(200).json({ totalinscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
        
    }
}
export const getEvenementsPopulaires = async (req, res) => {
    try {
      const evenements = await Event.aggregate([
        {
          $lookup: {
            from: "inscriptions", // Nom de la collection des inscriptions
            localField: "_id",
            foreignField: "evenementId",
            as: "participants"
          }
        },
        {
          $addFields: { nombreParticipants: { $size: "$participants" } }
        },
        { $sort: { nombreParticipants: -1 } }, // Trier par nombre de participants (descendant)
        { $limit: 5 } // Limiter aux 5 événements les plus populaires
      ]);
  
      res.status(200).json({ evenements });
    } catch (error) {
      console.error("Erreur récupération événements populaires :", error);
      res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
    }
  };
export const getDernieresInscriptions  = async (req,res) =>{
  try {
    const inscription = await Inscription.find()
    .populate("utilisateurId","name email")
    .populate("evenementId","title dateDebut")
    .sort({ dateInscription: -1 })
    .limit(5);
    res.status(200).json({ inscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
    
  }
}

// 🧠 GET all users (excluding passwords)
export const getAllUsers = async (req, res) => {
  try {
    // 🔍 Fetch all users and exclude passwords
    const users = await User.find().select("-password");

    // ✅ Send users with a 200 OK response
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Failed to fetch users:", error.message);

    // 🚨 Send a clear server error message
    return res.status(500).json({
      success: false,
      message: "Erreur serveur : impossible de récupérer les utilisateurs.",
    });
  }
};
export const createUser = async (req, res) => {
  // Getting the important information from the request body
  const { email, name, password, role } = req.body;

  try {
    // Step 1: Check if all fields are filled
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires.",
      });
    }

    // Step 2: Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "Cet email est déjà utilisé.",
      });
    }

    // Step 3: Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10); // Salt is the secret mix
    const hashedPassword = await bcrypt.hash(password, salt); // Hiding the password

    // Step 4: Generate a verification token (secret code)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Step 5: Create the new user with hashed password and verification info
    const user = new User({
      email,
      password: hashedPassword,  // Saving the hidden password
      name,
      verificationToken,  // Send this code to verify email
      verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // Token expires in 24 hours
    });

    // Save the user to the database
    await user.save();

    // Step 6: Send the verification email to the user
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // Step 7: Respond with a success message (without the password!)
    const { password: _, ...userWithoutPassword } = user.toObject();  // Remove password from response
    return res.status(201).json({
      success: true,
      message: "Compte créé ! Vérifiez votre email.",
      data: userWithoutPassword,  // Return everything except the password
    });
  } catch (error) {
    console.error("❌ Erreur création utilisateur:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'utilisateur.",
    });
  }
};
export const updateUser = async (req, res) => {
  const { name, email, password, role, etatCompte } = req.body; // Get the new data to update

  try {
    // Step 1: Find the user by their ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé.",
      });
    }

    // Step 2: Validate the fields (if we need to)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé.",
        });
      }
      user.email = email;  // Update the email
    }

    // Step 3: Validate etatCompte (if provided)
    if (etatCompte && !["actif", "inactif", "suspendu"].includes(etatCompte)) {
      return res.status(400).json({
        success: false,
        message: "Valeur invalide pour etatCompte. Choisissez parmi 'actif', 'inactif' ou 'suspendu'.",
      });
    }
    if (etatCompte) user.etatCompte = etatCompte; // Update the etatCompte if it's valid

    // Step 4: If password is provided, hash it before saving
    if (password) {
      const salt = await bcrypt.genSalt(10);  // Create a new salt
      user.password = await bcrypt.hash(password, salt);  // Hash the new password
    }

    // Step 5: Update other fields
    if (name) user.name = name;
    if (role) user.role = role;

    // Step 6: Save the updated user
    await user.save();

    // Step 7: Respond with the updated user data (without the password!)
    const { password: _, ...updatedUser } = user.toObject(); // Remove password from response
    return res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour utilisateur:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'utilisateur.",
    });
  }
};
export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    // Vérifier si l'admin tente de supprimer son propre compte
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    // Supprimer l'utilisateur
    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'utilisateur :", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur.",
    });
  }
};

// Controller to get users based on search query
export const getAllUsersSearch = async (req, res) => {
  try {
    // Get the search term from the request (default to empty string if not provided)
    const search = req.query.search || "";

    // Find users where name or email matches the search term (case-insensitive)
    const users = await User.find({
      $or: [
        { name: new RegExp(search, "i") }, // Search by name
        { email: new RegExp(search, "i") }, // Search by email
      ],
    }).select("-password"); // Exclude password from the result

    // Send the list of users as a response
    res.json(users);
  } catch (err) {
    // If there's an error, send a 500 status with the error message
    res.status(500).json({ error: "Erreur serveur" });
  }
};




  
  