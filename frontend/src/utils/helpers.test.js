import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatCurrency,
  getInitials,
  truncateText,
  capitalize,
  formatDuration,
  formatPhoneNumber,
  isSortieSelectionnable,
  joursRestants,
} from "./helpers";

describe("formatDate", () => {
  it("formate une date ISO en dd/MM/yyyy", () => {
    // Heure à midi UTC pour rester sur le même jour calendaire quel que
    // soit le fuseau horaire de la machine exécutant les tests.
    expect(formatDate("2026-08-04T12:00:00.000Z")).toBe("04/08/2026");
  });

  it("retourne '-' pour une valeur vide", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });

  it("retourne '-' pour une date invalide au lieu de lever", () => {
    expect(formatDate("pas-une-date")).toBe("-");
  });
});

describe("formatCurrency", () => {
  // Intl.NumberFormat("fr-FR", ...) sépare le montant du symbole par une
  // espace insécable (U+00A0), pas une espace normale — à reproduire
  // explicitement pour éviter un faux échec.
  const NBSP = " ";

  it("formate un montant en euros au format français", () => {
    expect(formatCurrency(42.5)).toBe(`42,50${NBSP}€`);
  });

  it("retourne '0,00 €' pour un montant nul ou vide", () => {
    expect(formatCurrency(0)).toBe(`0,00${NBSP}€`);
    expect(formatCurrency(null)).toBe(`0,00${NBSP}€`);
  });
});

describe("getInitials", () => {
  it("combine la première lettre du nom et du prénom en majuscules", () => {
    expect(getInitials("Payet", "Marie")).toBe("PM");
  });

  it("retourne '?' quand nom et prénom sont absents", () => {
    expect(getInitials(undefined, undefined)).toBe("?");
  });
});

describe("truncateText", () => {
  it("laisse un texte court inchangé", () => {
    expect(truncateText("Plongée", 100)).toBe("Plongée");
  });

  it("tronque et ajoute '...' au-delà de maxLength", () => {
    expect(truncateText("Plongée à La Corne", 8)).toBe("Plongée ...");
  });
});

describe("capitalize", () => {
  it("met en majuscule la première lettre et en minuscule le reste", () => {
    expect(capitalize("SAINT-LEU")).toBe("Saint-leu");
  });

  it("retourne une chaîne vide pour une entrée vide", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("formatDuration", () => {
  it("formate des minutes en heures et minutes", () => {
    expect(formatDuration(90)).toBe("1h 30min");
  });

  it("n'affiche que les minutes en dessous d'une heure", () => {
    expect(formatDuration(45)).toBe("45min");
  });

  it("n'affiche pas les minutes quand le compte tombe juste sur l'heure", () => {
    expect(formatDuration(120)).toBe("2h");
  });
});

describe("formatPhoneNumber", () => {
  it("espace un numéro français de 10 chiffres par paires", () => {
    expect(formatPhoneNumber("0612345678")).toBe("06 12 34 56 78");
  });

  it("laisse un numéro déjà espacé mais de longueur inattendue inchangé", () => {
    expect(formatPhoneNumber("+262 692 12 34 56")).toBe("+262 692 12 34 56");
  });
});

describe("isSortieSelectionnable", () => {
  it("est sélectionnable pour une sortie Planifiée", () => {
    expect(isSortieSelectionnable({ statut: "Planifiée" })).toBe(true);
  });

  it("n'est pas sélectionnable pour une sortie Terminée, En cours ou Annulée", () => {
    expect(isSortieSelectionnable({ statut: "Terminée" })).toBe(false);
    expect(isSortieSelectionnable({ statut: "En cours" })).toBe(false);
    expect(isSortieSelectionnable({ statut: "Annulée" })).toBe(false);
  });
});

describe("joursRestants", () => {
  it("renvoie 0 pour aujourd'hui, quelle que soit l'heure", () => {
    const dansQuelquesHeures = new Date();
    dansQuelquesHeures.setHours(dansQuelquesHeures.getHours() + 3);
    expect(joursRestants(dansQuelquesHeures)).toBe(0);
  });

  it("renvoie 1 pour demain", () => {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    expect(joursRestants(demain)).toBe(1);
  });

  it("renvoie le bon compte pour une date dans plusieurs jours", () => {
    const dansCinqJours = new Date();
    dansCinqJours.setDate(dansCinqJours.getDate() + 5);
    expect(joursRestants(dansCinqJours)).toBe(5);
  });

  it("renvoie une valeur négative pour une date passée", () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    expect(joursRestants(hier)).toBe(-1);
  });
});
