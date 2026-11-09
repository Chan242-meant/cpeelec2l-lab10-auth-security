process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test_db";
process.env.DATABASE_SSL = "false";
process.env.JWT_SECRET = "test-secret-not-for-production";
process.env.JWT_EXPIRES_IN = "15m";
process.env.BCRYPT_ROUNDS = "4";