import Event from "../models/Event.js";
import Inscription from "../models/inscription.model.js";

// 📊 1. Statistiques globales du gestionnaire
export const getStatsGlobales = async (req, res) => {
  try {
    // On récupère l'id du gestionnaire connecté
    const organisateur = req.user.id;

    // On cherche tous ses événements
    const evenements = await Event.find({ organisateur })
      .select("_id dateDebut titre")
      .sort({ dateDebut: 1 });

    // On prend juste les IDs
    const evenementIds = evenements.map(ev => ev._id);

    // On récupère toutes les inscriptions à ses événements
    const inscriptions = await Inscription.find({
      evenementId: { $in: evenementIds }
    });

    // On compte tout
    const total = inscriptions.length;
    const valides = inscriptions.filter(i => i.status === "validée").length;
    const enAttente = inscriptions.filter(i => i.status === "en attente").length;

    // On cherche l’événement à venir (prochain dans le futur)
    const maintenant = new Date();
    const prochain = evenements.find(ev => new Date(ev.dateDebut) > maintenant);

    // On envoie les infos
    res.json({
      total,
      valides,
      enAttente,
      prochainEvenement: prochain
        ? { titre: prochain.titre, date: prochain.dateDebut }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
// 📈 2. Nombre d'inscriptions par événement
export const getStatsParEvenement = async (req, res) => {
  try {
    const organisateur = req.user.id;

    // On récupère ses événements
    const evenements = await Event.find({ organisateur }).select("_id titre");
    const evenementIds = evenements.map(ev => ev._id);

    // On groupe les inscriptions par événement et on les compte
    const aggregation = await Inscription.aggregate([
      { $match: { evenementId: { $in: evenementIds } } },
      { $group: { _id: "$evenementId", total: { $sum: 1 } } },
    ]);

    // On rajoute les titres pour rendre les stats lisibles
    const resultat = aggregation.map(stat => {
      const event = evenements.find(ev => ev._id.toString() === stat._id.toString());
      return {
        evenementId: stat._id,
        titre: event ? event.titre : "Inconnu",
        total: stat.total,
      };
    });

    res.json(resultat);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
// 🕒 3. Liste des 10 dernières inscriptions
export const getInscriptionsRecentes = async (req, res) => {
  try {
    const organisateur = req.user.id;

    // On récupère ses événements
    const evenements = await Event.find({ organisateur }).select("_id titre");
    const evenementIds = evenements.map(ev => ev._id);

    // On récupère les 10 dernières inscriptions
    const inscriptions = await Inscription.find({
      evenementId: { $in: evenementIds }
    })
      .sort({ createdAt: -1 }) // Les plus récentes d'abord
      .limit(10)
      .populate("utilisateurId", "name")     // optionnel : nom complet (backend)
      .populate("evenementId", "titre");     // pour avoir le titre de l’événement

    // On simplifie ce qu’on retourne
    const resultat = inscriptions.map(i => ({
      nom: i.utilisateurPublic.nomAffiché,
      email: i.utilisateurPublic.email,
      evenement: i.evenementId.titre,
      date: i.dateInscription,
      statut: i.status,
    }));

    res.json(resultat);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
