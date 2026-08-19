import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LieuAutocompleteInput from "./LieuAutocompleteInput";
import geocodingService from "../../services/Sortie/geocodingService";

vi.mock("../../services/Sortie/geocodingService", () => ({
  default: { search: vi.fn() },
}));

const suggestion = {
  id: 42,
  lat: -21.166457,
  lng: 55.28697,
  label: "Saint-Leu, La Réunion, France",
  lieu: "Saint-Leu",
  site: "Port de Saint-Leu",
};

describe("LieuAutocompleteInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne déclenche pas de recherche en dessous de 3 caractères", async () => {
    render(
      <LieuAutocompleteInput value="" onChange={() => {}} onSelect={() => {}} />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "St" } });
    await new Promise((r) => setTimeout(r, 450));
    expect(geocodingService.search).not.toHaveBeenCalled();
  });

  it("affiche les suggestions renvoyées après la saisie (debounce)", async () => {
    geocodingService.search.mockResolvedValue([suggestion]);
    render(
      <LieuAutocompleteInput value="" onChange={() => {}} onSelect={() => {}} />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Saint-Leu" },
    });

    await waitFor(() =>
      expect(
        screen.getByText("Saint-Leu, La Réunion, France"),
      ).toBeInTheDocument(),
    );
    expect(geocodingService.search).toHaveBeenCalledWith(
      "Saint-Leu",
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("appelle onSelect avec la suggestion cliquée et ferme la liste", async () => {
    geocodingService.search.mockResolvedValue([suggestion]);
    const onSelect = vi.fn();
    render(
      <LieuAutocompleteInput value="" onChange={() => {}} onSelect={onSelect} />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Saint-Leu" },
    });

    const option = await screen.findByText("Saint-Leu, La Réunion, France");
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(suggestion);
    await waitFor(() =>
      expect(
        screen.queryByText("Saint-Leu, La Réunion, France"),
      ).not.toBeInTheDocument(),
    );
  });
});
