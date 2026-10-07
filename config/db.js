import { MongoClient } from "mongodb";

const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const dbName = process.env.DB_NAME;

if (!user) {
  throw new Error("❌ DB_USER is not defined in .env");
}

if (!password) {
  throw new Error("❌ DB_PASS is not defined in .env");
}

if (!dbName) {
  throw new Error("❌ DB_NAME is not defined in .env");
}

const encodedUser = encodeURIComponent(user);
const encodedPassword = encodeURIComponent(password);

const uri = `mongodb+srv://${encodedUser}:${encodedPassword}@cluster0.g29mryf.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri);

let db = null;

export async function connectToMongoDB() {
  try {
    await client.connect();

    db = client.db(dbName);

    console.log("✅ Successfully connected to MongoDB");

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error(
      "❌ Database is not connected. Call connectToMongoDB() first.",
    );
  }

  return db;
}

export async function disconnectFromMongoDB() {
  try {
    await client.close();

    db = null;

    console.log("✅ MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
  }
}
