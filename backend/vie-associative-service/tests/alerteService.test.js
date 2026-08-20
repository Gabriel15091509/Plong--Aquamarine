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
