import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import verifyToken from "../middleware/verifyToken.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

const COLLECTION_NAME = "services";
const ALLOWED_STATUS = ["published", "draft", "archived"];

const MAX_TITLE_LENGTH = 150;
const MAX_SLUG_LENGTH = 160;
const MAX_SHORT_DESCRIPTION_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 20000;
const MAX_ICON_LENGTH = 100;
const MAX_ARRAY_ITEMS = 50;
const MAX_ARRAY_ITEM_LENGTH = 200;

/* =========================================================
   COLLECTION
========================================================= */

const getServicesCollection = () => {
  return getDB().collection(COLLECTION_NAME);
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeSlug = (value) => {
  return normalizeString(value).toLowerCase();
};

const isValidSlug = (value) => {
  return (
    typeof value === "string" &&
    value.length <= MAX_SLUG_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
};

const isValidObjectId = (value) => {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value) &&
    ObjectId.isValid(value)
  );
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const validateStringArray = (value) => {
  return (
    Array.isArray(value) &&
    value.length <= MAX_ARRAY_ITEMS &&
    value.every(
      (item) =>
        typeof item === "string" && item.trim().length <= MAX_ARRAY_ITEM_LENGTH,
    )
  );
};

const normalizeStringArray = (value) => {
  return value.map((item) => item.trim()).filter(Boolean);
};

const parseBoolean = (value) => {
  return typeof value === "boolean" ? value : null;
};

const parseOrder = (value) => {
  if (
    typeof value !== "number" &&
    !(typeof value === "string" && value.trim() !== "")
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const sendValidationError = (res, message) => {
  return res.status(400).json({
    success: false,
    message,
  });
};

const handleServiceError = (res, error, operation) => {
  console.error(`❌ ${operation} error:`, error);

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A service with this slug already exists.",
    });
  }

  return res.status(500).json({
    success: false,
    message: `Failed to ${operation.toLowerCase()}.`,
  });
};

/* =========================================================
   GET ALL PUBLISHED SERVICES
   GET /api/services
   Public route
========================================================= */

router.get("/", async (req, res) => {
  try {
    const services = await getServicesCollection()
      .find({ status: "published" })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully.",
      count: services.length,
      data: services,
    });
  } catch (error) {
    return handleServiceError(res, error, "Fetch services");
  }
});

/* =========================================================
   GET SINGLE PUBLISHED SERVICE
   GET /api/services/:id
   Public route
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid service ID.");
    }

    const service = await getServicesCollection().findOne({
      _id: new ObjectId(id),
      status: "published",
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service fetched successfully.",
      data: service,
    });
  } catch (error) {
    return handleServiceError(res, error, "Fetch service");
  }
});

/* =========================================================
   CREATE SERVICE
   POST /api/services
   Admin only
========================================================= */

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return sendValidationError(res, "A valid service object is required.");
    }

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

    const normalizedTitle = normalizeString(title);
    const normalizedSlug = normalizeSlug(slug);
    const normalizedShortDescription = normalizeString(shortDescription);
    const normalizedDescription = normalizeString(description);

    /* REQUIRED FIELDS */

    if (
      !normalizedTitle ||
      !normalizedSlug ||
      !normalizedShortDescription ||
      !normalizedDescription
    ) {
      return sendValidationError(
        res,
        "Title, slug, shortDescription, and description are required.",
      );
    }

    if (normalizedTitle.length > MAX_TITLE_LENGTH) {
      return sendValidationError(
        res,
        `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
      );
    }

    if (!isValidSlug(normalizedSlug)) {
      return sendValidationError(
        res,
        "Slug must contain lowercase letters, numbers, and single hyphens only.",
      );
    }

    if (normalizedShortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH) {
      return sendValidationError(
        res,
        `Short description cannot exceed ${MAX_SHORT_DESCRIPTION_LENGTH} characters.`,
      );
    }

    if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return sendValidationError(
        res,
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }

    /* ICON */

    if (typeof icon !== "undefined" && typeof icon !== "string") {
      return sendValidationError(res, "Icon must be a string.");
    }

    const normalizedIcon = normalizeString(icon) || "FiLayers";

    if (normalizedIcon.length > MAX_ICON_LENGTH) {
      return sendValidationError(
        res,
        `Icon cannot exceed ${MAX_ICON_LENGTH} characters.`,
      );
    }

    /* ARRAY FIELDS */

    if (typeof features !== "undefined" && !validateStringArray(features)) {
      return sendValidationError(
        res,
        "Features must be an array of valid strings.",
      );
    }

    if (
      typeof technologies !== "undefined" &&
      !validateStringArray(technologies)
    ) {
      return sendValidationError(
        res,
        "Technologies must be an array of valid strings.",
      );
    }

    /* BOOLEAN */

    const normalizedFeatured =
      typeof featured === "undefined" ? false : parseBoolean(featured);

    if (normalizedFeatured === null) {
      return sendValidationError(res, "Featured must be a boolean value.");
    }

    /* ORDER */

    const normalizedOrder =
      typeof order === "undefined" ? 0 : parseOrder(order);

    if (normalizedOrder === null) {
      return sendValidationError(
        res,
        "Order must be a non-negative safe integer.",
      );
    }

    /* STATUS */

    const normalizedStatus =
      typeof status === "undefined" ? "published" : status;

    if (!ALLOWED_STATUS.includes(normalizedStatus)) {
      return sendValidationError(
        res,
        "Status must be published, draft, or archived.",
      );
    }

    /* DUPLICATE SLUG CHECK */

    const collection = getServicesCollection();

    const existingService = await collection.findOne({
      slug: normalizedSlug,
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists.",
      });
    }

    /* CREATE DOCUMENT */

    const now = new Date();

    const service = {
      title: normalizedTitle,
      slug: normalizedSlug,
      shortDescription: normalizedShortDescription,
      description: normalizedDescription,
      icon: normalizedIcon,
      features: normalizeStringArray(features ?? []),
      technologies: normalizeStringArray(technologies ?? []),
      featured: normalizedFeatured,
      order: normalizedOrder,
      status: normalizedStatus,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(service);

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: {
        _id: result.insertedId,
        ...service,
      },
    });
  } catch (error) {
    return handleServiceError(res, error, "Create service");
  }
});

/* =========================================================
   UPDATE SERVICE
   PATCH /api/services/:id
   Admin only
========================================================= */

router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid service ID.");
    }

    if (!isPlainObject(req.body)) {
      return sendValidationError(res, "A valid update object is required.");
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
      return sendValidationError(res, "No valid fields provided for update.");
    }

    /* STRING FIELDS */

    if (updates.title !== undefined) {
      updates.title = normalizeString(updates.title);

      if (!updates.title || updates.title.length > MAX_TITLE_LENGTH) {
        return sendValidationError(
          res,
          `Title is required and cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        );
      }
    }

    if (updates.slug !== undefined) {
      updates.slug = normalizeSlug(updates.slug);

      if (!isValidSlug(updates.slug)) {
        return sendValidationError(
          res,
          "Slug must contain lowercase letters, numbers, and single hyphens only.",
        );
      }
    }

    if (updates.shortDescription !== undefined) {
      updates.shortDescription = normalizeString(updates.shortDescription);

      if (
        !updates.shortDescription ||
        updates.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH
      ) {
        return sendValidationError(
          res,
          `Short description is required and cannot exceed ${MAX_SHORT_DESCRIPTION_LENGTH} characters.`,
        );
      }
    }

    if (updates.description !== undefined) {
      updates.description = normalizeString(updates.description);

      if (
        !updates.description ||
        updates.description.length > MAX_DESCRIPTION_LENGTH
      ) {
        return sendValidationError(
          res,
          `Description is required and cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        );
      }
    }

    if (updates.icon !== undefined) {
      if (typeof updates.icon !== "string") {
        return sendValidationError(res, "Icon must be a string.");
      }

      updates.icon = normalizeString(updates.icon);

      if (updates.icon.length > MAX_ICON_LENGTH) {
        return sendValidationError(
          res,
          `Icon cannot exceed ${MAX_ICON_LENGTH} characters.`,
        );
      }
    }

    /* ARRAY FIELDS */

    for (const field of ["features", "technologies"]) {
      if (updates[field] !== undefined) {
        if (!validateStringArray(updates[field])) {
          return sendValidationError(
            res,
            `${field} must be an array of valid strings.`,
          );
        }

        updates[field] = normalizeStringArray(updates[field]);
      }
    }

    /* BOOLEAN */

    if (updates.featured !== undefined) {
      const parsedFeatured = parseBoolean(updates.featured);

      if (parsedFeatured === null) {
        return sendValidationError(res, "Featured must be a boolean value.");
      }

      updates.featured = parsedFeatured;
    }

    /* ORDER */

    if (updates.order !== undefined) {
      const parsedOrder = parseOrder(updates.order);

      if (parsedOrder === null) {
        return sendValidationError(
          res,
          "Order must be a non-negative safe integer.",
        );
      }

      updates.order = parsedOrder;
    }

    /* STATUS */

    if (
      updates.status !== undefined &&
      !ALLOWED_STATUS.includes(updates.status)
    ) {
      return sendValidationError(
        res,
        "Status must be published, draft, or archived.",
      );
    }

    /* CHECK EXISTING DOCUMENT */

    const collection = getServicesCollection();
    const serviceId = new ObjectId(id);

    const existingService = await collection.findOne({
      _id: serviceId,
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    /* DUPLICATE SLUG CHECK */

    if (updates.slug !== undefined && updates.slug !== existingService.slug) {
      const duplicateService = await collection.findOne({
        slug: updates.slug,
        _id: { $ne: serviceId },
      });

      if (duplicateService) {
        return res.status(409).json({
          success: false,
          message: "A service with this slug already exists.",
        });
      }
    }

    /* UPDATE DOCUMENT */

    updates.updatedAt = new Date();

    await collection.updateOne({ _id: serviceId }, { $set: updates });

    const updatedService = await collection.findOne({
      _id: serviceId,
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: updatedService,
    });
  } catch (error) {
    return handleServiceError(res, error, "Update service");
  }
});

/* =========================================================
   DELETE SERVICE
   DELETE /api/services/:id
   Admin only
========================================================= */

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid service ID.");
    }

    const result = await getServicesCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
      data: {
        id,
      },
    });
  } catch (error) {
    return handleServiceError(res, error, "Delete service");
  }
});

export default router;
