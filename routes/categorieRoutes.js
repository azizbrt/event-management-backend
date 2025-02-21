import express from "express";
import { createCategory, deleteCategories, getAllCategories, updatedCategories } from "../Controllers/categorieController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
const app = express();
//create a new categorie
app.post("/create", verifyToken, verifyRole(["admin"]),createCategory);
//get
app.get("/get",verifyToken, verifyRole(["admin"]),getAllCategories);
//deletze
app.delete("/delete/:id",verifyToken, verifyRole(["admin"]), deleteCategories);
//modifay
app.put("/modifier/:id", verifyToken, verifyRole(["admin"]),updatedCategories);
export default app;
