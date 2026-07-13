const mongoose = require('mongoose');
const User = require('../models/User');
const ChallengeScore = require('../models/ChallengeScore');
const { createClient } = require('redis');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:examplepassword@127.0.0.1:27017/quantumedge?authSource=admin';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'; 

async function cleanData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const userRes = await User.deleteMany({ username: { $regex: '^{.*}' } });
    console.log(`Deleted ${userRes.deletedCount} polluted User records`);

    const scoreRes = await ChallengeScore.deleteMany({ username: { $regex: '^{.*}' } });
    console.log(`Deleted ${scoreRes.deletedCount} polluted ChallengeScore records`);

    try {
      const redisClient = createClient({ url: REDIS_URL });
      redisClient.on('error', (err) => console.log('Redis error (skipping cache clear)'));
      await redisClient.connect();
      const keys = await redisClient.keys('leaderboard:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cleared ${keys.length} leaderboard cache keys in Redis`);
      }
      await redisClient.quit();
    } catch (e) {
        console.log("Redis cache clear failed or skipped", e.message);
    }

    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanData();
