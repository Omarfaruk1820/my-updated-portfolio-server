import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";

const router = express.Router();

/* =========================================================
   CONSTANTS
========================================================= */

const COLLECTION_NAME = "projects";

const ALLOWED_STATUS = ["draft", "published"];

/* =========================================================
   COLLECTION
========================================================= */

const getProjectsCollection = () => {
  return getDB().collection(COLLECTION_NAME);
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeSlug = (value) => {
  return normalizeString(value).toLowerCase();
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseOrder = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/* =========================================================
   GET ALL PROJECTS
   GET /api/projects
========================================================= */

router.get("/", async (req, res) => {
  try {
    const collection = getProjectsCollection();

    const projects = await collection
      .find({
        status: "published",
      })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: projects,
    });
  } catch (error) {
    console.error("❌ Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects.",
    });
  }
});

/* =========================================================
   GET SINGLE PROJECT
   GET /api/projects/:id
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await getProjectsCollection().findOne({
      _id: new ObjectId(id),
      status: "published",
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project fetched successfully.",
      data: project,
    });
  } catch (error) {
    console.error("❌ Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project.",
    });
  }
});

/* =========================================================
   CREATE PROJECT
   POST /api/projects
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      description,
      image,
      category,
      technologies,
      features,
      liveUrl,
      githubClient,
      githubServer,
      featured,
      order,
      status,
    } = req.body;

    /* -----------------------------------------------------
       REQUIRED FIELDS
    ----------------------------------------------------- */

    const normalizedTitle = normalizeString(title);
    const normalizedSlug = normalizeSlug(slug);
    const normalizedShortDescription = normalizeString(shortDescription);
    const normalizedDescription = normalizeString(description);

    if (
      !normalizedTitle ||
      !normalizedSlug ||
      !normalizedShortDescription ||
      !normalizedDescription
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, slug, shortDescription, and description are required.",
      });
    }

    /* -----------------------------------------------------
       STATUS
    ----------------------------------------------------- */

    const normalizedStatus = status === "draft" ? "draft" : "published";

    /* -----------------------------------------------------
       DUPLICATE SLUG CHECK
    ----------------------------------------------------- */

    const collection = getProjectsCollection();

    const existingProject = await collection.findOne({
      slug: normalizedSlug,
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists.",
      });
    }

    /* -----------------------------------------------------
       PROJECT DOCUMENT
    ----------------------------------------------------- */

    const now = new Date();

    const project = {
      title: normalizedTitle,

      slug: normalizedSlug,

      shortDescription: normalizedShortDescription,

      description: normalizedDescription,

      image: normalizeString(image),

      category: normalizeString(category) || "Web Development",

      technologies: normalizeStringArray(technologies),

      features: normalizeStringArray(features),

      liveUrl: normalizeString(liveUrl),

      githubClient: normalizeString(githubClient),

      githubServer: normalizeString(githubServer),

      featured: Boolean(featured),

      order: parseOrder(order),

      status: normalizedStatus,

      createdAt: now,

      updatedAt: now,
    };

    /* -----------------------------------------------------
       INSERT
    ----------------------------------------------------- */

    const result = await collection.insertOne(project);

    const createdProject = {
      _id: result.insertedId,
      ...project,
    };

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: createdProject,
    });
  } catch (error) {
    console.error("❌ Create project error:", error);

    /* MongoDB duplicate key */
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create project.",
    });
  }
});

/* =========================================================
   UPDATE PROJECT
   PATCH /api/projects/:id
========================================================= */

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /* -----------------------------------------------------
       VALIDATE ID
    ----------------------------------------------------- */

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    /* -----------------------------------------------------
       ALLOWED FIELDS
    ----------------------------------------------------- */

    const allowedFields = [
      "title",
      "slug",
      "shortDescription",
      "description",
      "image",
      "category",
      "technologies",
      "features",
      "liveUrl",
      "githubClient",
      "githubServer",
      "featured",
      "order",
      "status",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    /* -----------------------------------------------------
       EMPTY UPDATE
    ----------------------------------------------------- */

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    /* -----------------------------------------------------
       STRING FIELDS
    ----------------------------------------------------- */

    if (updateData.title !== undefined) {
      updateData.title = normalizeString(updateData.title);

      if (!updateData.title) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }
    }

    if (updateData.slug !== undefined) {
      updateData.slug = normalizeSlug(updateData.slug);

      if (!updateData.slug) {
        return res.status(400).json({
          success: false,
          message: "Slug cannot be empty.",
        });
      }

      const existingProject = await getProjectsCollection().findOne({
        slug: updateData.slug,
        _id: {
          $ne: new ObjectId(id),
        },
      });

      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: "A project with this slug already exists.",
        });
      }
    }

    if (updateData.shortDescription !== undefined) {
      updateData.shortDescription = normalizeString(
        updateData.shortDescription,
      );

      if (!updateData.shortDescription) {
        return res.status(400).json({
          success: false,
          message: "Short description cannot be empty.",
        });
      }
    }

    if (updateData.description !== undefined) {
      updateData.description = normalizeString(updateData.description);

      if (!updateData.description) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty.",
        });
      }
    }

    if (updateData.image !== undefined) {
      updateData.image = normalizeString(updateData.image);
    }

    if (updateData.category !== undefined) {
      updateData.category = normalizeString(updateData.category);

      if (!updateData.category) {
        updateData.category = "Web Development";
      }
    }

    if (updateData.liveUrl !== undefined) {
      updateData.liveUrl = normalizeString(updateData.liveUrl);
    }

    if (updateData.githubClient !== undefined) {
      updateData.githubClient = normalizeString(updateData.githubClient);
    }

    if (updateData.githubServer !== undefined) {
      updateData.githubServer = normalizeString(updateData.githubServer);
    }

    /* -----------------------------------------------------
       ARRAY FIELDS
    ----------------------------------------------------- */

    if (updateData.technologies !== undefined) {
      if (!Array.isArray(updateData.technologies)) {
        return res.status(400).json({
          success: false,
          message: "Technologies must be an array.",
        });
      }

      updateData.technologies = normalizeStringArray(updateData.technologies);
    }

    if (updateData.features !== undefined) {
      if (!Array.isArray(updateData.features)) {
        return res.status(400).json({
          success: false,
          message: "Features must be an array.",
        });
      }

      updateData.features = normalizeStringArray(updateData.features);
    }

    /* -----------------------------------------------------
       BOOLEAN FIELD
    ----------------------------------------------------- */

    if (updateData.featured !== undefined) {
      updateData.featured = Boolean(updateData.featured);
    }

    /* -----------------------------------------------------
       ORDER
    ----------------------------------------------------- */

    if (updateData.order !== undefined) {
      const parsedOrder = Number(updateData.order);

      if (!Number.isFinite(parsedOrder)) {
        return res.status(400).json({
          success: false,
          message: "Order must be a valid number.",
        });
      }

      updateData.order = parsedOrder;
    }

    /* -----------------------------------------------------
       STATUS
    ----------------------------------------------------- */

    if (updateData.status !== undefined) {
      if (!ALLOWED_STATUS.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either draft or published.",
        });
      }
    }

    /* -----------------------------------------------------
       UPDATED TIMESTAMP
    ----------------------------------------------------- */

    updateData.updatedAt = new Date();

    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    const collection = getProjectsCollection();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
      },
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("❌ Update project error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update project.",
    });
  }
});

/* =========================================================
   DELETE PROJECT
   DELETE /api/projects/:id
========================================================= */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /* -----------------------------------------------------
       VALIDATE ID
    ----------------------------------------------------- */

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    /* -----------------------------------------------------
       DELETE
    ----------------------------------------------------- */

    const result = await getProjectsCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project.",
    });
  }
});

/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router;
