const BaseService = require("./BaseService");
const SortieRepository = require("../repositories/SortieRepository");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { isNiveauCompatible } = require("../utils/roleScope");
const { withAdherent } = require("../utils/enrichAdherents");
const { sendSortieReminderEmail } = require("../utils/email");

function formatSortieLabel(sortie) {
  const date = sortie?.date_heure
    ? new Date(sortie.date_heure).toLocaleDateString("fr-FR")
    : "";
  return `${sortie?.site || sortie?.lieu || "Sortie"} du ${date}`;
}

class SortieService extends BaseService {
  constructor() {
    const repository = new SortieRepository();
    super(repository);
    this.sortieRepository = repository;
    this.inscriptionRepository = new InscriptionRepository();
  }

  async filterByNiveauForUser(sorties, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return sorties;
    return sorties.filter((s) =>
      isNiveauCompatible(adherent.niveau, s.niveau_requis),
    );
  }

  // Places réellement disponibles = nb_places - inscriptions Confirmée.
  // On retire le détail des inscriptions de la réponse : seul le compte
  // importe ici, pas les coordonnées des inscrits.
  attachCapacity(sortieInstance) {
    const plain = sortieInstance.toJSON ? sortieInstance.toJSON() : sortieInstance;
    const nb_inscrits = (plain.inscriptions || []).filter(
      (i) => i.statut === "Confirmée",
    ).length;
    delete plain.inscriptions;
    return {
      ...plain,
      nb_inscrits,
      places_disponibles: Math.max((plain.nb_places || 0) - nb_inscrits, 0),
    };
  }

  async getAll(user = null) {
    const sorties = await this.sortieRepository.findAllWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  async getUpcomingSorties(user = null) {
    const sorties =
      await this.sortieRepository.findUpcomingWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  // Adherent (identite-service) a quitté ce schéma : chaque inscription est
  // recomposée avec `.adherent` via identiteClient, dédupliqué par
  // num_adherent distinct.
  async getSortiesWithInscriptions(authHeader) {
    const sorties = await this.sortieRepository.findAllWithInscriptions();
    return await Promise.all(
      sorties.map(async (sortie) => {
        const plain = sortie.toJSON();
        plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });
        return plain;
      }),
    );
  }

  async getAvailablePlaces() {
    const sorties = await this.sortieRepository.findAllWithInscriptions();
    return sorties.map((sortie) => ({
      ...sortie.toJSON(),
      placesDisponibles:
        sortie.nb_places -
        (sortie.inscriptions?.filter((i) => i.statut === "Confirmée").length ||
          0),
    }));
  }

  // Contrat attendu par DashboardPage.jsx (carte "Sorties") : total,
  // planifiees, enCours, terminees, annulees sont lus tels quels (voir le
  // useMemo statsData, branche `typeof sortieStats.data === "object"`) — ne
  // pas retirer un de ces champs sans mettre à jour le frontend en même
  // temps, sous peine de voir resurgir le bug "stats à 0" déjà corrigé une
  // fois (planifiees/enCours manquaient initialement).
  async getSortieStats() {
    const sorties = await this.sortieRepository.findAll();
    const now = new Date();
    return {
      total: sorties.length,
      // Comptes par statut réel (Sortie.statut) — ce que le tableau de
      // bord affiche ("X planifiées • Y en cours • Z terminées").
      planifiees: sorties.filter((s) => s.statut === "Planifiée").length,
      enCours: sorties.filter((s) => s.statut === "En cours").length,
      terminees: sorties.filter((s) => s.statut === "Terminée").length,
      annulees: sorties.filter((s) => s.statut === "Annulée").length,
      // Comptes par date (conservés pour compatibilité éventuelle).
      aVenir: sorties.filter(
        (s) => new Date(s.date_heure) > now && s.statut !== "Annulée",
      ).length,
      passees: sorties.filter(
        (s) => new Date(s.date_heure) < now && s.statut !== "Annulée",
      ).length,
    };
  }

  // Détails d'une sortie avec ses inscriptions (adhérent recomposé par HTTP)
  async getSortieDetails(id, authHeader) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) return null;
    const plain = sortie.toJSON();
    plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });
    return plain;
  }

  // Pour le pointage : adhérent + "checker" (qui a pointé) recomposés par HTTP
  async getPointageBySortie(id_sortie, authHeader) {
    const sortie = await this.sortieRepository.findByIdWithPointage(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");

    const plain = sortie.toJSON();
    plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });

    const checkerCache = new Map();
    plain.inscriptions = await Promise.all(
      plain.inscriptions.map(async (inscription) => {
        if (inscription.presence_check_by) {
          if (!checkerCache.has(inscription.presence_check_by)) {
            checkerCache.set(
              inscription.presence_check_by,
              identiteClient.getUserBasicById(inscription.presence_check_by),
            );
          }
          inscription.checker = await checkerCache.get(inscription.presence_check_by);
        }
        return inscription;
      }),
    );

    plain.inscriptions.sort((a, b) => {
      const nomA = a.adherent?.nom || "";
      const nomB = b.adherent?.nom || "";
      return nomA.localeCompare(nomB);
    });

    return plain;
  }

  computePointageStats(sortie) {
    const inscriptions = sortie.inscriptions || [];
    return {
      total: inscriptions.length,
      present: inscriptions.filter((i) => i.presence && i.presence_checked)
        .length,
      absent: inscriptions.filter((i) => !i.presence && i.presence_checked)
        .length,
      notChecked: inscriptions.filter((i) => !i.presence_checked).length,
    };
  }

  async getById(id) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) return null;
    const capacity = this.attachCapacity(sortie);
    // attachCapacity retire `.inscriptions` : on ne recompose donc pas les
    // adhérents ici (non utilisés par le détail léger d'une sortie).
    return capacity;
  }

  async create(data) {
    return await this.sortieRepository.create(data);
  }

  // Une fois qu'une sortie a quitté le statut "Planifiée" (passage manuel à
  // "En cours"), ses informations (lieu, horaires, tarifs...) ne doivent
  // plus être modifiables : les adhérents se sont déjà inscrits/organisés
  // sur cette base. Seul le champ `statut` lui-même reste modifiable, pour
  // permettre la suite du cycle de vie (En cours -> Terminée / Annulée) —
  // même principe que PalanqueeService.assertPalanqueeModifiable et
  // AdhesionService.update (verrou une fois validé).
  assertSortieModifiable(sortie, data = {}) {
    if (sortie.statut === "Planifiée") return;
    const champsModifies = Object.keys(data).filter((key) => key !== "statut");
    if (champsModifies.length > 0) {
      throw new Error(
        'Cette sortie a quitté le statut "Planifiée" : seul son statut peut encore être modifié.',
      );
    }
  }

  async update(id, data) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    this.assertSortieModifiable(sortie, data);
    await sortie.update(data);
    return sortie;
  }

  async delete(id) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    if (sortie.statut !== "Planifiée") {
      throw new Error(
        'Cette sortie a quitté le statut "Planifiée" : suppression impossible.',
      );
    }
    await sortie.destroy();
    return true;
  }

  // Le pointage n'a de sens que tant que la sortie est encore au stade
  // "Planifiée" : une fois "En cours", "Terminée" ou "Annulée" (changement
  // manuel de statut par le président/moniteur), il ne doit plus être
  // possible de pointer, modifier ou annuler un pointage — même principe que
  // PalanqueeService.assertPalanqueeModifiable et le garde-fou déjà en place
  // sur les inscriptions (InscriptionService.createInscription).
  assertSortiePlanifiee(sortie) {
    if (sortie.statut !== "Planifiée") {
      throw new Error(
        "Le pointage n'est possible que pour une sortie encore planifiée",
      );
    }
  }

  async enregistrerPointage(id_sortie, inscriptions, userId, authHeader) {
    const sortie = await this.sortieRepository.findById(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");
    this.assertSortiePlanifiee(sortie);

    const dateSortie = new Date(sortie.date_heure);
    const today = new Date();
    dateSortie.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (dateSortie > today)
      throw new Error("Impossible de pointer une sortie future");

    const results = [];
    for (const insc of inscriptions) {
      const inscription = await this.inscriptionRepository.findById(insc.id);
      if (!inscription) continue;
      // Seules les inscriptions "Confirmée" de CETTE sortie sont pointables
      // — une inscription "Annulée"/"En attente"/"Liste d'attente", ou
      // rattachée à une autre sortie, ne doit jamais pouvoir être marquée
      // présente/absente (le frontend ne les propose plus non plus, voir
      // SortiePointage.jsx, mais l'API doit refuser même appelée
      // directement).
      if (inscription.id_sortie !== id_sortie || inscription.statut !== "Confirmée") {
        continue;
      }

      // Un inscrit qui n'a pas commencé à régler le tarif de la sortie ne
      // peut pas être pointé présent : le paiement doit avoir débuté avant
      // que la sortie ne débute pour lui. Il reste possible de le pointer
      // absent, ou de l'exclure du groupe (cancelInscription) si rien n'a
      // été réglé du tout.
      if (
        insc.presence &&
        Number(inscription.montant_du) > 0 &&
        Number(inscription.montant_paye || 0) <= 0
      ) {
        const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
        const nom = adherent
          ? `${adherent.prenom} ${adherent.nom}`
          : `l'inscrit #${inscription.num_adherent}`;
        throw new Error(
          `Impossible de pointer ${nom} présent : aucun paiement n'a encore été enregistré pour cette sortie.`,
        );
      }

      const updated = await this.inscriptionRepository.update(insc.id, {
        presence: insc.presence,
        presence_checked: true,
        presence_check_time: new Date(),
        presence_check_by: userId,
        absence_reason: insc.absence_reason || null,
        absence_justified: insc.absence_justified || false,
      });
      results.push(updated);

      // Constitution automatique des palanquées : dès qu'un membre est
      // pointé présent, on le rattache à une palanquée ouverte de cette
      // sortie (ou on en crée une) — best-effort, ne doit jamais faire
      // échouer le pointage lui-même.
      if (insc.presence) {
        try {
          const PalanqueeService = require("./PalanqueeService");
          await new PalanqueeService().autoConstituerPourPresence(
            id_sortie,
            inscription.num_adherent,
            userId,
            authHeader,
          );
        } catch (error) {
          console.error(
            `Erreur constitution auto palanquée (inscription ${insc.id}):`,
            error.message,
          );
        }
      }
    }
    return results;
  }

  async modifierPointage(id_inscription, data, userId) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    const sortie = await this.sortieRepository.findById(inscription.id_sortie);
    if (sortie) this.assertSortiePlanifiee(sortie);
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    if (
      data.presence &&
      Number(inscription.montant_du) > 0 &&
      Number(inscription.montant_paye || 0) <= 0
    ) {
      throw new Error(
        "Impossible de marquer cet inscrit présent : aucun paiement n'a encore été enregistré pour cette sortie.",
      );
    }
    return await this.inscriptionRepository.update(id_inscription, {
      presence: data.presence,
      absence_reason: data.absence_reason || null,
      absence_justified: data.absence_justified || false,
      presence_check_by: userId,
      presence_check_time: new Date(),
    });
  }

  async annulerPointage(id_inscription, _userId) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    const sortie = await this.sortieRepository.findById(inscription.id_sortie);
    if (sortie) this.assertSortiePlanifiee(sortie);
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    return await this.inscriptionRepository.update(id_inscription, {
      presence_checked: false,
      presence: false,
      presence_check_time: null,
      presence_check_by: null,
      absence_reason: null,
      absence_justified: false,
    });
  }

  async validateSortieData(data) {
    const errors = [];
    if (!data.type)
      errors.push({ field: "type", message: "Le type est requis" });
    if (!data.lieu)
      errors.push({ field: "lieu", message: "Le lieu est requis" });
    if (!data.site)
      errors.push({ field: "site", message: "Le site est requis" });
    if (!data.date_heure)
      errors.push({ field: "date_heure", message: "La date est requise" });
    if (!data.nb_places || data.nb_places < 1)
      errors.push({
        field: "nb_places",
        message: "Le nombre de places doit être supérieur à 0",
      });
    // RG4 : 12 plongeurs max par sortie (réglementation) — revalidé
    // côté serveur, la contrainte du champ côté frontend n'empêche pas un
    // appel API direct.
    else if (data.nb_places > 12)
      errors.push({
        field: "nb_places",
        message: "Le nombre de places ne peut pas dépasser 12 (réglementation)",
      });

    const hasLat =
      data.latitude !== undefined && data.latitude !== null && data.latitude !== "";
    const hasLng =
      data.longitude !== undefined && data.longitude !== null && data.longitude !== "";
    if (hasLat !== hasLng) {
      errors.push({
        field: "latitude",
        message: "La latitude et la longitude doivent être renseignées ensemble",
      });
    } else if (hasLat && hasLng) {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90)
        errors.push({
          field: "latitude",
          message: "Latitude invalide (doit être comprise entre -90 et 90)",
        });
      if (Number.isNaN(lng) || lng < -180 || lng > 180)
        errors.push({
          field: "longitude",
          message: "Longitude invalide (doit être comprise entre -180 et 180)",
        });
    }

    return errors;
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici pour que activites-service reste seul propriétaire de ses données ;
  // exposé via `GET /sorties/trend` pour que le dashboard (qui vit encore
  // dans le monolithe) puisse le récupérer par HTTP au lieu d'une requête
  // Sequelize directe sur un modèle qui ne lui appartient plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.sortieRepository.countInPeriod("date_heure", startOfThisMonth, now),
      this.sortieRepository.countInPeriod("date_heure", startOfLastMonth, endOfLastPeriod),
    ]);

    let percent;
    if (previous === 0) {
      percent = current === 0 ? 0 : 100;
    } else {
      percent = ((current - previous) / previous) * 100;
    }
    const rounded = Math.round(percent);
    return {
      current,
      previous,
      trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
      trendUp: rounded >= 0,
    };
  }

  // Taux de remplissage moyen des sorties (CDC 3.6.2) : places prises
  // (inscriptions Confirmée) rapportées aux places offertes, pondéré par le
  // nombre de places de chaque sortie plutôt qu'une moyenne simple par
  // sortie (une petite sortie complète ne doit pas peser autant qu'une
  // grande sortie à moitié pleine). Les sorties annulées ou sans place
  // définie n'entrent pas dans le calcul.
  async getTauxRemplissage() {
    const sorties = await this.sortieRepository.findAllWithInscriptionCounts();
    const pertinentes = sorties
      .map((s) => this.attachCapacity(s))
      .filter((s) => s.statut !== "Annulée" && s.nb_places > 0);

    if (pertinentes.length === 0) return 0;

    const totalPlaces = pertinentes.reduce((sum, s) => sum + s.nb_places, 0);
    const totalInscrits = pertinentes.reduce((sum, s) => sum + s.nb_inscrits, 0);

    return totalPlaces > 0 ? Math.round((totalInscrits / totalPlaces) * 100) : 0;
  }

  // Rappel 24h avant sortie (CDC 3.2.2), envoyé aux inscrits Confirmée des
  // sorties du lendemain. Appelé par un cron (voir app.js) — best-effort,
  // un email en échec n'interrompt pas les autres.
  async envoyerRappels(authHeader) {
    const sorties = await this.sortieRepository.findDemainAvecInscriptions();
    let envoyes = 0;

    for (const sortie of sorties) {
      const confirmees = (sortie.inscriptions || []).filter((i) => i.statut === "Confirmée");
      for (const inscription of confirmees) {
        try {
          const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
          if (!adherent?.email) continue;
          await sendSortieReminderEmail({
            to: adherent.email,
            adherentName: `${adherent.prenom} ${adherent.nom}`,
            sortieLabel: formatSortieLabel(sortie),
            id_sortie: sortie.id_sortie,
          });
          envoyes += 1;
        } catch (error) {
          console.error(`Erreur rappel sortie (inscription ${inscription.id_inscription}):`, error.message);
        }
      }
    }
    return envoyes;
  }
}

module.exports = SortieService;
