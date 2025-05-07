import Categorie from "../models/Categorie .js";
import slugify from "slugify";

export const createCategory = async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Category name is required" 
      });
    }

    // Check for existing category (case insensitive)
    const existingCategory = await Categorie.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists"
      });
    }

    // Validate parent category if provided
    let parentCategory = null;
    if (parent) {
      parentCategory = await Categorie.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found"
        });
      }
    }

    // Create new category
    const newCategory = new Categorie({
      name,
      description: description || "",
      parent: parent || null
    });

    await newCategory.save();

    // Update parent category if this is a subcategory
    if (parentCategory) {
      parentCategory.subcategories.push(newCategory._id);
      await parentCategory.save();
    }

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: newCategory
    });

  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    // Get all categories without filtering by parent
    const categories = await Categorie.find().populate("subcategories");
    res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving categories",
      error: error.message,
    });
  }
};

export const updatedCategories = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract only allowed fields
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.parent !== undefined) updates.parent = req.body.parent;

    const updated = await Categorie.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Catégorie introuvable" });
    }

    res.status(200).json({ message: "Catégorie mise à jour", updated });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};


export const deleteCategories = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category
    const category = await Categorie.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If it's a parent category, delete all its subcategories
    if (category.subcategories.length > 0) {
      await Categorie.deleteMany({ _id: { $in: category.subcategories } });
    }

    // If it has a parent, remove from parent's subcategories array
    if (category.parent) {
      const parentCategory = await Categorie.findById(category.parent);
      if (parentCategory) {
        parentCategory.subcategories = parentCategory.subcategories.filter(
          (subId) => subId.toString() !== id
        );
        await parentCategory.save();
      }
    }

    // Delete the category
    await Categorie.findByIdAndDelete(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};
