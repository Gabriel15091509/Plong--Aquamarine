import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../services/Adherent/adherentService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Sortie/sortieService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Formation/formationService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Materiel/materielService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Plongee/plongeeService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Adhesion/adhesionService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/CertificatMedical/certificatService", () => ({ default: { getAll: vi.fn() } }));
vi.mock("../services/Inscription/inscriptionService", () => ({ default: { getAll: vi.fn() } }));

import adherentService from "../services/Adherent/adherentService";
import sortieService from "../services/Sortie/sortieService";
import formationService from "../services/Formation/formationService";
import materielService from "../services/Materiel/materielService";
import plongeeService from "../services/Plongee/plongeeService";
import adhesionService from "../services/Adhesion/adhesionService";
import certificatService from "../services/CertificatMedical/certificatService";
import inscriptionService from "../services/Inscription/inscriptionService";
import {
  prefetchForOffline,
  getPrefetchStatus,
  registerOfflinePrefetchOnReconnect,
} from "./offlinePrefetch";

const ALL_SERVICES = [
  adherentService,
  sortieService,
  formationService,
  materielService,
  plongeeService,
  adhesionService,
  certificatService,
  inscriptionService,
];

// Laisse les .then()/.catch() de prefetchForOffline s'exécuter avant
// d'inspecter getPrefetchStatus() — une simple micro-tâche ne suffit pas
// forcément selon le nombre de chaînages, on passe par un macro-tick.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const resolveAll = () => {
  for (const service of ALL_SERVICES) service.getAll.mockResolvedValue({});
};

describe("offlinePrefetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("ne déclenche aucun appel si hors-ligne", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    prefetchForOffline();
    expect(adherentService.getAll).not.toHaveBeenCalled();
  });

  it("enregistre un succès horodaté par entité", async () => {
    resolveAll();

    prefetchForOffline();
    await flush();

    const status = getPrefetchStatus();
    expect(status.adherents.ok).toBe(true);
    expect(typeof status.adherents.at).toBe("number");
    expect(status.sorties.ok).toBe(true);
    expect(status.inscriptions.ok).toBe(true);
  });

  it("conserve le dernier horodatage de succès connu quand un appel échoue ensuite", async () => {
    resolveAll();
    prefetchForOffline();
    await flush();
    const dernierSucces = getPrefetchStatus().adherents.at;

    adherentService.getAll.mockRejectedValueOnce(new Error("service indisponible"));
    prefetchForOffline();
    await flush();

    const status = getPrefetchStatus();
    expect(status.adherents.ok).toBe(false);
    expect(status.adherents.at).toBe(dernierSucces);
  });

  it("registerOfflinePrefetchOnReconnect ne s'abonne qu'une seule fois à 'online'", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    registerOfflinePrefetchOnReconnect();
    registerOfflinePrefetchOnReconnect();
    const onlineSubscriptions = addSpy.mock.calls.filter(([event]) => event === "online");
    expect(onlineSubscriptions.length).toBeLessThanOrEqual(1);
  });
});
