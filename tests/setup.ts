process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.UPSTASH_REDIS_REST_URL ??= "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "test-token";
process.env.VERCEL_OIDC_TOKEN ??= "test-oidc-token"; // gateway calls are mocked in tests
process.env.ADMIN_SECRET ??= "x".repeat(32);
process.env.SESSION_COOKIE_SECRET ??= "y".repeat(32);
