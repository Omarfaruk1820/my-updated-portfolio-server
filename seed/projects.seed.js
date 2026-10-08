import "dotenv/config";
import { MongoClient } from "mongodb";

/* =========================================================
   ENVIRONMENT
========================================================= */

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

/* =========================================================
   MONGODB CONNECTION
========================================================= */

const encodedUser = encodeURIComponent(user);
const encodedPassword = encodeURIComponent(password);

const uri = `mongodb+srv://${encodedUser}:${encodedPassword}@cluster0.g29mryf.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri);

/* =========================================================
   PROJECT DATA
========================================================= */

const projects = [
  {
    title: "Biscuit Shop",

    slug: "biscuit-shop",

    shortDescription:
      "A responsive e-commerce website for browsing and purchasing biscuit products.",

    description:
      "A responsive e-commerce website for browsing and purchasing biscuit products with a clean and user-friendly shopping experience.",

    image: "",

    category: "E-Commerce",

    featured: true,

    technologies: [
      "React",
      "JavaScript",
      "Tailwind CSS",
      "DaisyUI",
      "Firebase",
    ],

    features: [
      "Responsive user interface",
      "Product browsing",
      "Firebase authentication",
      "E-commerce shopping experience",
    ],

    liveUrl: "https://biscuit-shop-kumarkhali.web.app",

    githubClient: "",

    githubServer: "",

    order: 1,

    status: "published",
  },

  {
    title: "School Reunion",

    slug: "school-reunion",

    shortDescription:
      "A school reunion platform with authentication and a responsive user experience.",

    description:
      "A responsive school reunion platform designed to provide users with an organized and engaging experience for connecting and participating in reunion activities.",

    image: "",

    category: "Web Application",

    featured: true,

    technologies: [
      "React",
      "JavaScript",
      "Tailwind CSS",
      "Firebase Authentication",
    ],

    features: [
      "Responsive design",
      "User authentication",
      "Firebase authentication",
      "School reunion experience",
    ],

    liveUrl: "https://school-reunion-auth-client.web.app",

    githubClient: "",

    githubServer: "",

    order: 2,

    status: "published",
  },

  {
    title: "Smart Phone Online Shop",

    slug: "smart-phone-online-shop",

    shortDescription: "A modern online smartphone shopping platform.",

    description:
      "A full-stack smartphone e-commerce platform designed with a responsive interface and organized product management experience.",

    image: "",

    category: "E-Commerce",

    featured: true,

    technologies: [
      "React",
      "React Router",
      "Tailwind CSS",
      "DaisyUI",
      "Firebase",
      "Node.js",
      "Express.js",
      "MongoDB",
    ],

    features: [
      "Responsive user interface",
      "Product browsing",
      "User authentication",
      "Shopping experience",
      "Admin functionality",
    ],

    liveUrl: "",

    githubClient: "https://github.com/Omarfaruk1820/Smart-Phone-Online-Shop",

    githubServer: "",

    order: 3,

    status: "published",
  },

  {
    title: "Online Event Management",

    slug: "online-event-management",

    shortDescription:
      "An online event management platform for managing events and providing users with an organized event experience.",

    description:
      "An online event management platform designed to help users manage and interact with events through a responsive and organized web application.",

    image: "",

    category: "Event Management",

    featured: true,

    technologies: ["React", "Node.js", "Express.js", "MongoDB", "Tailwind CSS"],

    features: [
      "Responsive user interface",
      "Event management",
      "User-friendly event experience",
      "Organized event information",
    ],

    liveUrl: "",

    githubClient: "https://github.com/Omarfaruk1820/A-online-event-management",

    githubServer: "",

    order: 4,

    status: "published",
  },

  {
    title: "Online News Portal",

    slug: "online-news-portal",

    shortDescription:
      "A responsive online news portal for publishing, browsing, and organizing news content.",

    description:
      "A responsive online news portal designed for publishing, browsing, and organizing news content through a modern web interface.",

    image: "",

    category: "News / Web Application",

    featured: true,

    technologies: ["React", "Node.js", "Express.js", "MongoDB"],

    features: [
      "Responsive news interface",
      "News browsing",
      "News content organization",
      "Modern web application experience",
    ],

    liveUrl: "",

    githubClient: "",

    githubServer: "",

    order: 5,

    status: "published",
  },
];

/* =========================================================
   SEED FUNCTION
========================================================= */

const seedProjects = async () => {
  try {
    console.log("🌱 Starting projects seed...");

    await client.connect();

    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    const collection = db.collection("projects");

    /* -----------------------------------------------------
       UNIQUE SLUG INDEX
    ----------------------------------------------------- */

    await collection.createIndex(
      { slug: 1 },
      {
        unique: true,
      },
    );

    console.log("✅ Project slug index is ready");

    /* -----------------------------------------------------
       BULK UPSERT
    ----------------------------------------------------- */

    const now = new Date();

    const operations = projects.map((project) => ({
      updateOne: {
        filter: {
          slug: project.slug,
        },

        update: {
          $set: {
            ...project,
            updatedAt: now,
          },

          $setOnInsert: {
            createdAt: now,
          },
        },

        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations);

    /* -----------------------------------------------------
       RESULT
    ----------------------------------------------------- */

    console.log("========================================");
    console.log("🌱 Projects seed completed successfully");
    console.log(`📊 Matched: ${result.matchedCount}`);
    console.log(`🆕 Inserted: ${result.upsertedCount}`);
    console.log(`🔄 Modified: ${result.modifiedCount}`);
    console.log("========================================");
  } catch (error) {
    console.error("❌ Projects seed failed:", error);

    process.exitCode = 1;
  } finally {
    await client.close();

    console.log("🔌 MongoDB connection closed");
  }
};

/* =========================================================
   RUN SEED
========================================================= */

seedProjects();
