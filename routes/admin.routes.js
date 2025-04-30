import express from 'express';
import { 
  createUser, 
  deleteUser, 
  getAllUsers, 
  getAllUsersSearch, 
  getDernieresInscriptions, 
  getDerniersPaiements, 
  getEvenementsPopulaires, 
  getTotalEvents, 
  getTotalUsers, 
  totalInscriptions, 
  updateUser, 
} from '../Controllers/admin.controllers.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Total counts
router.get("/total-users", verifyToken, verifyRole("admin"), getTotalUsers);
router.get("/total-events", verifyToken, verifyRole("admin"), getTotalEvents);
router.get("/total-inscription", verifyToken, verifyRole("admin"), totalInscriptions);

// Popular events and recent inscriptions
router.get("/populaires", getEvenementsPopulaires);
router.get("/dernier-inscription", verifyToken, verifyRole("admin"), getDernieresInscriptions);
router.get("/dernier-payment", verifyToken, verifyRole("admin"), getDerniersPaiements);

// Users routes
router.get("/users", verifyToken, verifyRole("admin"), getAllUsers); // Consider pagination here
router.get("/users/search", verifyToken, verifyRole("admin"), getAllUsersSearch); // Search route

// User actions
router.post("/users/create", verifyToken, verifyRole("admin"), createUser);
router.put("/users/:id", verifyToken, verifyRole("admin"), updateUser);
router.delete("/users/:id", verifyToken, verifyRole("admin"), deleteUser);

// Events routes

export default router;
