import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FiInfo } from "react-icons/fi";
import SectionCard from "./SectionCard";

describe("SectionCard", () => {
  it("affiche le titre et le contenu", () => {
    render(
      <SectionCard title="Informations générales" icon={FiInfo}>
        <p>Contenu de test</p>
      </SectionCard>,
    );
    expect(screen.getByText("Informations générales")).toBeInTheDocument();
    expect(screen.getByText("Contenu de test")).toBeInTheDocument();
  });

  it("affiche headerExtra à côté du titre quand fourni", () => {
    render(
      <SectionCard title="Sorties" icon={FiInfo} headerExtra={<button>Ajouter</button>}>
        <p>Liste</p>
      </SectionCard>,
    );
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });
});
