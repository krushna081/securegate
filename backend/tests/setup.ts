process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.MONGO_URI = 'mongodb://localhost:27017/securegate-test';
process.env.ALLOW_DEV_OTP = 'true';
