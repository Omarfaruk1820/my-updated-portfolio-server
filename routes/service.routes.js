import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";

const router = express.Router();

const COLLECTION_NAME = "services";

/* =========================================================
   HELPERS
========================================================= */

const getServicesCollection = () => {
  const db = getDB();

  return db.collection(COLLECTION_NAME);
};

const isValidObjectId = (id) => {
  return ObjectId.isValid(id);
};

/* =========================================================
   GET ALL SERVICES
   GET /api/services
========================================================= */

router.get("/", async (req, res) => {
  try {
    const collection = getServicesCollection();

    const services = await collection
      .find({
        status: "published",
      })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Services fetched successfully.",
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("❌ Get services error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
    });
  }
});

/* =========================================================
   GET SINGLE SERVICE
   GET /api/services/:id
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const collection = getServicesCollection();

    const service = await collection.findOne({
      _id: new ObjectId(id),
      status: "published",
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service fetched successfully.",
      data: service,
    });
  } catch (error) {
    console.error("❌ Get service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch service.",
    });
  }
});

/* =========================================================
   CREATE SERVICE
   POST /api/services
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      description,
      icon,
      features,
      technologies,
      featured,
      order,
      status,
    } = req.body;

    /* -----------------------------------------------------
       REQUIRED FIELD VALIDATION
    ----------------------------------------------------- */

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service title is required.",
      });
    }

    if (!slug?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service slug is required.",
      });
    }

    if (!shortDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Short description is required.",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service description is required.",
      });
    }

    /* -----------------------------------------------------
       TYPE VALIDATION
    ----------------------------------------------------- */

    if (features !== undefined && !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: "Features must be an array.",
      });
    }

    if (technologies !== undefined && !Array.isArray(technologies)) {
      return res.status(400).json({
        success: false,
        message: "Technologies must be an array.",
      });
    }

    /* -----------------------------------------------------
       NORMALIZE DATA
    ----------------------------------------------------- */

    const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");

    const collection = getServicesCollection();

    /* -----------------------------------------------------
       DUPLICATE SLUG CHECK
    ----------------------------------------------------- */

    const existingService = await collection.findOne({
      slug: normalizedSlug,
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists.",
      });
    }

    /* -----------------------------------------------------
       CREATE SERVICE DOCUMENT
    ----------------------------------------------------- */

    const now = new Date();

    const service = {
      title: title.trim(),

      slug: normalizedSlug,

      shortDescription: shortDescription.trim(),

      description: description.trim(),

      icon: typeof icon === "string" ? icon.trim() : "FiLayers",

      features: Array.isArray(features)
        ? features
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],

      technologies: Array.isArray(technologies)
        ? technologies
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],

      featured: Boolean(featured),

      order: Number.isFinite(Number(order)) ? Number(order) : 0,

      status:
        status === "draft" || status === "archived" ? status : "published",

      createdAt: now,

      updatedAt: now,
    };

    const result = await collection.insertOne(service);

    const createdService = await collection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: createdService,
    });
  } catch (error) {
    console.error("❌ Create service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create service.",
    });
  }
});

/* =========================================================
   UPDATE SERVICE
   PATCH /api/services/:id
========================================================= */

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const allowedFields = [
      "title",
      "slug",
      "shortDescription",
      "description",
      "icon",
      "features",
      "technologies",
      "featured",
      "order",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    /* -----------------------------------------------------
       STRING NORMALIZATION
    ----------------------------------------------------- */

    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Service title must be a valid string.",
        });
      }

      updates.title = updates.title.trim();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Service slug must be a valid string.",
        });
      }

      updates.slug = updates.slug.trim().toLowerCase().replace(/\s+/g, "-");
    }

    if (updates.shortDescription !== undefined) {
      if (
        typeof updates.shortDescription !== "string" ||
        !updates.shortDescription.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Short description must be a valid string.",
        });
      }

      updates.shortDescription = updates.shortDescription.trim();
    }

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        !updates.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a valid string.",
        });
      }

      updates.description = updates.description.trim();
    }

    if (updates.icon !== undefined) {
      if (typeof updates.icon !== "string") {
        return res.status(400).json({
          success: false,
          message: "Icon must be a string.",
        });
      }

      updates.icon = updates.icon.trim();
    }

    /* -----------------------------------------------------
       ARRAY VALIDATION
    ----------------------------------------------------- */

    if (updates.features !== undefined) {
      if (!Array.isArray(updates.features)) {
        return res.status(400).json({
          success: false,
          message: "Features must be an array.",
        });
      }

      updates.features = updates.features
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (updates.technologies !== undefined) {
      if (!Array.isArray(updates.technologies)) {
        return res.status(400).json({
          success: false,
          message: "Technologies must be an array.",
        });
      }

      updates.technologies = updates.technologies
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    /* -----------------------------------------------------
       BOOLEAN
    ----------------------------------------------------- */

    if (updates.featured !== undefined) {
      if (typeof updates.featured !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Featured must be a boolean.",
        });
      }
    }

    /* -----------------------------------------------------
       ORDER
    ----------------------------------------------------- */

    if (updates.order !== undefined) {
      const parsedOrder = Number(updates.order);

      if (!Number.isFinite(parsedOrder)) {
        return res.status(400).json({
          success: false,
          message: "Order must be a valid number.",
        });
      }

      updates.order = parsedOrder;
    }

    /* -----------------------------------------------------
       STATUS
    ----------------------------------------------------- */

    if (updates.status !== undefined) {
      const allowedStatuses = ["published", "draft", "archived"];

      if (!allowedStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service status.",
        });
      }
    }

    /* -----------------------------------------------------
       DUPLICATE SLUG CHECK
    ----------------------------------------------------- */

    const collection = getServicesCollection();

    if (updates.slug) {
      const existingService = await collection.findOne({
        slug: updates.slug,
        _id: {
          $ne: new ObjectId(id),
        },
      });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message: "A service with this slug already exists.",
        });
      }
    }

    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    updates.updatedAt = new Date();

    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updates,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const updatedService = await collection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: updatedService,
    });
  } catch (error) {
    console.error("❌ Update service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service.",
    });
  }
});

/* =========================================================
   DELETE SERVICE
   DELETE /api/services/:id
========================================================= */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const collection = getServicesCollection();

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
      data: {
        id,
      },
    });
  } catch (error) {
    console.error("❌ Delete service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete service.",
    });
  }
});

export default router;
