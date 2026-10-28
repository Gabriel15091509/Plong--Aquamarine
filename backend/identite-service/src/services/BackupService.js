const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Backup = require("../models/Backup");
const { NotFoundError, ValidationError } = require("../utils/errors");
const logger = require("../utils/logger");

const TYPES_VALIDES = ["automatique", "manuel"];
// Nombre de sauvegardes AUTOMATIQUES conservées (les manuelles ne sont
// jamais purgées automatiquement, un président qui en déclenche une le
// fait volontairement) — borne la taille de backup.snapshots sur la base
// gratuite Render, sans plafond sur ce qui compte le plus pour l'usager.
const RETENTION_AUTOMATIQUES = 14;
// Schémas à ignorer lors d'un instantané : les catalogues internes
// Postgres, notre propre schéma de stockage (on ne se sauvegarde pas
// soi-même) et "public" (jamais utilisé par un service de ce dépôt, tous
// définissent leur propre schéma nommé — voir DB_SCHEMA dans chaque
// config/database.js).
const SCHEMAS_EXCLUS = ["information_schema", "backup", "public"];

// Sauvegarde/restauration "logique" (au niveau des lignes, via SQL, pas un
// export pg_dump binaire) de TOUTE la base partagée — un seul rôle
// Postgres (`plongee`, voir render.yaml) possède les schémas de tous les
// services, donc la connexion Sequelize d'identite-service peut lire/
// écrire n'importe quel schéma en le qualifiant explicitement
// ("schema"."table"), sans avoir besoin d'un accès réseau à part.
class BackupService {
  // Schémas applicatifs présents dans la base, dans l'ordre alphabétique —
  // découverte dynamique plutôt qu'une liste figée, pour ne jamais oublier
  // un nouveau schéma le jour où un service en ajoute un.
  async listerSchemas() {
    const rows = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN (:exclus) AND schema_name NOT LIKE 'pg_%'
       ORDER BY schema_name`,
      { replacements: { exclus: SCHEMAS_EXCLUS }, type: QueryTypes.SELECT },
    );
    return rows.map((r) => r.schema_name);
  }

  // Alias `t.` volontaire (pas juste un style) : Sequelize reconnaît EN DUR
  // le texte exact "SELECT table_name FROM information_schema.tables"
  // (c'est la requête qu'il génère lui-même pour son propre
  // queryInterface.showAllTables()) et réécrit alors chaque ligne en
  // Object.values(row) — un simple tableau de valeurs positionnelles, pas
  // un objet { table_name } — voir dialects/postgres/query.js
  // (isTableNameQuery). Confirmé en le prenant sur le fait contre une
  // vraie base locale : sans l'alias, r.table_name valait toujours
  // `undefined`. Préfixer la colonne suffit à sortir de cette
  // correspondance texte-à-texte sans changer le résultat logique.
  async listerTables(schema) {
    const rows = await sequelize.query(
      `SELECT t.table_name FROM information_schema.tables t
       WHERE t.table_schema = :schema AND t.table_type = 'BASE TABLE'
       ORDER BY t.table_name`,
      { replacements: { schema }, type: QueryTypes.SELECT },
    );
    return rows.map((r) => r.table_name);
  }

  // Colonne de clé primaire de chaque table d'un schéma (suppose une PK à
  // une seule colonne — vrai pour toutes les tables de ce dépôt) : sert à
  // recaler la séquence après restauration (voir restaurer() plus bas).
  async colonnesPrimaires(schema) {
    const rows = await sequelize.query(
      `SELECT tc.table_name AS table_name, kcu.column_name AS column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = :schema`,
      { replacements: { schema }, type: QueryTypes.SELECT },
    );
    const map = {};
    rows.forEach((r) => {
      if (!(r.table_name in map)) map[r.table_name] = r.column_name;
    });
    return map;
  }

  // Ordre topologique (parents avant enfants) des tables d'un schéma,
  // d'après ses clés étrangères — restaurer un enfant avant son parent
  // ferait échouer la contrainte de clé étrangère. Les FK inter-schémas
  // n'existent pas dans ce dépôt (chaque service ne référence que ses
  // propres tables ; les liens vers un autre service passent par HTTP,
  // jamais par une vraie FK Postgres — voir les nombreux commentaires
  // "a quitté ce schéma" dans les repositories), donc trier chaque schéma
  // indépendamment des autres suffit.
  async ordreTopologique(schema, tables) {
    const fks = await sequelize.query(
      `SELECT tc.table_name AS enfant, ccu.table_name AS parent
       FROM information_schema.table_constraints tc
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = :schema`,
      { replacements: { schema }, type: QueryTypes.SELECT },
    );

    const dependsOn = new Map(tables.map((t) => [t, new Set()]));
    fks.forEach(({ enfant, parent }) => {
      if (enfant !== parent && dependsOn.has(enfant) && dependsOn.has(parent)) {
        dependsOn.get(enfant).add(parent);
      }
    });

    const ordered = [];
    const visited = new Set();
    // `enCours` détecte un cycle (rare — une auto-référence type
    // arborescence) : on abandonne juste ce lien plutôt que de boucler
    // indéfiniment, au pire une table dépendante se retrouve avant son
    // parent dans ce cas précis.
    const visite = (table, enCours) => {
      if (visited.has(table) || enCours.has(table)) return;
      enCours.add(table);
      dependsOn.get(table).forEach((parent) => visite(parent, enCours));
      visited.add(table);
      ordered.push(table);
    };
    tables.forEach((t) => visite(t, new Set()));
    return ordered;
  }

  // Instantané complet : une ligne par table de chaque schéma applicatif,
  // regroupées en JSON et stockées comme UNE ligne de backup.snapshots.
  async creer(type) {
    if (!TYPES_VALIDES.includes(type)) {
      throw new ValidationError(`Type de sauvegarde invalide : ${type}`);
    }

    const schemas = await this.listerSchemas();
    const contenu = {};
    for (const schema of schemas) {
      const tables = await this.listerTables(schema);
      contenu[schema] = {};
      for (const table of tables) {
        contenu[schema][table] = await sequelize.query(
          `SELECT * FROM "${schema}"."${table}"`,
          { type: QueryTypes.SELECT },
        );
      }
    }

    const taille_octets = Buffer.byteLength(JSON.stringify(contenu));
    const snapshot = await Backup.create({ type, taille_octets, contenu });

    if (type === "automatique") await this._appliquerRetention();

    return {
      id: snapshot.id,
      created_at: snapshot.created_at,
      type: snapshot.type,
      taille_octets: snapshot.taille_octets,
    };
  }

  async _appliquerRetention() {
    const automatiques = await Backup.findAll({
      where: { type: "automatique" },
      order: [["created_at", "DESC"]],
      attributes: ["id"],
    });
    const aSupprimer = automatiques.slice(RETENTION_AUTOMATIQUES).map((b) => b.id);
    if (aSupprimer.length > 0) {
      await Backup.destroy({ where: { id: aSupprimer } });
      logger.info(
        `[identite-service] ${aSupprimer.length} sauvegarde(s) automatique(s) au-delà de la rétention (${RETENTION_AUTOMATIQUES}) supprimée(s)`,
      );
    }
  }

  // Métadonnées seules (jamais `contenu`, potentiellement plusieurs Mo) —
  // pour la page Paramètres.
  async lister() {
    return await Backup.findAll({
      attributes: ["id", "created_at", "type", "taille_octets"],
      order: [["created_at", "DESC"]],
    });
  }

  async recuperer(id) {
    const snapshot = await Backup.findByPk(id);
    if (!snapshot) throw new NotFoundError("Sauvegarde introuvable");
    return snapshot;
  }

  async supprimer(id) {
    const nb = await Backup.destroy({ where: { id } });
    if (nb === 0) throw new NotFoundError("Sauvegarde introuvable");
  }

  // Remplace le contenu de TOUTES les tables de TOUS les schémas présents
  // dans l'instantané par celui qu'il contient — irréversible (sauf à
  // restaurer une sauvegarde plus récente ensuite). Toute l'opération vit
  // dans une seule transaction : un échec en cours de route annule tout
  // plutôt que de laisser la base à moitié restaurée.
  async restaurer(id) {
    const snapshot = await this.recuperer(id);
    const { contenu } = snapshot;

    await sequelize.transaction(async (transaction) => {
      for (const schema of Object.keys(contenu)) {
        const tables = Object.keys(contenu[schema]);
        if (tables.length === 0) continue;

        const ordered = await this.ordreTopologique(schema, tables);
        const pkParTable = await this.colonnesPrimaires(schema);

        // Vidées en ordre INVERSE (enfants avant parents) — CASCADE par
        // précaution si une FK avait échappé au tri, l'ordre inverse
        // suffisant déjà normalement à éviter tout blocage.
        for (const table of [...ordered].reverse()) {
          await sequelize.query(`TRUNCATE TABLE "${schema}"."${table}" CASCADE`, {
            transaction,
          });
        }

        // Réinsérées en ordre topologique (parents avant enfants).
        for (const table of ordered) {
          const rows = contenu[schema][table];
          if (!rows || rows.length === 0) continue;

          await sequelize.getQueryInterface().bulkInsert(
            { schema, tableName: table },
            this._serialiserPourInsertion(rows),
            { transaction },
          );

          await this._recalerSequence(schema, table, pkParTable[table], transaction);
        }
      }
    });

    logger.warn(`[identite-service] Base restaurée depuis la sauvegarde ${id}`);
  }

  // `bulkInsert` échoue sur une valeur objet/tableau brute (colonne
  // JSON/JSONB) : sans description Sequelize des types de colonnes de la
  // table (on restaure ici des tables "génériques", sans modèle), son
  // échappement générique ne sait pas la sérialiser et lève "Invalid
  // value" — confirmé en le prenant sur le fait contre une vraie base.
  // `SELECT *` avait justement désérialisé ces colonnes en objets/tableaux
  // JS au moment de la sauvegarde (voir creer()) ; il suffit de les
  // repasser en JSON.stringify côté écriture pour que l'échappement
  // générique les traite comme un texte ordinaire, ce que Postgres accepte
  // très bien pour une colonne JSON/JSONB.
  _serialiserPourInsertion(rows) {
    return rows.map((row) => {
      const serialisee = {};
      for (const [colonne, valeur] of Object.entries(row)) {
        serialisee[colonne] =
          valeur !== null && typeof valeur === "object" && !(valeur instanceof Date)
            ? JSON.stringify(valeur)
            : valeur;
      }
      return serialisee;
    });
  }

  // Recale la séquence de la clé primaire sur MAX(pk) — sans ça, le
  // prochain INSERT applicatif reprendrait l'ancien compteur (resté
  // inchangé par bulkInsert, qui écrit les valeurs explicites de
  // l'instantané) et entrerait en collision avec les lignes réinsérées.
  async _recalerSequence(schema, table, pkColumn, transaction) {
    if (!pkColumn) return;
    const [seqRow] = await sequelize.query(
      `SELECT pg_get_serial_sequence(:qualified, :pk) AS seq`,
      {
        replacements: { qualified: `${schema}.${table}`, pk: pkColumn },
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    // NULL si la PK n'est pas basée sur une séquence (ex. identifiant
    // texte) — rien à recaler dans ce cas.
    if (!seqRow?.seq) return;
    await sequelize.query(
      `SELECT setval('${seqRow.seq}', COALESCE((SELECT MAX("${pkColumn}") FROM "${schema}"."${table}"), 1), (SELECT MAX("${pkColumn}") FROM "${schema}"."${table}") IS NOT NULL)`,
      { transaction },
    );
  }
}

module.exports = BackupService;
