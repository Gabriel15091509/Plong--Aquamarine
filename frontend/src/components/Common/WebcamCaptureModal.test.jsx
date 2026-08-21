import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WebcamCaptureModal from "./WebcamCaptureModal";

// jsdom n'implémente pas HTMLMediaElement.play() — sans ce stub, le
// startStream() du mode "live" lève et fait passer le composant en erreur
// avant même d'avoir pu vérifier son rendu normal.
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete navigator.mediaDevices;
});

describe("WebcamCaptureModal — accessibilité mobile (getUserMedia indisponible)", () => {
  it("bascule sur la capture native (input capture) quand getUserMedia n'existe pas — cas réel d'un accès HTTP simple depuis un smartphone", () => {
    // Pas de navigator.mediaDevices du tout : exactement ce que voit un
    // navigateur mobile hors contexte sécurisé (HTTP sur une IP LAN).
    render(<WebcamCaptureModal onCapture={vi.fn()} onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /ouvrir l'appareil photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^capturer$/i }),
    ).not.toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute("capture", "environment");
    expect(fileInput).toHaveAttribute("accept", "image/*");
  });

  it("bascule aussi quand mediaDevices existe mais sans getUserMedia (vieux navigateur)", () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {},
    });

    render(<WebcamCaptureModal onCapture={vi.fn()} onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /ouvrir l'appareil photo/i }),
    ).toBeInTheDocument();
  });

  it("utilise la caméra live quand getUserMedia est disponible (comportement inchangé)", () => {
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    render(<WebcamCaptureModal onCapture={vi.fn()} onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /^capturer$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ouvrir l'appareil photo/i }),
    ).not.toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
      audio: false,
    });
  });
});
