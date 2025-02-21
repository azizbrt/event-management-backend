import mongoose from "mongoose";
import slugify from "slugify";

const CategorieSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie", default: null },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Categorie" }],
  },
  { timestamps: true }
);

// Automatically generate a slug before saving
CategorieSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Categorie = mongoose.model("Categorie", CategorieSchema);
export default Categorie;
