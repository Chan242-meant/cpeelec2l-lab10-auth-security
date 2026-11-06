require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// When DATABASE_SSL=true (required for hosted databases such as TiDB Cloud),
// parse the URL into individual fields and inject the ssl option.
// TiDB Cloud Serverless uses ISRG Root X1 (Let's Encrypt) which Node.js
// trusts natively, so no custom CA certificate is needed.
let adapterConfig;
if (process.env.DATABASE_SSL === "true") {
  const url = new URL(process.env.DATABASE_URL);
  adapterConfig = {
    host:     url.hostname,
    port:     Number(url.port) || 3306,
    user:     decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl:      { rejectUnauthorized: true },
  };
} else {
  // Local development: pass the URL string directly (no SSL)
  adapterConfig = process.env.DATABASE_URL;
}

const adapter = new PrismaMariaDb(adapterConfig);
const prisma  = new PrismaClient({ adapter });

module.exports = prisma;
