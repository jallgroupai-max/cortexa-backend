import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let authToken: string;
let agentId: string;
const TEST_EMAIL = "test-agents@cortexa.ai";

describe("Agents Module", () => {
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: TEST_EMAIL, password: "testpassword123" });
    authToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  describe("POST /api/agents", () => {
    it("should create an agent", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Agent", model: "GPT-4o", prompt: "Test prompt" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test Agent");
      expect(res.body.data.model).toBe("GPT-4o");
      agentId = res.body.data.id;
    });

    it("should require name", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ model: "GPT-4o" });

      expect(res.status).toBe(400);
    });

    it("should require auth", async () => {
      const res = await request(app)
        .post("/api/agents")
        .send({ name: "Unauthorized" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/agents", () => {
    it("should list agents", async () => {
      const res = await request(app)
        .get("/api/agents")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should support pagination", async () => {
      const res = await request(app)
        .get("/api/agents?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });
  });

  describe("GET /api/agents/:id", () => {
    it("should get agent by id", async () => {
      const res = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(agentId);
      expect(res.body.data.knowledgeSources).toBeDefined();
    });

    it("should return 404 for invalid id", async () => {
      const res = await request(app)
        .get("/api/agents/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/agents/:id", () => {
    it("should update agent", async () => {
      const res = await request(app)
        .put(`/api/agents/${agentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Agent" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Agent");
    });
  });

  describe("DELETE /api/agents/:id", () => {
    it("should delete agent", async () => {
      const res = await request(app)
        .delete(`/api/agents/${agentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 after delete", async () => {
      const res = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
