const CertificatMedicalService = require("../src/services/CertificatMedicalService");

const service = new CertificatMedicalService();

// Badge Sidebar : doit passer par le COUNT léger du repository, jamais par
// un findAll() côté service (voir CertificatMedicalRepository.
// countEnAttenteValidation) — même motif que AdhesionService.
// getEnAttenteValidationCount.
describe("CertificatMedicalService.getEnAttenteValidationCount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("délègue au COUNT léger du repository", async () => {
    jest.spyOn(service.certificatRepository, "countEnAttenteValidation").mockResolvedValue(5);

    const result = await service.getEnAttenteValidationCount();

    expect(service.certificatRepository.countEnAttenteValidation).toHaveBeenCalled();
    expect(result).toBe(5);
  });
});
