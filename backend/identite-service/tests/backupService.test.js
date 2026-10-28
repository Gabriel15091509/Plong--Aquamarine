const mockQuery = jest.fn();
const mockTransaction = jest.fn(async (callback) => callback({ __fakeTransaction: true }));
const mockBulkInsert = jest.fn();

jest.mock("../src/config/database", () => ({
  sequelize: {
    query: (...args) => mockQuery(...args),
    transaction: (...args) => mockTransaction(...args),
    getQueryInterface: () => ({ bulkInsert: (...args) => mockBulkInsert(...args) }),
  },
}));

jest.mock("../src/models/Backup", () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  destroy: jest.fn(),
}));

const BackupService = require("../src/services/BackupService");
const Backup = require("../src/models/Backup");

const service = new BackupService();

afterEach(() => {
  // Les deux sont nécessaires : restoreAllMocks() rend leur vraie
  // implémentation aux méthodes de l'instance spyées (_appliquerRetention,
  // ordreTopologique...) — mais ne touche pas l'historique d'appels des
  // jest.fn() "nus" du mock de module ci-dessus (Backup.create/findAll/...),
  // pour lesquels seul clearAllMocks() efface mock.calls d'un test à l'autre.
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// L'algorithme de tri lui-même : partie la plus facile à casser en
// silence (restaurer un enfant avant son parent ferait échouer la
// contrainte de clé étrangère), donc testée indépendamment du reste avec
// un graphe de dépendances contrôlé plutôt qu'une vraie base.
describe("BackupService.ordreTopologique", () => {
  test("place chaque parent avant ses enfants (chaîne a <- b <- c)", async () => {
    mockQuery.mockResolvedValueOnce([
      { enfant: "b", parent: "a" },
      { enfant: "c", parent: "b" },
    ]);

    const ordered = await service.ordreTopologique("activites", ["c", "a", "b"]);

    expect(ordered.indexOf("a")).toBeLessThan(ordered.indexOf("b"));
    expect(ordered.indexOf("b")).toBeLessThan(ordered.indexOf("c"));
    expect(ordered.sort()).toEqual(["a", "b", "c"]);
  });

  test("ignore une auto-référence (cycle) sans boucler indéfiniment", async () => {
    mockQuery.mockResolvedValueOnce([{ enfant: "arbre", parent: "arbre" }]);

    const ordered = await service.ordreTopologique("formation", ["arbre"]);

    expect(ordered).toEqual(["arbre"]);
  });

  test("une table sans clé étrangère garde sa place, les autres restent triées", async () => {
    mockQuery.mockResolvedValueOnce([{ enfant: "b", parent: "a" }]);

    const ordered = await service.ordreTopologique("materiel", ["a", "b", "isole"]);

    expect(ordered).toHaveLength(3);
    expect(ordered.indexOf("a")).toBeLessThan(ordered.indexOf("b"));
  });
});

describe("BackupService.creer", () => {
  test("assemble un instantané à partir des schémas/tables découverts et l'enregistre", async () => {
    jest.spyOn(service, "listerSchemas").mockResolvedValue(["activites"]);
    jest.spyOn(service, "listerTables").mockResolvedValue(["sorties"]);
    mockQuery.mockResolvedValueOnce([{ id_sortie: 1 }, { id_sortie: 2 }]);
    Backup.create.mockResolvedValue({
      id: 42,
      created_at: "2026-09-01T00:00:00.000Z",
      type: "manuel",
      taille_octets: 123,
    });

    const result = await service.creer("manuel");

    expect(Backup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "manuel",
        contenu: { activites: { sorties: [{ id_sortie: 1 }, { id_sortie: 2 }] } },
      }),
    );
    expect(result).toEqual({
      id: 42,
      created_at: "2026-09-01T00:00:00.000Z",
      type: "manuel",
      taille_octets: 123,
    });
  });

  test("rejette un type inconnu sans toucher à la base", async () => {
    await expect(service.creer("hebdomadaire")).rejects.toThrow(/invalide/);
    expect(Backup.create).not.toHaveBeenCalled();
  });

  test("applique la rétention seulement pour une sauvegarde automatique", async () => {
    jest.spyOn(service, "listerSchemas").mockResolvedValue([]);
    Backup.create.mockResolvedValue({ id: 1, created_at: new Date(), type: "manuel", taille_octets: 0 });
    const retention = jest.spyOn(service, "_appliquerRetention").mockResolvedValue();

    await service.creer("manuel");
    expect(retention).not.toHaveBeenCalled();

    Backup.create.mockResolvedValue({ id: 2, created_at: new Date(), type: "automatique", taille_octets: 0 });
    await service.creer("automatique");
    expect(retention).toHaveBeenCalledTimes(1);
  });
});

describe("BackupService._appliquerRetention", () => {
  test("ne supprime que les sauvegardes automatiques au-delà de la limite conservée", async () => {
    const automatiques = Array.from({ length: 16 }, (_, i) => ({ id: i + 1 }));
    Backup.findAll.mockResolvedValue(automatiques);

    await service._appliquerRetention();

    expect(Backup.destroy).toHaveBeenCalledWith({
      where: { id: automatiques.slice(14).map((b) => b.id) },
    });
  });

  test("ne supprime rien si sous la limite", async () => {
    Backup.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await service._appliquerRetention();

    expect(Backup.destroy).not.toHaveBeenCalled();
  });
});

// Bug réel rencontré en le testant contre un vrai Postgres local (pas
// détecté par les tests mockés ci-dessus) : bulkInsert échoue avec
// "Invalid value" sur une colonne JSON/JSONB tant que sa valeur reste un
// objet/tableau JS brut — sans description de type de colonne (on
// restaure des tables génériques, sans modèle Sequelize), son échappement
// générique ne sait la sérialiser que si c'est déjà une chaîne.
describe("BackupService._serialiserPourInsertion", () => {
  test("sérialise objets et tableaux en JSON, laisse le reste inchangé", () => {
    const rows = [
      {
        id: 1,
        nom: "Alice",
        actif: true,
        note: null,
        cree_le: new Date("2026-01-01"),
        specialites: ["Niveau 2", "RIFAP"],
        meta: { niveau: "Niveau 2", tags: ["a", "b"] },
      },
    ];

    const [serialisee] = service._serialiserPourInsertion(rows);

    expect(serialisee.id).toBe(1);
    expect(serialisee.nom).toBe("Alice");
    expect(serialisee.actif).toBe(true);
    expect(serialisee.note).toBeNull();
    expect(serialisee.cree_le).toBeInstanceOf(Date);
    expect(serialisee.specialites).toBe('["Niveau 2","RIFAP"]');
    expect(serialisee.meta).toBe('{"niveau":"Niveau 2","tags":["a","b"]}');
  });
});

describe("BackupService.restaurer", () => {
  test("vide puis réinsère chaque table, dans une seule transaction", async () => {
    const snapshot = {
      id: 7,
      contenu: {
        activites: { sorties: [{ id_sortie: 1 }] },
      },
    };
    jest.spyOn(service, "recuperer").mockResolvedValue(snapshot);
    jest.spyOn(service, "ordreTopologique").mockResolvedValue(["sorties"]);
    jest.spyOn(service, "colonnesPrimaires").mockResolvedValue({ sorties: "id_sortie" });
    jest.spyOn(service, "_recalerSequence").mockResolvedValue();

    await service.restaurer(7);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('TRUNCATE TABLE "activites"."sorties"'),
      expect.objectContaining({ transaction: { __fakeTransaction: true } }),
    );
    expect(mockBulkInsert).toHaveBeenCalledWith(
      { schema: "activites", tableName: "sorties" },
      [{ id_sortie: 1 }],
      { transaction: { __fakeTransaction: true } },
    );
    expect(service._recalerSequence).toHaveBeenCalledWith(
      "activites",
      "sorties",
      "id_sortie",
      { __fakeTransaction: true },
    );
  });

  test("ignore un schéma sans aucune table dans l'instantané", async () => {
    jest.spyOn(service, "recuperer").mockResolvedValue({ id: 1, contenu: { vide: {} } });

    await service.restaurer(1);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockBulkInsert).not.toHaveBeenCalled();
  });
});
