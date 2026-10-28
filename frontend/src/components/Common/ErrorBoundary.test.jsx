import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

// Composant qui plante au rendu, pour déclencher componentDidCatch —
// message volontairement technique (comme une vraie exception JS) pour
// vérifier qu'il ne fuite jamais dans l'UI.
const Boom = () => {
  throw new Error("Cannot read properties of undefined (reading 'map')");
};

describe("ErrorBoundary", () => {
  it("affiche un message générique, jamais le message technique brut de l'exception", () => {
    // React logge aussi l'erreur non interceptée sur console.error par
    // défaut en plus de componentDidCatch : réduit au silence pour ce test,
    // le comportement (pas le log) est ce qui est vérifié ici.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Cette page a rencontré une erreur")).toBeInTheDocument();
    expect(
      screen.queryByText(/Cannot read properties of undefined/i),
    ).not.toBeInTheDocument();

    console.error.mockRestore();
  });
});
