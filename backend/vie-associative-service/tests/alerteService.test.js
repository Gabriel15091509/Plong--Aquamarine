const AlerteService = require("../src/services/AlerteService");
const identiteClient = require("../src/utils/serviceClients/identiteClient");
const smsClient = require("../src/utils/smsClient");

jest.mock("../src/utils/serviceClients/identiteClient");
jest.mock("../src/utils/smsClient");

const service = new AlerteService();

// Régression : deux adhésions différentes du même adhérent qui expirent la
// même semaine (ex. Licence FFESM ET Assurance RC) convergeaient vers une
// seule ligne d'alerte — upsertAutomaticAlerte dédupliquait uniquement sur
// (num_adherent, type générique "Adhésion expire bientôt"), la seconde
// écrasant silencieusement la trace de la première. Corrigé en ajoutant
// reference_type/reference_id à la clé de déduplication.
describe("AlerteService.upsertAutomaticAlerte — déduplication par référence", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("crée deux alertes distinctes pour deux adhésions différentes du même adhérent", async () => {
    jest.spyOn(service.alerteRepository, "findOne").mockResolvedValue(null);
    const createSpy = jest
      .spyOn(service.alerteRepository, "create")
      .mockImplementation(async (data) => ({ ...data, id_alerte: data.reference_id }));

    await service.upsertAutomaticAlerte(
      "ADH-2026-0001",
      { preferred: "Adhesion expire bientot", fallback: "Adhésion expirée" },
      { referenceType: "Adhesion", referenceId: 10, detail: "Licence FFESM" },
    );
    await service.upsertAutomaticAlerte(
      "ADH-2026-0001",
      { preferred: "Adhesion expire bientot", fallback: "Adhésion expirée" },
      { referenceType: "Adhesion", referenceId: 11, detail: "Assurance responsabilité civile" },
    );

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reference_id: 10, detail: "Licence FFESM" }),
    );
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reference_id: 11, detail: "Assurance responsabilité civile" }),
    );
  });

  test("met à jour (pas de doublon) pour une resynchronisation de la même adhésion", async () => {
    const existing = { type: "Adhesion expire bientot", update: jest.fn().mockResolvedValue(true) };
    jest.spyOn(service.alerteRepository, "findOne").mockResolvedValue(existing);
    const createSpy = jest.spyOn(service.alerteRepository, "create");

    await service.upsertAutomaticAlerte(
      "ADH-2026-0001",
      { preferred: "Adhesion expire bientot", fallback: "Adhésion expirée" },
      { referenceType: "Adhesion", referenceId: 10, detail: "Licence FFESM" },
    );

    expect(createSpy).not.toHaveBeenCalled();
    expect(existing.update).toHaveBeenCalledWith(
      expect.objectContaining({ detail: "Licence FFESM" }),
    );
  });
});

// Régression : le dropdown de notifications (Header.jsx côté frontend)
// chargeait TOUTES les alertes non lues sans limite, faisant grimper le ram
// du navigateur pour un club avec beaucoup d'alertes. getUnread plafonne
// désormais la liste ; getAllPaginated donne accès à l'historique complet,
// paginé, pour la page "Toutes les notifications".
describe("AlerteService.getUnread — plafond du dropdown", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("transmet la limite par défaut (20) au repository", async () => {
    jest.spyOn(service, "syncExpirationAlertes").mockResolvedValue();
    const findUnreadSpy = jest.spyOn(service.alerteRepository, "findUnread").mockResolvedValue([]);

    await service.getUnread({ role: "president" }, null);

    expect(findUnreadSpy).toHaveBeenCalledWith(expect.any(Object), { limit: 20 });
  });

  test("transmet une limite explicite au repository", async () => {
    jest.spyOn(service, "syncExpirationAlertes").mockResolvedValue();
    const findUnreadSpy = jest.spyOn(service.alerteRepository, "findUnread").mockResolvedValue([]);

    await service.getUnread({ role: "president" }, null, { limit: 5 });

    expect(findUnreadSpy).toHaveBeenCalledWith(expect.any(Object), { limit: 5 });
  });
});

describe("AlerteService.getAllPaginated", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("calcule offset/limit à partir de page et pageSize, renvoie le total", async () => {
    jest.spyOn(service, "syncExpirationAlertes").mockResolvedValue();
    const findAllPaginatedSpy = jest
      .spyOn(service.alerteRepository, "findAllPaginated")
      .mockResolvedValue({ rows: [], count: 45 });

    const result = await service.getAllPaginated({ page: 3, pageSize: 10 }, { role: "president" }, null);

    expect(findAllPaginatedSpy).toHaveBeenCalledWith(expect.any(Object), { limit: 10, offset: 20 });
    expect(result).toEqual({ data: [], total: 45, page: 3, pageSize: 10, totalPages: 5 });
  });

  test("retombe sur la page 1 / taille par défaut si non fournis", async () => {
    jest.spyOn(service, "syncExpirationAlertes").mockResolvedValue();
    const findAllPaginatedSpy = jest
      .spyOn(service.alerteRepository, "findAllPaginated")
      .mockResolvedValue({ rows: [], count: 0 });

    await service.getAllPaginated({}, { role: "president" }, null);

    expect(findAllPaginatedSpy).toHaveBeenCalledWith(expect.any(Object), { limit: 20, offset: 0 });
  });

  test("plafonne pageSize à 100 même si une valeur plus grande est demandée", async () => {
    jest.spyOn(service, "syncExpirationAlertes").mockResolvedValue();
    const findAllPaginatedSpy = jest
      .spyOn(service.alerteRepository, "findAllPaginated")
      .mockResolvedValue({ rows: [], count: 0 });

    await service.getAllPaginated({ page: 1, pageSize: 500 }, { role: "president" }, null);

    expect(findAllPaginatedSpy).toHaveBeenCalledWith(expect.any(Object), { limit: 100, offset: 0 });
  });
});

const baseAlerte = {
  id_alerte: 1,
  num_adherent: "ADH-2026-0001",
  type: "Certificat expiré",
  canal: "Notification",
  statut: "Envoyé",
  read: false,
  save: jest.fn().mockResolvedValue(true),
};

describe("AlerteService.relancerParSms", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("refuse un adhérent (rôle non habilité à gérer les alertes)", async () => {
    await expect(
      service.relancerParSms(1, { role: "adherent" }, null),
    ).rejects.toThrow(/président, un moniteur ou le trésorier/);
  });

  test("lève une erreur si l'alerte n'existe pas", async () => {
    jest.spyOn(service.alerteRepository, "findById").mockResolvedValue(null);

    await expect(
      service.relancerParSms(999, { role: "president" }, null),
    ).rejects.toThrow(/non trouvée/);
  });

  test("lève une erreur si l'adhérent n'a pas de numéro de téléphone", async () => {
    jest.spyOn(service.alerteRepository, "findById").mockResolvedValue({ ...baseAlerte });
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getAdherentById.mockResolvedValue({ nom: "Dupont", telephone: null });

    await expect(
      service.relancerParSms(1, { role: "president" }, null),
    ).rejects.toThrow(/téléphone/);
  });

  test("envoie le SMS et met à jour l'alerte (canal, statut, date d'envoi)", async () => {
    const alerte = { ...baseAlerte, save: jest.fn().mockResolvedValue(true) };
    jest.spyOn(service.alerteRepository, "findById").mockResolvedValue(alerte);
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getAdherentById.mockResolvedValue({
      nom: "Dupont",
      prenom: "Jean",
      telephone: "0612345678",
    });
    smsClient.sendSms.mockResolvedValue({ success: true });

    const result = await service.relancerParSms(1, { role: "president" }, null);

    expect(smsClient.sendSms).toHaveBeenCalledWith(
      expect.objectContaining({ to: "0612345678" }),
    );
    expect(alerte.canal).toBe("SMS");
    expect(alerte.statut).toBe("Envoyé");
    expect(alerte.save).toHaveBeenCalled();
    expect(result.num_adherent).toBe("ADH-2026-0001");
  });
});
