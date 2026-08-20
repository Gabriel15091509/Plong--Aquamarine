const BaseService = require('./BaseService');
const PalanqueeRepository = require('../repositories/PalanqueeRepository');
const {
  Composer,
  Plongee,
  Sortie,
} = require('../models');
const identiteClient = require('../utils/serviceClients/identiteClient');
const materielClient = require('../utils/serviceClients/materielClient');
const { isStaff } = require('../utils/roleScope');
const { withAdherent, withMoniteurEncadrant } = require('../utils/enrichAdherents');

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Fait le lien entre le niveau requis d'une sortie et la spécialité
// d'encadrement que doit posséder le moniteur (voir Moniteur.specialites,
// alimenté depuis SPECIALITE_ENCADREMENT_OPTIONS côté frontend). Niveau 4 et
// Moniteur n'ont pas de spécialité d'encadrement dédiée : tout moniteur
// enregistré (niveau minimum Niveau 4) est réputé apte à les encadrer.
const SPECIALITE_ENCADREMENT_PAR_NIVEAU = {
  'Baptême': 'Encadrant baptême',
  'Niveau 1': 'Encadrant N1',
  'Niveau 2': 'Encadrant N2',
  'Niveau 3': 'Encadrant N3',
};

class PalanqueeService extends BaseService {
  constructor() {
    const repository = new PalanqueeRepository();
    super(repository);
    this.palanqueeRepository = repository;
  }

  // Adherent (identite-service) a quitté ce schéma : chaque membre
  // (`.composers[]`) est recomposé avec `.adherent` via identiteClient.
  async enrichComposers(palanquees, authHeader) {
    const isArray = Array.isArray(palanquees);
    const list = isArray ? palanquees : [palanquees].filter(Boolean);
    const plains = await Promise.all(
      list.map(async (p) => {
        const plain = p.toJSON ? p.toJSON() : p;
        if (plain.composers?.length) {
          plain.composers = await withAdherent(plain.composers, { authHeader });
        }
        return plain;
      }),
    );
    return isArray ? plains : plains[0];
  }

  async getAll(user = null, authHeader = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const results = adherent
      ? await this.palanqueeRepository.findByAdherent(adherent.num_adherent)
      : await this.palanqueeRepository.findAllDetailed();
    return await this.enrichComposers(results, authHeader);
  }

  async getById(id, user = null, authHeader = null) {
    const palanquee = await this.palanqueeRepository.findByIdDetailed(id);
    if (!palanquee) return palanquee;
    await this.assertCanAccessPalanquee(palanquee, user);
    return await this.enrichComposers(palanquee, authHeader);
  }

  async assertCanAccessPalanquee(palanquee, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return;
    const membres = palanquee.composers || [];
    const estMembre = membres.some((c) => c.num_adherent === adherent.num_adherent);
    if (!estMembre) throw new Error('Accès refusé à cette palanquée');
  }

  async getByPlongee(id_plongee, user = null, authHeader = null) {
    const results = await this.palanqueeRepository.findByPlongee(id_plongee);
    const filtered = await this.filterForAdherent(results, user);
    return await this.enrichComposers(filtered, authHeader);
  }

  // Un adhérent n'obtient ici que la ou les palanquées dont il est membre
  // (filterForAdherent) — c'est ce qui permet à SortieDetails.jsx de lui
  // afficher "sa" palanquée en lecture seule sans construire d'endpoint
  // dédié. Le staff (adherent = null) reçoit toutes les palanquées de la
  // sortie, sans filtre, comme avant (utilisé par PalanqueesManager).
  // moniteur_encadrant résolu pour les deux publics : utile au staff (qui
  // le voit déjà via le sélecteur d'affectation, mais pas nommé) comme à
  // l'adhérent (qui n'a par ailleurs aucun accès à la liste des moniteurs).
  async getBySortie(id_sortie, user = null, authHeader = null) {
    const results = await this.palanqueeRepository.findBySortie(id_sortie);
    const filtered = await this.filterForAdherent(results, user);
    const enriched = await this.enrichComposers(filtered, authHeader);
    return await withMoniteurEncadrant(enriched);
  }

  async getByMoniteur(id_moniteur, authHeader = null) {
    const results = await this.palanqueeRepository.findByMoniteur(id_moniteur);
    return await this.enrichComposers(results, authHeader);
  }

  async filterForAdherent(results, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return results;
    return results.filter((p) =>
      (p.composers || []).some((c) => c.num_adherent === adherent.num_adherent),
    );
  }

  assertStaff(user) {
    if (!isStaff(user?.role)) {
      throw new Error('Seul un moniteur ou le président peut gérer les palanquées');
    }
  }

  // Avant d'affecter un moniteur à l'encadrement d'une palanquée : vérifie
  // qu'il existe réellement (identite-service), que sa spécialité
  // d'encadrement couvre le niveau requis de la sortie, qu'il a déclaré être
  // disponible ce jour-là, et qu'il n'encadre pas déjà une autre sortie au
  // même horaire — évite d'affecter un moniteur à deux endroits à la fois.
  async assertMoniteurAffectable(id_moniteur, sortie, authHeader, excludePalanqueeId = null) {
    const moniteur = await identiteClient.getMoniteurById(id_moniteur, authHeader);
    if (!moniteur) throw new Error('Moniteur introuvable');

    const specialiteRequise = SPECIALITE_ENCADREMENT_PAR_NIVEAU[sortie.niveau_requis];
    if (specialiteRequise && !(moniteur.specialites || []).includes(specialiteRequise)) {
      throw new Error(
        `Ce moniteur n'a pas la spécialité d'encadrement requise pour ce niveau (requis : ${specialiteRequise})`,
      );
    }

    const jour = JOURS_SEMAINE[new Date(sortie.date_heure).getDay()];
    const disponibilites = moniteur.disponibilites || [];
    if (disponibilites.length > 0 && !disponibilites.some((d) => d.toLowerCase().includes(jour))) {
      throw new Error(`Ce moniteur n'a pas déclaré être disponible le ${jour}`);
    }

    // Toutes les palanquées d'une même sortie plongent au même horaire (une
    // seule date_heure par Sortie) : un moniteur ne peut donc physiquement
    // encadrer qu'une seule palanquée à la fois, que ce soit au sein de cette
    // sortie (deux groupes simultanés) ou d'une autre sortie au même horaire.
    const autresPalanquees = await this.palanqueeRepository.findByMoniteur(id_moniteur);
    for (const autre of autresPalanquees) {
      if (excludePalanqueeId && autre.id_palanquee === excludePalanqueeId) continue;
      const autreSortie =
        autre.id_sortie === sortie.id_sortie ? sortie : await Sortie.findByPk(autre.id_sortie);
      if (autreSortie && new Date(autreSortie.date_heure).getTime() === new Date(sortie.date_heure).getTime()) {
        throw new Error("Ce moniteur encadre déjà une autre palanquée à cette date et heure");
      }
    }
  }

  async create(data, user = null, authHeader = null) {
    this.assertStaff(user);
    if (!data.id_sortie) throw new Error('La sortie est requise');
    if (!data.nom_palanquee) throw new Error('Le nom de la palanquée est requis');

    if (data.id_moniteur_encadrant) {
      const sortie = await Sortie.findByPk(data.id_sortie);
      if (!sortie) throw new Error('Sortie introuvable');
      await this.assertMoniteurAffectable(data.id_moniteur_encadrant, sortie, authHeader);
    }

    return await this.palanqueeRepository.create({
      id_sortie: data.id_sortie,
      id_plongee: data.id_plongee || null,
      nom_palanquee: data.nom_palanquee,
      id_moniteur_encadrant: data.id_moniteur_encadrant || null,
    });
  }

  // Constitution automatique (CDC) : dès qu'un membre est pointé présent
  // pour une sortie (voir SortieService.enregistrerPointage), on le rattache
  // à une palanquée déjà ouverte de cette sortie qui a de la place pour son
  // niveau (remplies dans leur ordre de création), ou on en crée une
  // nouvelle si aucune n'a de place — remplace la constitution manuelle
  // préalable, sans l'empêcher (le staff peut toujours pré-créer des
  // palanquées via PalanqueesManager, elles seront remplies en priorité).
  // Best-effort : appelée depuis enregistrerPointage sans faire échouer le
  // pointage lui-même en cas d'erreur.
  async autoConstituerPourPresence(id_sortie, num_adherent, userId, authHeader) {
    const palanquees = await this.palanqueeRepository.findBySortie(id_sortie);

    const dejaAffecte = palanquees.some((p) =>
      (p.composers || []).some((c) => c.num_adherent === num_adherent),
    );
    if (dejaAffecte) return null;

    const nouvelAdherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!nouvelAdherent) return null;

    let idPalanqueeAssignee = null;

    for (const palanquee of palanquees) {
      if (palanquee.statut === 'Terminée') continue;

      // niveau_au_moment (snapshot pris à l'ajout de chaque membre) préféré
      // au niveau actuel de l'adhérent : une palanquée en cours de
      // constitution doit rester jugée sur les niveaux qu'elle a
      // réellement à ce moment, pas sur un niveau qui aurait changé entre
      // temps pour un membre déjà affecté. Fallback sur .adherent?.niveau
      // pour les lignes créées avant ce champ (composers non re-remplis).
      const composersAvecAdherent = await withAdherent(palanquee.composers || [], { authHeader });
      const niveaux = composersAvecAdherent.map((c) => c.niveau_au_moment || c.adherent?.niveau);
      const maxRatio = this.computeMaxRatio([...niveaux, nouvelAdherent.niveau]);

      if ((palanquee.composers || []).length < maxRatio) {
        await Composer.create({
          id_palanquee: palanquee.id_palanquee,
          num_adherent,
          niveau_au_moment: nouvelAdherent.niveau,
        });
        idPalanqueeAssignee = palanquee.id_palanquee;
        break;
      }
    }

    if (!idPalanqueeAssignee) {
      const moniteur = await identiteClient.getMoniteurByUserId(userId);
      const nouvellePalanquee = await this.palanqueeRepository.create({
        id_sortie,
        nom_palanquee: `Palanquée ${palanquees.length + 1}`,
        id_moniteur_encadrant: moniteur?.id_moniteur || null,
      });
      await Composer.create({
        id_palanquee: nouvellePalanquee.id_palanquee,
        num_adherent,
        niveau_au_moment: nouvelAdherent.niveau,
      });
      idPalanqueeAssignee = nouvellePalanquee.id_palanquee;
    }

    await this.creerPlongeeBrouillon(id_sortie, idPalanqueeAssignee, num_adherent);

    return idPalanqueeAssignee;
  }

  // Amorce le carnet de plongée du membre dès le pointage de présence : seuls
  // profondeur/durée (saisies via PalanqueeCard "Saisir les données" ->
  // enregistrerDonneesPlongee, qui met à jour CE brouillon plutôt que d'en
  // créer un second grâce au même critère id_palanquee+num_adherent) et la
  // validation (PlongeeService.validatePlongee) restent à la charge du
  // moniteur. Idempotent par (id_sortie, num_adherent) — un re-pointage ne
  // duplique pas le brouillon.
  async creerPlongeeBrouillon(id_sortie, id_palanquee, num_adherent) {
    const existante = await Plongee.findOne({ where: { id_sortie, num_adherent } });
    if (existante) return existante;

    const sortie = await Sortie.findByPk(id_sortie);
    if (!sortie) return null;

    return await Plongee.create({
      num_adherent,
      id_sortie,
      id_palanquee,
      date: sortie.date_heure,
      type_plongee: sortie.type,
    });
  }

  // Calcule le nombre max de plongeurs pour un groupe encadré par 1 seul
  // encadrant, d'après le Code du Sport (Manuel de Formation Technique
  // FFESSM, annexes III-16a « Baptême : effectif maximal 1 » et III-16b
  // « plongée encadrée en exploration : effectif maximal 4 », valable de
  // PE-12 à PE-60 — AUCUNE zone/niveau n'autorise 6 plongeurs pour un seul
  // encadrant, contrairement à l'ancienne règle ici ("1/4 ou 1/6"), qui
  // n'avait pas de base réglementaire réelle pour le palier à 6.
  // Volontairement pas de gestion du 5e plongeur exceptionnel autorisé par
  // les annexes (uniquement si lui-même Guide de Palanquée/Niveau 4) : ça
  // demanderait de savoir lequel des membres joue ce rôle, non modélisé
  // ici — cap simple et sûr à 4 dans ce cas plutôt qu'une exception non
  // vérifiée.
  computeMaxRatio(niveaux) {
    if (niveaux.includes('Baptême')) return 1;
    return 4;
  }

  async assertPalanqueeModifiable(palanquee) {
    if (palanquee.statut === 'Terminée') {
      throw new Error('Cette palanquée est clôturée, elle ne peut plus être modifiée');
    }
  }

  async addMembre(id_palanquee, num_adherent, user = null, authHeader = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const dejaMembre = (palanquee.composers || []).some(
      (c) => c.num_adherent === num_adherent,
    );
    if (dejaMembre) throw new Error('Cet adhérent est déjà membre de la palanquée');

    const nouvelAdherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!nouvelAdherent) throw new Error('Adhérent non trouvé');

    // Adherent (identite-service) a quitté ce schéma : niveaux des membres
    // déjà affectés recomposés via identiteClient pour l'enrichissement
    // d'affichage, mais le ratio se calcule sur niveau_au_moment (snapshot
    // pris à l'ajout de chacun) — voir le commentaire équivalent dans
    // autoConstituerPourPresence.
    const composersAvecAdherent = await withAdherent(palanquee.composers || [], { authHeader });
    const niveauxActuels = composersAvecAdherent.map((c) => c.niveau_au_moment || c.adherent?.niveau);
    const maxRatio = this.computeMaxRatio([...niveauxActuels, nouvelAdherent.niveau]);
    if ((palanquee.composers || []).length + 1 > maxRatio) {
      throw new Error(
        `Ratio encadrant/plongeur dépassé : maximum ${maxRatio} plongeurs pour cette composition de niveaux`,
      );
    }

    return await Composer.create({
      id_palanquee,
      num_adherent,
      niveau_au_moment: nouvelAdherent.niveau,
    });
  }

  async removeMembre(id_palanquee, num_adherent, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const composition = await Composer.findOne({ where: { id_palanquee, num_adherent } });
    if (!composition) throw new Error('Composition non trouvée');
    await composition.destroy();

    if (palanquee.id_guide_palanquee === num_adherent) {
      palanquee.id_guide_palanquee = null;
      await palanquee.save();
    }
    if (palanquee.id_secouriste === num_adherent) {
      palanquee.id_secouriste = null;
      await palanquee.save();
    }

    return true;
  }

  async updateEncadrement(id_palanquee, { id_guide_palanquee, id_secouriste, id_moniteur_encadrant }, user = null, authHeader = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const membreIds = (palanquee.composers || []).map((c) => c.num_adherent);
    if (id_guide_palanquee && !membreIds.includes(id_guide_palanquee)) {
      throw new Error('Le guide de palanquée doit être un membre de la palanquée');
    }
    if (id_secouriste && !membreIds.includes(id_secouriste)) {
      throw new Error('Le secouriste doit être un membre de la palanquée');
    }

    if (id_moniteur_encadrant && id_moniteur_encadrant !== palanquee.id_moniteur_encadrant) {
      const sortie = await Sortie.findByPk(palanquee.id_sortie);
      if (!sortie) throw new Error('Sortie associée introuvable');
      await this.assertMoniteurAffectable(id_moniteur_encadrant, sortie, authHeader, id_palanquee);
    }

    // Les 3 champs sont indépendants et modifiables séparément (le frontend
    // n'envoie que celui qu'il modifie) : un champ absent du body (undefined)
    // laisse la valeur actuelle inchangée, plutôt que d'être écrasé à null.
    if (id_guide_palanquee !== undefined) {
      palanquee.id_guide_palanquee = id_guide_palanquee || null;
    }
    if (id_secouriste !== undefined) {
      palanquee.id_secouriste = id_secouriste || null;
    }
    if (id_moniteur_encadrant !== undefined) {
      palanquee.id_moniteur_encadrant = id_moniteur_encadrant || null;
    }
    await palanquee.save();

    return palanquee;
  }

  // Étapes 3-4 : saisie des données de plongée + génération/màj du carnet
  // individuel de chaque membre de la palanquée (idempotent)
  async enregistrerDonneesPlongee(id_palanquee, data, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const membres = palanquee.composers || [];
    if (membres.length === 0) {
      throw new Error('Impossible de saisir des données pour une palanquée sans membre');
    }

    const sortie = await Sortie.findByPk(palanquee.id_sortie);
    if (!sortie) throw new Error('Sortie associée introuvable');

    // Un champ numérique optionnel laissé vide arrive comme "" (pas
    // null/undefined) depuis le formulaire : à distinguer explicitement,
    // sinon Postgres rejette "" pour une colonne INTEGER/FLOAT ("invalid
    // input syntax").
    const toNullableNumber = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const profondeurMax = toNullableNumber(data.profondeur_max_realisee);
    const dureeReelle = toNullableNumber(data.duree_reelle);

    palanquee.profondeur_max_realisee = profondeurMax ?? palanquee.profondeur_max_realisee;
    palanquee.duree_reelle = dureeReelle ?? palanquee.duree_reelle;
    await palanquee.save();

    const observationsParMembre = data.observationsParMembre || {};
    const communData = {
      date: data.date || sortie.date_heure,
      profondeur_max: profondeurMax,
      duree: dureeReelle,
      temperature_eau: toNullableNumber(data.temperature_eau),
      visibilite: data.visibilite || null,
      type_plongee: data.type_plongee || sortie.type,
      observations_faune: data.observations_faune || null,
    };

    const plongees = [];
    for (const composition of membres) {
      const existante = await Plongee.findOne({
        where: { id_palanquee, num_adherent: composition.num_adherent },
      });

      const observations_moniteur = observationsParMembre[composition.num_adherent] || null;

      if (existante) {
        await existante.update({ ...communData, observations_moniteur });
        plongees.push(existante);
      } else {
        const creee = await Plongee.create({
          ...communData,
          num_adherent: composition.num_adherent,
          id_sortie: palanquee.id_sortie,
          id_palanquee,
          observations_moniteur,
        });
        plongees.push(creee);
      }
    }

    return { palanquee, plongees };
  }

  // Étape 5 : retour du matériel attribué à la palanquée (création auto
  // d'une demande de réparation si détérioration signalée)
  async retournerMateriel(id_palanquee, retours = [], user = null, authHeader = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');

    const AttributionService = require('./AttributionService');
    const attributionService = new AttributionService();

    const resultats = [];
    for (const retour of retours) {
      const attribution = await attributionService.getById(retour.id_attribution);
      if (!attribution || attribution.id_palanquee !== id_palanquee) {
        throw new Error("Attribution introuvable pour cette palanquée");
      }

      const updated = await attributionService.retourner(retour.id_attribution, {
        etat_retour: retour.etat_retour,
        date_retour_reel: new Date(),
      });

      if (retour.constat_deterioration) {
        updated.constat_deterioration = retour.constat_deterioration;
        await updated.save();
      }

      if (['À réparer', 'Hors service'].includes(retour.etat_retour)) {
        await materielClient.createReparation({
          num_inventaire: attribution.num_inventaire,
          date_constat: new Date(),
          description_panne:
            retour.constat_deterioration || 'Détérioration signalée au retour de sortie',
          prestataire: 'À déterminer',
          cout: 0,
          statut: 'En cours',
        }, authHeader);
      }

      resultats.push(updated);
    }

    return resultats;
  }

  async cloturer(id_palanquee, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    if (palanquee.statut === 'Terminée') return palanquee;

    palanquee.statut = 'Terminée';
    palanquee.date_cloture = new Date();
    await palanquee.save();

    return palanquee;
  }

  async getStatsBySortie(id_sortie) {
    const palanquees = await this.palanqueeRepository.findBySortie(id_sortie);
    const total = palanquees.length;
    const totalPlongeurs = palanquees.reduce(
      (sum, p) => sum + (p.composers || []).length,
      0,
    );
    return {
      nb_palanquees: total,
      nb_plongeurs: totalPlongeurs,
      ratio_moyen: total > 0 ? Math.round((totalPlongeurs / total) * 10) / 10 : 0,
    };
  }

  async validatePalanqueeData(data) {
    const errors = [];

    if (!data.id_sortie) errors.push("La sortie est requise");
    if (!data.nom_palanquee) errors.push("Le nom de la palanquée est requis");

    return errors;
  }
}

module.exports = PalanqueeService;
