/**
 * tests/server.test.js
 *
 * Integration-style tests for the Express REST API.
 * Prisma is fully mocked so no database connection is required.
 * Run with: npm test
 */

"use strict";

// ---------------------------------------------------------------------------
// Mock src/prisma.js BEFORE requiring the app.
// Jest intercepts require("./prisma") inside src/server.js and returns this
// object instead, so the MariaDB adapter is never instantiated.
// ---------------------------------------------------------------------------
jest.mock("../src/prisma", () => ({
  task: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  user: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
  },
}));

const request = require("supertest");
const { signTestToken, authedApi } = require("./helpers");
const app     = require("../src/server");
const prisma  = require("../src/prisma");
const api = authedApi(request, app, signTestToken(1, "ADMIN"));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_USER = { id: 1, name: "Alice Santos", email: "alice@example.com" };
const MOCK_TASK = {
  id: 1,
  title: "Sample task",
  description: "A description",
  status: "TODO",
  userId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: MOCK_USER,
};

// Reset all mocks between tests so call counts don't bleed across suites
beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
describe("GET /health", () => {
  it("returns 200 with status ok and a commit field", async () => {
    const res = await api.get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(res.body).toHaveProperty("commit");
  });
});

// ---------------------------------------------------------------------------
// GET /
// ---------------------------------------------------------------------------
describe("GET /", () => {
  it("returns 200 with a running message", async () => {
    const res = await api.get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/running/i);
  });
});

// ---------------------------------------------------------------------------
// GET /tasks
// ---------------------------------------------------------------------------
describe("GET /tasks", () => {
  it("returns 200 and an array of tasks", async () => {
    prisma.task.findMany.mockResolvedValue([MOCK_TASK]);

    const res = await api.get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(1);
  });

  it("filters by valid status query param", async () => {
    prisma.task.findMany.mockResolvedValue([MOCK_TASK]);

    const res = await api.get("/tasks?status=TODO");
    expect(res.statusCode).toBe(200);
    // Confirm findMany was called with the correct where clause
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "TODO" } })
    );
  });

  it("returns 400 for an invalid status query param", async () => {
    const res = await api.get("/tasks?status=INVALID");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});

// ---------------------------------------------------------------------------
// GET /tasks/:id
// ---------------------------------------------------------------------------
describe("GET /tasks/:id", () => {
  it("returns 200 and the task when found", async () => {
    prisma.task.findUnique.mockResolvedValue(MOCK_TASK);

    const res = await api.get("/tasks/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when the task does not exist", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await api.get("/tasks/999");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 400 for a non-integer id", async () => {
    const res = await api.get("/tasks/abc");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});

// ---------------------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------------------
describe("POST /tasks", () => {
  it("returns 201 and the created task on valid input", async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    prisma.task.create.mockResolvedValue(MOCK_TASK);

    const res = await api
      .post("/tasks")
      .send({ title: "Sample task", userId: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Sample task");
  });

  it("returns 400 when title is missing", async () => {
    const res = await api
      .post("/tasks")
      .send({ userId: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/title/i)])
    );
  });

  it("returns 400 when title exceeds 100 characters", async () => {
    const res = await api
      .post("/tasks")
      .send({ title: "A".repeat(101), userId: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/100/)])
    );
  });

  it("returns 400 when userId does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await api
      .post("/tasks")
      .send({ title: "Task", userId: 99 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/does not exist/i)])
    );
  });

  it("returns 400 when status is not a valid enum value", async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);

    const res = await api
      .post("/tasks")
      .send({ title: "Task", userId: 1, status: "PENDING" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/status/i)])
    );
  });
});

// ---------------------------------------------------------------------------
// PUT /tasks/:id
// ---------------------------------------------------------------------------
describe("PUT /tasks/:id", () => {
  it("returns 200 and the updated task on valid input", async () => {
    const updated = { ...MOCK_TASK, title: "Updated title" };
    prisma.task.findUnique.mockResolvedValue(MOCK_TASK);
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    prisma.task.update.mockResolvedValue(updated);

    const res = await api
      .put("/tasks/1")
      .send({ title: "Updated title" });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Updated title");
  });

  it("returns 404 when the task does not exist", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await api
      .put("/tasks/999")
      .send({ title: "x" });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when no fields are provided", async () => {
    prisma.task.findUnique.mockResolvedValue(MOCK_TASK);

    const res = await api.put("/tasks/1").send({});
    expect(res.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /tasks/:id
// ---------------------------------------------------------------------------
describe("DELETE /tasks/:id", () => {
  it("returns 200 and the deleted task id on success", async () => {
    prisma.task.findUnique.mockResolvedValue(MOCK_TASK);
    prisma.task.delete.mockResolvedValue(MOCK_TASK);

    const res = await api.delete("/tasks/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when the task does not exist", async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    const res = await api.delete("/tasks/999");
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /tasks/:id - invalid id", () => {
  it("returns 400 when the id is not a number", async () => {
    // Arrange
    const invalidId = "abc";

    // Act
    const res = await api.delete(`/tasks/${invalidId}`);

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is only partly numeric (12abc)", async () => {
    // Arrange
    const partlyNumericId = "12abc";

    // Act
    const res = await api.delete(`/tasks/${partlyNumericId}`);

    // Assert
    expect(res.status).toBe(400);
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------
describe("GET /users", () => {
  it("returns 200 and an array of users", async () => {
    prisma.user.findMany.mockResolvedValue([MOCK_USER]);

    const res = await api.get("/users");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Alice Santos");
  });
});
