const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
const { authenticate, signToken } = require("./auth");

const router = express.Router();
const rounds = () => Number(process.env.BCRYPT_ROUNDS) || 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_USER = { id: true, name: true, email: true, role: true, createdAt: true };

// Compared against when the email is unknown, so timing does not reveal it
let dummyHash;
const getDummyHash = () =>
  (dummyHash = dummyHash || bcrypt.hashSync("not-a-real-password", rounds()));

function validateRegistration(body) {
  const errors = [];
  const { name, email, password } = body || {};
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
    errors.push("Name is required (1-100 characters).");
  }
  if (typeof email !== "string" || email.trim().length > 254 || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email is required.");
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    errors.push("Password must be 8-72 characters.");
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push("Password must contain at least one letter and one number.");
  }
  return errors;
}

router.post("/register", async (req, res) => {
  try {
    const errors = validateRegistration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", errors });
    }
    const email = req.body.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered." });
    }
    const passwordHash = await bcrypt.hash(req.body.password, rounds());
    // Role is always USER; any role sent by the client is ignored
    const user = await prisma.user.create({
      data: { name: req.body.name.trim(), email, passwordHash, role: "USER" },
      select: PUBLIC_USER,
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error && error.code === "P2002") {
      return res.status(409).json({ error: "Email is already registered." });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    const matches = await bcrypt.compare(password, user ? user.passwordHash : getDummyHash());
    if (!user || !matches) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    return res.status(200).json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Tokens are stateless: the client discards the token to sign out
router.post("/logout", authenticate, (req, res) => {
  return res.status(200).json({ message: "Signed out. Discard the token on the client." });
});

module.exports = router;