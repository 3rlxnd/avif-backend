const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
require("dotenv");

const mongoDB = process.env.DATABASE_URL;

mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("App connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

const userSchema = new mongoose.Schema({
  quota: Number,
  usage: Number,
  isActive: Boolean,
  keys: [
    {
      apiKey: String,
      apiSecret: String,
    },
  ],
});

async function addUser(req) {
  const apiKey = crypto.randomBytes(32).toString("hex");
  const apiKeyHash = await bcrypt.hash(apiKey, 10);
  const apiSecret = crypto.randomBytes(32).toString("hex");
  const apiSecretHash = await bcrypt.hash(apiSecret, 10);

  const user = new User({
    isActive: false,
    quota: 10,
    usage: 0,
    keys: {
      apiKey: apiKeyHash,
      apiSecret: apiSecretHash,
    },
  });

  await user.save().then(() => {
    // console.log("Created User");
    console.log("Key: " + apiKey + " Secret: " + apiSecret);
    return true;
  });
}

async function generateApiKey() {
  const apiKey = crypto.randomBytes(32).toString("hex");
  const apiKeyHash = await bcrypt.hash(apiKey, 10);
  const apiSecret = crypto.randomBytes(32).toString("hex");
  const apiSecretHash = await bcrypt.hash(apiSecret, 10);
  var key = {
    apiKey: apiKeyHash,
    apiSecret: apiSecretHash,
  };
  return key;
}

const User = mongoose.model("User", userSchema);

async function findUserByApiKeyAndSecret(req, res) {
  const { apiKey, apiSecret } = JSON.parse(req.body.auth);
  const users = await User.find({});
  for (const user of users) {
    for (const keyObj of user.keys) {
      if (!keyObj.apiKey || !keyObj.apiSecret) {
        continue;
      }

      const isApiKeyValid =
        apiKey && (await bcrypt.compare(apiKey, keyObj.apiKey));
      const isApiSecretValid =
        apiSecret && (await bcrypt.compare(apiSecret, keyObj.apiSecret));

      if (isApiKeyValid && isApiSecretValid) {
        return user;
      }
    }
  }
  return false;
}

async function incUsage(req) {
  const user = await findUserByApiKeyAndSecret(req);
  try {
    if (!user) {
      throw new Error("User not found.");
    }

    user.usage += 1;
    user.quota -= 1;
    await user.save();
    return true;
  } catch (err) {
    console.error(err);
    throw new Error("Error incrementing user quota.");
  }
}

async function verifyQuota(req) {
  const user = await findUserByApiKeyAndSecret(req);
  if (user.quota > 0) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  User,
  findUserByApiKeyAndSecret,
  addUser,
  incUsage,
  verifyQuota,
};
