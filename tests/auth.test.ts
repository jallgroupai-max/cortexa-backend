import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const TEST_EMAIL = "test-auth@cortexa.ai";
const TEST_PASSWORD = "testpassword123";
let authToken: string;

describe("Auth Module", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should validate email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "invalid", password: TEST_PASSWORD });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@test.com", password: "123" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_EMAIL, password: "wrongpass" });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "noexist@test.com", password: TEST_PASSWORD });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(TEST_EMAIL);
      expect(res.body.data.profile).toBeDefined();
    });

    it("should reject without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });
  });
});
