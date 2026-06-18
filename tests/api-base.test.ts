import { describe, it, vi, expect } from "vitest";

describe("API base URL", () => {
  it("retorna localhost:3001 quando dentro do Tauri", async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    vi.resetModules();
    const { API } = await import("../src/lib/api-base");
    expect(API).toBe("http://localhost:3001/api");
    delete (window as any).__TAURI_INTERNALS__;
  });

  it("retorna mesma origem quando não está no Tauri", async () => {
    vi.resetModules();
    const { API } = await import("../src/lib/api-base");
    expect(API).toBe(`${window.location.origin}/api`);
  });
});
