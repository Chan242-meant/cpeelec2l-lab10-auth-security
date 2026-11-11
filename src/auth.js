const jwt = require("jsonwebtoken");
const prisma = require("./prisma");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return secret;
}

function signToken(user) {
  return jwt.sign({ role: user.role }, getSecret(), {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    algorithm: "HS256",
  });
}

// Requires a valid Bearer token; sets req.user = { id, role }
function authenticate(req, res, next) {
  const secret = getSecret();
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Allows only the listed roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden." });
    }
    return next();
  };
}

// ADMIN always allowed; USER only for their own task
async function requireOwnerOrAdmin(req, res, next) {
  try {
    if (req.user.role === "ADMIN") return next();
    if (!/^\d+$/.test(req.params.id)) return next(); // route returns 400
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
      select: { userId: true },
    });
    if (!task) return res.status(404).json({ error: "Task not found." });
    if (task.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden." });
    }
    return next();
  } catch (error) {
    console.error("Authorization error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// A USER may not reassign a task to another user; ADMIN may
function preventReassignment(req, res, next) {
  const body = req.body || {};
  if (
    req.user.role !== "ADMIN" &&
    body.userId !== undefined &&
    Number(body.userId) !== req.user.id
  ) {
    return res.status(403).json({ error: "Forbidden." });
  }
  return next();
}
module.exports = { signToken, authenticate, requireRole, requireOwnerOrAdmin, preventReassignment };