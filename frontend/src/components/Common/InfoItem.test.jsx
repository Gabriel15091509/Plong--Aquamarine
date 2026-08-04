import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FiUser } from "react-icons/fi";
import InfoItem from "./InfoItem";

describe("InfoItem", () => {
  it("affiche le label et la valeur fournis", () => {
    render(<InfoItem icon={FiUser} label="Nom" value="Payet" />);
    expect(screen.getByText("Nom")).toBeInTheDocument();
    expect(screen.getByText("Payet")).toBeInTheDocument();
  });

  it("affiche 'Non défini' quand value est vide", () => {
    render(<InfoItem icon={FiUser} label="Email" value="" />);
    expect(screen.getByText("Non défini")).toBeInTheDocument();
  });

  it("affiche children à la place de value quand fourni", () => {
    render(
      <InfoItem icon={FiUser} label="Statut">
        <span>Actif</span>
      </InfoItem>,
    );
    expect(screen.getByText("Actif")).toBeInTheDocument();
    expect(screen.queryByText("Non défini")).not.toBeInTheDocument();
  });
});
