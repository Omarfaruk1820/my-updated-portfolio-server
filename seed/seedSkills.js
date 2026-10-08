import { connectToMongoDB, disconnectFromMongoDB } from "../config/db.js";
import { getDB } from "../config/db.js";

import skillsData from "./skills.data.js";

const seedSkills = async () => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    const db = getDB();
    const skillsCollection = db.collection("skills");

    console.log("🌱 Starting skills seed...");

    // Remove existing skills
    await skillsCollection.deleteMany({});

    console.log("🗑️ Existing skills removed.");

    // Add timestamps
    const skillsWithTimestamps = skillsData.map((skill) => ({
      ...skill,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert skills
    const result = await skillsCollection.insertMany(skillsWithTimestamps);

    console.log(`✅ ${result.insertedCount} skills inserted successfully.`);

    // Create useful indexes
    await skillsCollection.createIndex({
      category: 1,
      order: 1,
    });

    await skillsCollection.createIndex({
      isActive: 1,
    });

    console.log("✅ Skills indexes created.");

    console.log("🎉 Skills seed completed successfully.");
  } catch (error) {
    console.error("❌ Skills seed failed:", error);

    process.exitCode = 1;
  } finally {
    await disconnectFromMongoDB();
  }
};

seedSkills();
