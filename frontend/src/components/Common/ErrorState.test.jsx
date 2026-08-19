import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("affiche un message générique, jamais une erreur technique brute", () => {
    render(<ErrorState />);
    expect(screen.getByText("Chargement impossible")).toBeInTheDocument();
    expect(screen.queryByText(/Network Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/status code/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas de bouton Réessayer sans onRetry", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("affiche et déclenche le bouton Réessayer quand onRetry est fourni", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /réessayer/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("accepte un titre et un message personnalisés", () => {
    render(<ErrorState title="Oups" message="Détail custom" />);
    expect(screen.getByText("Oups")).toBeInTheDocument();
    expect(screen.getByText("Détail custom")).toBeInTheDocument();
  });
});
