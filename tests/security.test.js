const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

jest.mock("../src/prisma", () => ({
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../src/prisma");
const app = require("../src/server");
const { signTestToken, authedApi } = require("./helpers");

const PASSWORD = "User#12345";
const HASH = bcrypt.hashSync(PASSWORD, 4);
const adminApi = authedApi(request, app, signTestToken(1, "ADMIN"));
const userApi = authedApi(request, app, signTestToken(2, "USER"));

beforeEach(() => jest.resetAllMocks());

describe("POST /auth/login", () => {
  it("returns 200 and a token for valid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2, name: "Bob Reyes", email: "bob@example.com", passwordHash: HASH, role: "USER",
    });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "bob@example.com", password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("USER");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("returns 401 'Invalid credentials.' for a wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2, name: "Bob Reyes", email: "bob@example.com", passwordHash: HASH, role: "USER",
    });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "bob@example.com", password: "Wrong#12345" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials.");
  });

  it("returns the same 401 response for an unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials.");
  });

  it("returns 400 when credentials are missing", async () => {
    const noBody = await request(app).post("/auth/login").send({});
    const noPassword = await request(app)
      .post("/auth/login")
      .send({ email: "bob@example.com" });
    expect(noBody.status).toBe(400);
    expect(noPassword.status).toBe(400);
  });
});

describe("POST /auth/register", () => {
  it("creates a USER, hashes the password, and ignores a client-sent role", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 5, name: data.name, email: data.email, role: data.role, createdAt: new Date(),
    }));
    const res = await request(app).post("/auth/register").send({
      name: "New Person", email: "New@Example.com", password: "Passw0rd!", role: "ADMIN",
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("USER");
    expect(res.body.email).toBe("new@example.com");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    const saved = prisma.user.create.mock.calls[0][0].data;
    expect(saved.passwordHash).not.toBe("Passw0rd!");
    expect(saved.passwordHash.startsWith("$2")).toBe(true);
  });

  it("returns 409 for a duplicate email", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    const res = await request(app).post("/auth/register").send({
      name: "Dup", email: "alice@example.com", password: "Passw0rd!",
    });
    expect(res.status).toBe(409);
  });

  it("returns 400 for a weak password", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Weak", email: "weak@example.com", password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 with no stack trace for malformed JSON", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.text).not.toContain("node_modules");
  });
});

describe("Token handling on protected routes", () => {
  const protectedCalls = [
    ["get", "/tasks"], ["get", "/tasks/1"], ["get", "/users"],
    ["post", "/tasks"], ["put", "/tasks/1"], ["delete", "/tasks/1"],
  ];

  it.each(protectedCalls)("returns 401 for %s %s without a token", async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });

  it("returns 401 for a malformed token", async () => {
    const res = await request(app).get("/tasks").set("Authorization", "Bearer not.a.token");
    expect(res.status).toBe(401);
  });

  it("returns 401 for a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ role: "ADMIN" }, "some-other-secret", { subject: "1" });
    const res = await request(app).get("/tasks").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const expired = jwt.sign(
      { role: "ADMIN", exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
      { subject: "1" }
    );
    const res = await request(app).get("/tasks").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("returns 401 for an unsigned (alg: none) token", async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "1", role: "ADMIN" })}.`;
    const res = await request(app).get("/tasks").set("Authorization", `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });
});

describe("Role and ownership rules", () => {
  it("returns 403 when a USER deletes a task", async () => {
    const res = await userApi.delete("/tasks/1");
    expect(res.status).toBe(403);
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it("allows an ADMIN to delete a task", async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 1, userId: 2 });
    prisma.task.delete.mockResolvedValue({ id: 1 });
    const res = await adminApi.delete("/tasks/1");
    expect(res.status).toBe(200);
  });

  it("returns 403 when a USER updates another user's task", async () => {
    prisma.task.findUnique.mockResolvedValue({ userId: 1 });
    const res = await userApi.put("/tasks/1").send({ title: "Hijack" });
    expect(res.status).toBe(403);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("allows a USER to update their own task", async () => {
    prisma.task.findUnique.mockResolvedValue({ userId: 2 });
    prisma.task.update.mockResolvedValue({ id: 1, title: "Mine", userId: 2 });
    const res = await userApi.put("/tasks/1").send({ title: "Mine" });
    expect(res.status).toBe(200);
  });

  it("returns 403 when a USER tries to reassign their task to someone else", async () => {
    prisma.task.findUnique.mockResolvedValue({ userId: 2 });
    const res = await userApi.put("/tasks/1").send({ userId: 1 });
    expect(res.status).toBe(403);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("assigns a USER's new task to themselves even if another userId is sent", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.task.create.mockResolvedValue({ id: 9, title: "Mine", userId: 2 });
    const res = await userApi.post("/tasks").send({ title: "Mine", userId: 1 });
    expect(res.status).toBe(201);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 } })
    );
  });
});

describe("Sign-out and data exposure", () => {
  it("returns 200 on logout with a valid token and 401 without one", async () => {
    const ok = await userApi.post("/auth/logout");
    const denied = await request(app).post("/auth/logout");
    expect(ok.status).toBe(200);
    expect(denied.status).toBe(401);
  });

  it("never selects passwordHash when listing users", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 1, name: "A", email: "a@example.com" }]);
    const res = await userApi.get("/users");
    expect(res.status).toBe(200);
    expect(prisma.user.findMany.mock.calls[0][0].select).toEqual({
      id: true, name: true, email: true,
    });
  });
});