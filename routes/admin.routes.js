import express from 'express';
import { getDernieresInscriptions, getEvenementsPopulaires, getTotalEvents, getTotalUsers, totalInscriptions } from '../Controllers/admin.controllers.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
//total users count
router.get("/total-users",verifyToken, verifyRole("admin"),getTotalUsers)
//total events
router.get("/total-events",verifyToken, verifyRole("admin"),getTotalEvents)
//total inscription count
router.get("/total-inscription",verifyToken, verifyRole("admin"),totalInscriptions)
//les evenements populaires
router.get("/populaires",getEvenementsPopulaires)
//les dernier inscription
router.get("/dernier-inscription",verifyToken, verifyRole("admin"),getDernieresInscriptions)

export default router
