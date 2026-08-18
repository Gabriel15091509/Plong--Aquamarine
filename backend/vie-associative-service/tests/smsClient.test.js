const { sendSms, normalizePhoneNumber } = require("../src/utils/smsClient");

describe("smsClient.normalizePhoneNumber", () => {
  test("convertit un numéro français local en international", () => {
    expect(normalizePhoneNumber("06 12 34 56 78")).toBe("33612345678");
  });

  test("laisse un numéro déjà international (+33) inchangé, sans le +", () => {
    expect(normalizePhoneNumber("+33 6 12 34 56 78")).toBe("33612345678");
  });
});

describe("smsClient.sendSms — indisponibilité d'OVH SMS", () => {
  const ORIGINAL_ENV = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    global.fetch = originalFetch;
  });

  test("simule l'envoi (ne throw pas) si aucun identifiant OVH n'est configuré", async () => {
    delete process.env.OVH_SMS_ACCOUNT;
    delete process.env.OVH_SMS_LOGIN;
    delete process.env.OVH_SMS_PASSWORD;

    const result = await sendSms({ to: "0612345678", message: "Test" });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
  });

  test("lève une erreur si OVH répond en erreur métier (KO)", async () => {
    process.env.OVH_SMS_ACCOUNT = "sms-test1";
    process.env.OVH_SMS_LOGIN = "login";
    process.env.OVH_SMS_PASSWORD = "password";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "KO 50 Not enough credits",
    });

    await expect(sendSms({ to: "0612345678", message: "Test" })).rejects.toThrow(/échec de l'envoi/);
  });

  test("réussit quand OVH répond OK", async () => {
    process.env.OVH_SMS_ACCOUNT = "sms-test1";
    process.env.OVH_SMS_LOGIN = "login";
    process.env.OVH_SMS_PASSWORD = "password";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "OK 12345",
    });

    const result = await sendSms({ to: "0612345678", message: "Test" });

    expect(result.success).toBe(true);
    expect(result.simulated).toBeUndefined();
  });

  test("exige un destinataire et un message", async () => {
    await expect(sendSms({ message: "Test" })).rejects.toThrow(/Destinataire/);
    await expect(sendSms({ to: "0612345678" })).rejects.toThrow(/Message/);
  });
});
