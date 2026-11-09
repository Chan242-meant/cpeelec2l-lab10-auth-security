require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const authRoutes = require("./authRoutes");

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5000;
const COMMIT_SHA =
  process.env.GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || "local";

// Allowed status enum values according to Prisma schema
const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS for origins configured via CORS_ORIGIN, defaulting to local Vite
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const configuredCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins =
  configuredCorsOrigins.length > 0
    ? configuredCorsOrigins
    : DEFAULT_CORS_ORIGINS;

app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10kb" }));
app.use("/auth", authRoutes);
// ==========================================
// Routes
// ==========================================

// Health / root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Lab 06/07 Tasks REST API is running." });
});

// Health check used by the hosting platform and deployment verification
app.get("/health", (req, res) => {
  res.json({ status: "ok", commit: COMMIT_SHA });
});

/**
 * GET /tasks
 * Retrieve tasks, optionally filtered by ?status= (TODO, IN_PROGRESS, DONE)
 */
app.get("/tasks", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    // Validate status query parameter if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: "Validation failed",
          errors: [
            `Invalid status query parameter '${status}'. Allowed values are: ${VALID_STATUSES.join(
              ", "
            )}`,
          ],
        });
      }
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /tasks/:id
 * Retrieve a single task by ID
 */
app.get("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Validation failed",
        errors: ["Invalid task ID. ID must be an integer."],
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /tasks
 * Create a new task with server-side validation:
 * - title: required, 1-100 characters
 * - description: optional, max 500 characters
 * - status: optional, must be a valid enum value (defaults to TODO)
 * - userId: required, user must exist in the database
 */
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, status, userId } = req.body;
    const errors = [];

    // 1. Title validation: required, 1-100 characters
    if (
      title === undefined ||
      title === null ||
      typeof title !== "string" ||
      title.trim().length === 0
    ) {
      errors.push("Title is required and cannot be empty.");
    } else if (title.trim().length > 100) {
      errors.push("Title must not exceed 100 characters.");
    }

    // 2. Description validation: optional, max 500 characters
    if (
      description !== undefined &&
      description !== null &&
      description !== ""
    ) {
      if (typeof description !== "string") {
        errors.push("Description must be a string.");
      } else if (description.length > 500) {
        errors.push("Description must not exceed 500 characters.");
      }
    }

    // 3. Status validation: must be a valid enum if provided
    if (status !== undefined && status !== null && status !== "") {
      if (!VALID_STATUSES.includes(status)) {
        errors.push(
          `Status must be one of the following: ${VALID_STATUSES.join(", ")}`
        );
      }
    }

    // 4. UserId validation: required, must be integer, and user must exist
    const parsedUserId = Number(userId);
    if (
      userId === undefined ||
      userId === null ||
      userId === "" ||
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0
    ) {
      errors.push("userId is required and must be a positive integer.");
    } else {
      const userExists = await prisma.user.findUnique({
        where: { id: parsedUserId },
      });
      if (!userExists) {
        errors.push(`User with userId ${parsedUserId} does not exist.`);
      }
    }

    // If any validation failed, return 400 Bad Request
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        errors,
      });
    }

    // Create the task in the database
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description:
          description && typeof description === "string"
            ? description.trim()
            : null,
        status: status || "TODO",
        userId: parsedUserId,
      },
      include: {
        user: true,
      },
    });

    return res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * PUT /tasks/:id
 * Update an existing task by ID
 */
app.put("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Validation failed",
        errors: ["Invalid task ID. ID must be an integer."],
      });
    }

    // Verify task exists first
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    const { title, description, status, userId } = req.body;
    const errors = [];

    // Ensure at least one field is provided for update
    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      userId === undefined
    ) {
      return res.status(400).json({
        error: "Validation failed",
        errors: ["At least one field (title, description, status, userId) must be provided to update."],
      });
    }

    // Title validation if provided
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        errors.push("Title cannot be empty.");
      } else if (title.trim().length > 100) {
        errors.push("Title must not exceed 100 characters.");
      }
    }

    // Description validation if provided
    if (description !== undefined && description !== null) {
      if (typeof description !== "string") {
        errors.push("Description must be a string.");
      } else if (description.length > 500) {
        errors.push("Description must not exceed 500 characters.");
      }
    }

    // Status validation if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        errors.push(
          `Status must be one of the following: ${VALID_STATUSES.join(", ")}`
        );
      }
    }

    // UserId validation if provided
    let parsedUserId;
    if (userId !== undefined) {
      parsedUserId = Number(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        errors.push("userId must be a positive integer.");
      } else {
        const userExists = await prisma.user.findUnique({
          where: { id: parsedUserId },
        });
        if (!userExists) {
          errors.push(`User with userId ${parsedUserId} does not exist.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        errors,
      });
    }

    // Construct update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) {
      updateData.description = description === null ? null : description.trim();
    }
    if (status !== undefined) updateData.status = status;
    if (parsedUserId !== undefined) updateData.userId = parsedUserId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * DELETE /tasks/:id
 * Delete a task by ID
 */
app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id, 10) : NaN;
if (isNaN(id)) {
      return res.status(400).json({
        error: "Validation failed",
        errors: ["Invalid task ID. ID must be an integer."],
      });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Task deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Optional helper endpoint: GET /users
 * Handy for frontend user select dropdowns
 */
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// In production, serve the built React client and fall back to index.html
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Only start listening when this file is run directly, so tests can import app
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Final error handler: never expose stack traces or file paths
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON." });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large." });
  }
  console.error("Unhandled error:", err && err.message);
  return res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
