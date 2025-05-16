import express from 'express';
import { getInscriptionsRecentes, getStatsGlobales, getStatsParEvenement } from '../Controllers/gestionnaire.controllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router= express.Router();

router.get("/globales",verifyToken, getStatsGlobales);
router.get("/inscriptions-par-evenement", verifyToken, getStatsParEvenement);
router.get("/recents", verifyToken, getInscriptionsRecentes);


export default router;