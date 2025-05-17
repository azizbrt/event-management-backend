import bcrypt from "bcryptjs/dist/bcrypt.js";
import Event from "../models/Event.js";
import Inscription from "../models/inscription.model.js";
import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import { sendGestionnaireVerificationEmail } from "../services/emailService.js";

function generateStrongPassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
  const allChars = uppercase + lowercase + digits + symbols;

  const getRandom = (chars) => chars[Math.floor(Math.random() * chars.length)];

  const password = [
    getRandom(uppercase),
    getRandom(lowercase),
    getRandom(digits),
    getRandom(symbols), // Ensure at least one symbol
  ];

  while (password.length < length) {
    password.push(getRandom(allChars));
  }

  return password.sort(() => Math.random() - 0.5).join("");
}


export const getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};
export const getTotalEvents = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    res.status(200).json({ totalEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};
export const totalInscriptions = async (req, res) => {
  try {
    const totalinscription = await Inscription.countDocuments();
    res.status(200).json({ totalInscriptions: totalinscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};
export const getEvenementsPopulaires = async (req, res) => {
  try {
    const evenements = await Event.aggregate([
      {
        $lookup: {
          from: "inscriptions", // Nom de la collection des inscriptions
          localField: "_id",
          foreignField: "evenementId",
          as: "participants",
        },
      },
      {
        $addFields: { nombreParticipants: { $size: "$participants" } },
      },
      { $sort: { nombreParticipants: -1 } }, // Trier par nombre de participants (descendant)
      { $limit: 5 }, // Limiter aux 5 événements les plus populaires
    ]);

    res.status(200).json({ evenements });
  } catch (error) {
    console.error("Erreur récupération événements populaires :", error);
    res.status(500).json({ message: `❌ Erreur serveur : ${error.message}` });
  }
};
export const getDernieresInscriptions = async (req, res) => {
  try {
    const inscription = await Inscription.find()
      .populate("utilisateurId", "name email")
      .populate("evenementId", "title dateDebut")
      .sort({ dateInscription: -1 })
      .limit(5);
    res.status(200).json({ inscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getDerniersPaiements = async (req, res) => {
  try {
    const paiements = await Payment.find()
      .populate("utilisateurId", "name email")
      .populate("evenementId", "titre dateDebut")
      .sort({ datePaiement: -1 }) // trie par date du paiement
      .limit(5);

    res.status(200).json({ paiements });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors du chargement des paiements" });
  }
};

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
  const { email, name, role } = req.body;

  try {
    // 1. Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires.",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé.",
      });
    }

    // 3. Generate strong password
    const plainPassword = generateStrongPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 4. Generate verification code
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 5. Create user
    const user = new User({
      email,
      name,
      role,
      password: hashedPassword,
      verificationToken,
      verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    await user.save();

    // 6. Send email with password and verification code
    await sendGestionnaireVerificationEmail(
      email,
      name,
      verificationToken,
      plainPassword
    );

    // 7. Respond without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(201).json({
      success: true,
      message: "Compte créé ! Vérifiez votre email.",
      data: userWithoutPassword,
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
  const { name, email, password, role, etatCompte } = req.body;
  const { id } = req.params; // 👈 récupère l'id correctement depuis l'URL
  const currentUserId = req.user._id; // 👈 ID de l'utilisateur connecté (assuré par middleware d'authentification)

  try {
    // Step 1: Find the user by their ID
    const user = await User.findById(id); // 👈 utilise l'id récupéré
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé.",
      });
    }

    // Step 2: Prevent the user from suspending their own account
    if (etatCompte && id === currentUserId && etatCompte === "suspendu") {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas suspendre votre propre compte.",
      });
    }

    // Step 3: Validate the fields
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé.",
        });
      }
      user.email = email;
    }

    // Step 4: Validate etatCompte
    if (etatCompte && !["actif", "inactif", "suspendu"].includes(etatCompte)) {
      return res.status(400).json({
        success: false,
        message:
          "Valeur invalide pour etatCompte. Choisissez parmi 'actif', 'inactif' ou 'suspendu'.",
      });
    }
    if (etatCompte) user.etatCompte = etatCompte;

    // Step 5: Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Step 6: Update other fields
    if (name) user.name = name;
    if (role) user.role = role;

    // Step 7: Save
    await user.save();

    // Step 8: Send back updated user (without password)
    const { password: _, ...updatedUser } = user.toObject();
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
    console.error(
      "❌ Erreur lors de la suppression de l'utilisateur :",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur.",
    });
  }
};

// Controller to get users based on search query
export const getAllUsersSearch = async (req, res) => {
  try {
    const search = req.query.search || ""; // Default to empty string if no search term

    // Search for users by name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { name: new RegExp(search, "i") }, // Search by name
        { email: new RegExp(search, "i") }, // Search by email
      ],
    }).select("-password"); // Exclude password

    res.json(users); // Return the found users
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" }); // Handle server error
  }
};

export const getInscriptionsParMois = async (req, res) => {
  try {
    const stats = await Inscription.aggregate([
      {
        $match: {
          dateInscription: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$dateInscription",
            },
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          value: 1,
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Erreur dans getInscriptionsParMois:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};





