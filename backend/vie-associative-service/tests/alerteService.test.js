const AlerteService = require("../src/services/AlerteService");
const identiteClient = require("../src/utils/serviceClients/identiteClient");
const smsClient = require("../src/utils/smsClient");

jest.mock("../src/utils/serviceClients/identiteClient");
jest.mock("../src/utils/smsClient");

const service = new AlerteService();

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
