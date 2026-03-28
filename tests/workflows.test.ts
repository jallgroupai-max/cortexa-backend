import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let authToken: string;
let workflowId: string;
const TEST_EMAIL = "test-workflows@cortexa.ai";

describe("Workflows Module", () => {
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

  describe("POST /api/workflows", () => {
    it("should create a workflow", async () => {
      const res = await request(app)
        .post("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Workflow", description: "Test description" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test Workflow");
      workflowId = res.body.data.id;
    });
  });

  describe("GET /api/workflows", () => {
    it("should list workflows", async () => {
      const res = await request(app)
        .get("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("PUT /api/workflows/:id", () => {
    it("should update workflow with nodes and edges", async () => {
      const res = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Workflow",
          nodes: [{ id: "node-1", type: "service" }],
          edges: [{ id: "edge-1", source: "node-1", target: "node-2" }],
          status: "active",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Workflow");
      expect(res.body.data.status).toBe("active");
    });
  });

  describe("POST /api/workflows/:id/duplicate", () => {
    it("should duplicate workflow", async () => {
      const res = await request(app)
        .post(`/api/workflows/${workflowId}/duplicate`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toContain("(copia)");
    });
  });

  describe("DELETE /api/workflows/:id", () => {
    it("should delete workflow", async () => {
      const res = await request(app)
        .delete(`/api/workflows/${workflowId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
