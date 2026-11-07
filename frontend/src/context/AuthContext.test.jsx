import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../services/api";

vi.mock("../services/api", () => ({ default: {
  get: vi.fn(), post: vi.fn(), defaults: { headers: { common: {} } },
} }));
vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

function Session() {
  const { user, loading, login, logout } = useAuth();
  return <>
    <span>{loading ? "loading" : user?.name || "anonymous"}</span>
    <button onClick={() => login("test@example.com", "password")}>login</button>
    <button onClick={() => logout()}>logout</button>
  </>;
}
function setup() {
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><Session /></AuthProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

it("restores a server session rather than trusting a cached profile or token", async () => {
  localStorage.setItem("token", "legacy-jwt");
  localStorage.setItem("user", JSON.stringify({ name: "Wrong cached user", role: "president" }));
  api.get.mockResolvedValue({ data: { data: { user: { name: "Server user", role: "adherent" } } } });
  setup();
  await screen.findByText("Server user");
  expect(api.get).toHaveBeenCalledWith("/auth/session");
  expect(localStorage.getItem("token")).toBeNull();
  expect(api.defaults.headers.common.Authorization).toBeUndefined();
});

it("keeps the current session when server logout fails and clears it only after success", async () => {
  api.get.mockResolvedValue({ data: { data: { user: { name: "Server user", role: "adherent" } } } });
  api.post.mockRejectedValueOnce(new Error("offline"));
  setup();
  await screen.findByText("Server user");
  fireEvent.click(screen.getByText("logout"));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  expect(screen.getByText("Server user")).toBeInTheDocument();
  api.post.mockResolvedValueOnce({ data: { success: true } });
  fireEvent.click(screen.getByText("logout"));
  await screen.findByText("anonymous");
  expect(api.post).toHaveBeenLastCalledWith("/auth/logout");
  expect(localStorage.getItem("user")).toBeNull();
});

it("completes login with a profile and no JavaScript authentication token", async () => {
  api.get.mockRejectedValue(new Error("no session"));
  api.post.mockResolvedValue({ data: { success: true, data: { user: { name: "Logged in", role: "adherent" } } } });
  setup();
  await screen.findByText("anonymous");
  fireEvent.click(screen.getByText("login"));
  await screen.findByText("Logged in");
  expect(localStorage.getItem("token")).toBeNull();
  expect(api.defaults.headers.common.Authorization).toBeUndefined();
});
