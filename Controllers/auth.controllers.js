import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hrs
        });

        await user.save();

        // Generate JWT & set cookie
        generateTokenAndSetCookie(res, user._id);

        // Convert to plain object & remove password
        const userData = user.toObject();
        delete userData.password;

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: userData,
        });

    } catch (error) {
        console.error("Signup Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const login = async (req, res) => { 
    res.send("Login route");
};
export const logout = async (req, res) => { 
    res.send("Logout route");
};
