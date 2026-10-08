import "dotenv/config";

import { MongoClient } from "mongodb";

/* =========================================================
   ENVIRONMENT CONFIGURATION
========================================================= */

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

if (!DB_USER) {
  throw new Error("❌ DB_USER is not defined in .env");
}

if (!DB_PASS) {
  throw new Error("❌ DB_PASS is not defined in .env");
}

if (!DB_NAME) {
  throw new Error("❌ DB_NAME is not defined in .env");
}

/* =========================================================
   MONGODB CONFIGURATION
========================================================= */

const encodedUser = encodeURIComponent(DB_USER);
const encodedPassword = encodeURIComponent(DB_PASS);

const MONGODB_URI = `mongodb+srv://${encodedUser}:${encodedPassword}@cluster0.g29mryf.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(MONGODB_URI);

/* =========================================================
   SERVICES DATA
========================================================= */

const services = [
  {
    title: "Frontend Development",

    slug: "frontend-development",

    shortDescription:
      "Modern, responsive, and high-performance frontend applications built with React.",

    description:
      "I build professional frontend applications with clean component architecture, responsive layouts, intuitive user experiences, and maintainable React code. Every interface is designed to work smoothly across mobile, tablet, and desktop devices.",

    icon: "FiLayout",

    features: [
      "Responsive and mobile-first interfaces",
      "Reusable React component architecture",
      "Modern UI development",
      "Interactive animations and micro-interactions",
      "Performance optimization",
      "Accessible user interfaces",
      "Clean and maintainable code",
    ],

    technologies: [
      "React",
      "JavaScript",
      "Tailwind CSS",
      "DaisyUI",
      "Framer Motion",
      "React Router",
    ],

    featured: true,

    order: 1,

    status: "published",
  },

  {
    title: "Backend Development",

    slug: "backend-development",

    shortDescription:
      "Scalable and maintainable backend systems using Node.js and Express.js.",

    description:
      "I develop secure and maintainable backend applications using Node.js and Express.js. From RESTful APIs and business logic to database integration and error handling, I focus on building reliable server-side systems that are easy to extend.",

    icon: "FiServer",

    features: [
      "RESTful API development",
      "Express.js server architecture",
      "Business logic implementation",
      "Request validation",
      "Error handling",
      "API security best practices",
      "Production-ready server structure",
    ],

    technologies: [
      "Node.js",
      "Express.js",
      "REST API",
      "JavaScript",
      "MongoDB",
      "Dotenv",
    ],

    featured: true,

    order: 2,

    status: "published",
  },

  {
    title: "Database Solutions",

    slug: "database-solutions",

    shortDescription:
      "Reliable MongoDB database solutions designed for structured and scalable applications.",

    description:
      "I design and integrate MongoDB databases for modern web applications. My approach focuses on clean data structures, efficient queries, appropriate indexing, and maintainable database operations.",

    icon: "FiDatabase",

    features: [
      "MongoDB database integration",
      "Collection and document design",
      "CRUD operations",
      "Query optimization",
      "Database indexing",
      "Data validation",
      "Scalable database architecture",
    ],

    technologies: [
      "MongoDB",
      "MongoDB Atlas",
      "Node.js",
      "Express.js",
      "JavaScript",
    ],

    featured: true,

    order: 3,

    status: "published",
  },

  {
    title: "Authentication & Security",

    slug: "authentication-security",

    shortDescription:
      "Secure authentication and authorization solutions for modern web applications.",

    description:
      "I implement authentication and authorization systems that protect application resources and provide a secure user experience. Security is considered throughout the application architecture rather than being added as an afterthought.",

    icon: "FiLock",

    features: [
      "User authentication",
      "Authorization and protected routes",
      "Role-based access control",
      "Secure password handling",
      "Protected API endpoints",
      "Input validation",
      "Security-focused application architecture",
    ],

    technologies: [
      "Firebase Authentication",
      "Node.js",
      "Express.js",
      "MongoDB",
      "REST API",
    ],

    featured: false,

    order: 4,

    status: "published",
  },

  {
    title: "API & Application Integration",

    slug: "api-application-integration",

    shortDescription:
      "Reliable REST API integration connecting frontend applications with backend services.",

    description:
      "I connect frontend applications with backend services through clean and reliable APIs. I focus on predictable request and response structures, proper error handling, loading states, and maintainable data-fetching architecture.",

    icon: "FiGitBranch",

    features: [
      "REST API integration",
      "Frontend-backend communication",
      "Axios-based API requests",
      "TanStack Query integration",
      "Error and loading state handling",
      "API response management",
      "Third-party API integration",
    ],

    technologies: [
      "REST API",
      "Axios",
      "TanStack Query",
      "React",
      "Node.js",
      "Express.js",
    ],

    featured: false,

    order: 5,

    status: "published",
  },

  {
    title: "Responsive Web Applications",

    slug: "responsive-web-applications",

    shortDescription:
      "Professional web experiences optimized for mobile, tablet, and desktop devices.",

    description:
      "I create responsive web applications that provide a consistent and intuitive experience across different screen sizes. Layout, typography, navigation, interactions, and components are carefully structured to adapt to real-world devices.",

    icon: "FiSmartphone",

    features: [
      "Mobile-first development",
      "Tablet and desktop optimization",
      "Responsive navigation",
      "Flexible component layouts",
      "Cross-device UI consistency",
      "Touch-friendly interactions",
      "Responsive performance optimization",
    ],

    technologies: [
      "React",
      "Tailwind CSS",
      "DaisyUI",
      "Framer Motion",
      "CSS",
      "JavaScript",
    ],

    featured: false,

    order: 6,

    status: "published",
  },
  {
    title: "Full-Stack Web Development",

    slug: "full-stack-web-development",

    shortDescription:
      "Complete end-to-end web applications built with modern MERN stack technologies.",

    description:
      "I build complete full-stack web applications from frontend interfaces to backend APIs and database integration. I focus on creating well-structured applications where the client, server, API, authentication, and database work together reliably.",

    icon: "FiLayers",

    features: [
      "Complete frontend and backend development",
      "MERN stack application architecture",
      "RESTful API development",
      "MongoDB database integration",
      "Authentication and authorization",
      "Reusable and maintainable architecture",
      "Responsive user experience",
      "Production-ready application structure",
    ],

    technologies: [
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Tailwind CSS",
      "TanStack Query",
      "Axios",
    ],

    featured: true,

    order: 7,

    status: "published",
  },
  {
    title: "Deployment & Maintenance",

    slug: "deployment-maintenance",

    shortDescription:
      "Reliable deployment, configuration, optimization, and ongoing maintenance for web applications.",

    description:
      "I help prepare web applications for production by configuring environments, deployment settings, API connections, and application infrastructure. I also focus on maintaining existing applications, fixing issues, improving performance, and keeping the codebase reliable over time.",

    icon: "FiSettings",

    features: [
      "Production deployment preparation",
      "Environment configuration",
      "Frontend and backend deployment",
      "API and database configuration",
      "Production error monitoring",
      "Bug fixing and maintenance",
      "Performance improvements",
      "Application updates and optimization",
    ],

    technologies: [
      "Node.js",
      "Express.js",
      "MongoDB Atlas",
      "Vercel",
      "Git",
      "GitHub",
      "Environment Variables",
    ],

    featured: false,

    order: 8,

    status: "published",
  },
];

/* =========================================================
   VALIDATION
========================================================= */

const validateServices = (serviceList) => {
  if (!Array.isArray(serviceList) || serviceList.length === 0) {
    throw new Error("❌ Services seed data is empty.");
  }

  const slugs = new Set();

  serviceList.forEach((service, index) => {
    const position = index + 1;

    if (!service.title?.trim()) {
      throw new Error(`❌ Service #${position}: title is required.`);
    }

    if (!service.slug?.trim()) {
      throw new Error(`❌ Service #${position}: slug is required.`);
    }

    if (slugs.has(service.slug)) {
      throw new Error(`❌ Duplicate service slug found: ${service.slug}`);
    }

    slugs.add(service.slug);

    if (!service.shortDescription?.trim()) {
      throw new Error(`❌ Service #${position}: shortDescription is required.`);
    }

    if (!service.description?.trim()) {
      throw new Error(`❌ Service #${position}: description is required.`);
    }

    if (!service.icon?.trim()) {
      throw new Error(`❌ Service #${position}: icon is required.`);
    }

    if (!Array.isArray(service.features)) {
      throw new Error(`❌ Service #${position}: features must be an array.`);
    }

    if (!Array.isArray(service.technologies)) {
      throw new Error(
        `❌ Service #${position}: technologies must be an array.`,
      );
    }

    if (!Number.isInteger(service.order)) {
      throw new Error(`❌ Service #${position}: order must be an integer.`);
    }

    const allowedStatuses = ["published", "draft", "archived"];

    if (!allowedStatuses.includes(service.status)) {
      throw new Error(`❌ Service #${position}: invalid status.`);
    }

    if (typeof service.featured !== "boolean") {
      throw new Error(`❌ Service #${position}: featured must be boolean.`);
    }
  });
};

/* =========================================================
   SEED SERVICES
========================================================= */

const seedServices = async () => {
  console.log("🌱 Starting services seed...");

  try {
    /* -----------------------------------------------------
       VALIDATE SEED DATA
    ----------------------------------------------------- */

    validateServices(services);

    /* -----------------------------------------------------
       CONNECT TO MONGODB
    ----------------------------------------------------- */

    await client.connect();

    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);

    const collection = db.collection("services");

    /* -----------------------------------------------------
       CREATE INDEXES
    ----------------------------------------------------- */

    await collection.createIndex(
      { slug: 1 },
      {
        unique: true,
        name: "services_slug_unique",
      },
    );

    await collection.createIndex(
      { status: 1, order: 1 },
      {
        name: "services_status_order",
      },
    );

    await collection.createIndex(
      { featured: 1, order: 1 },
      {
        name: "services_featured_order",
      },
    );

    console.log("✅ Service indexes are ready");

    /* -----------------------------------------------------
       UPSERT SERVICES
    ----------------------------------------------------- */

    let inserted = 0;
    let modified = 0;
    let unchanged = 0;

    for (const service of services) {
      const now = new Date();

      const existingService = await collection.findOne({
        slug: service.slug,
      });

      if (!existingService) {
        await collection.insertOne({
          ...service,

          createdAt: now,
          updatedAt: now,
        });

        inserted++;

        continue;
      }

      await collection.updateOne(
        {
          _id: existingService._id,
        },
        {
          $set: {
            ...service,
            updatedAt: now,
          },

          $setOnInsert: {
            createdAt: now,
          },
        },
      );

      const hasChanges =
        JSON.stringify({
          title: existingService.title,
          slug: existingService.slug,
          shortDescription: existingService.shortDescription,
          description: existingService.description,
          icon: existingService.icon,
          features: existingService.features,
          technologies: existingService.technologies,
          featured: existingService.featured,
          order: existingService.order,
          status: existingService.status,
        }) !==
        JSON.stringify({
          title: service.title,
          slug: service.slug,
          shortDescription: service.shortDescription,
          description: service.description,
          icon: service.icon,
          features: service.features,
          technologies: service.technologies,
          featured: service.featured,
          order: service.order,
          status: service.status,
        });

      if (hasChanges) {
        modified++;
      } else {
        unchanged++;
      }
    }

    /* -----------------------------------------------------
       SUMMARY
    ----------------------------------------------------- */

    console.log("========================================");
    console.log("🌱 Services seed completed successfully");
    console.log(`📊 Total services: ${services.length}`);
    console.log(`🆕 Inserted: ${inserted}`);
    console.log(`🔄 Modified: ${modified}`);
    console.log(`⏭️ Unchanged: ${unchanged}`);
    console.log("========================================");
  } catch (error) {
    console.error("❌ Services seed failed:", error);

    process.exitCode = 1;
  } finally {
    /* -----------------------------------------------------
       CLOSE MONGODB CONNECTION
    ----------------------------------------------------- */

    await client.close();

    console.log("🔌 MongoDB connection closed");
  }
};

/* =========================================================
   RUN SEED
========================================================= */

seedServices();
