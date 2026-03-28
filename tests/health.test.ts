import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health Check", () => {
  it("should return status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
