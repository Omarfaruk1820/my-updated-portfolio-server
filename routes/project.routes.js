import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import verifyToken from "../middleware/verifyToken.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

const COLLECTION_NAME = "projects";
const ALLOWED_STATUS = ["draft", "published"];

const MAX_TITLE_LENGTH = 150;
const MAX_SLUG_LENGTH = 160;
const MAX_SHORT_DESCRIPTION_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 20000;
const MAX_URL_LENGTH = 2048;
const MAX_ARRAY_ITEMS = 50;
const MAX_ARRAY_ITEM_LENGTH = 200;

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

const isValidHttpUrl = (value) => {
  if (typeof value !== "string" || value.length > MAX_URL_LENGTH) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidImageValue = (value) => {
  if (!value) {
    return true;
  }

  if (isValidHttpUrl(value)) {
    return true;
  }

  // Permit root-relative public image paths, but not protocol-relative URLs.
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\s\\]/.test(value) &&
    !/[\u0000-\u001F]/.test(value)
  );
};

const normalizeStringArray = (value) => {
  return value.map((item) => item.trim()).filter(Boolean);
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

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const sendValidationError = (res, message) => {
  return res.status(400).json({
    success: false,
    message,
  });
};

const handleProjectError = (res, error, operation) => {
  console.error(`❌ ${operation} error:`, error);

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A project with this slug already exists.",
    });
  }

  return res.status(500).json({
    success: false,
    message: `Failed to ${operation.toLowerCase()}.`,
  });
};

/* =========================================================
   GET ALL PUBLISHED PROJECTS
   GET /api/projects
   Public route
========================================================= */

router.get("/", async (req, res) => {
  try {
    const projects = await getProjectsCollection()
      .find({ status: "published" })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: projects,
    });
  } catch (error) {
    return handleProjectError(res, error, "Fetch projects");
  }
});

/* =========================================================
   GET SINGLE PUBLISHED PROJECT
   GET /api/projects/:id
   Public route
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid project ID.");
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
    return handleProjectError(res, error, "Fetch project");
  }
});

/* =========================================================
   CREATE PROJECT
   POST /api/projects
   Admin only
========================================================= */

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return sendValidationError(res, "A valid project object is required.");
    }

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

    const normalizedImage = normalizeString(image);
    const normalizedCategory = normalizeString(category) || "Web Development";
    const normalizedLiveUrl = normalizeString(liveUrl);
    const normalizedGithubClient = normalizeString(githubClient);
    const normalizedGithubServer = normalizeString(githubServer);

    if (typeof image !== "undefined" && typeof image !== "string") {
      return sendValidationError(res, "Image must be a string.");
    }

    if (!isValidImageValue(normalizedImage)) {
      return sendValidationError(
        res,
        "Image must be a valid HTTP/HTTPS URL or root-relative path.",
      );
    }

    if (normalizedCategory.length > 100) {
      return sendValidationError(res, "Category cannot exceed 100 characters.");
    }

    for (const [field, value] of [
      ["liveUrl", normalizedLiveUrl],
      ["githubClient", normalizedGithubClient],
      ["githubServer", normalizedGithubServer],
    ]) {
      if (value && !isValidHttpUrl(value)) {
        return sendValidationError(
          res,
          `${field} must be a valid HTTP or HTTPS URL.`,
        );
      }
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

    if (typeof features !== "undefined" && !validateStringArray(features)) {
      return sendValidationError(
        res,
        "Features must be an array of valid strings.",
      );
    }

    const normalizedFeatured =
      typeof featured === "undefined" ? false : parseBoolean(featured);

    if (normalizedFeatured === null) {
      return sendValidationError(res, "Featured must be a boolean value.");
    }

    const normalizedOrder =
      typeof order === "undefined" ? 0 : parseOrder(order);

    if (normalizedOrder === null) {
      return sendValidationError(
        res,
        "Order must be a non-negative safe integer.",
      );
    }

    const normalizedStatus =
      typeof status === "undefined" ? "published" : status;

    if (!ALLOWED_STATUS.includes(normalizedStatus)) {
      return sendValidationError(
        res,
        "Status must be either draft or published.",
      );
    }

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

    const now = new Date();

    const project = {
      title: normalizedTitle,
      slug: normalizedSlug,
      shortDescription: normalizedShortDescription,
      description: normalizedDescription,
      image: normalizedImage,
      category: normalizedCategory,
      technologies: normalizeStringArray(technologies ?? []),
      features: normalizeStringArray(features ?? []),
      liveUrl: normalizedLiveUrl,
      githubClient: normalizedGithubClient,
      githubServer: normalizedGithubServer,
      featured: normalizedFeatured,
      order: normalizedOrder,
      status: normalizedStatus,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(project);

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: {
        _id: result.insertedId,
        ...project,
      },
    });
  } catch (error) {
    return handleProjectError(res, error, "Create project");
  }
});

/* =========================================================
   UPDATE PROJECT
   PATCH /api/projects/:id
   Admin only
========================================================= */

router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid project ID.");
    }

    if (!isPlainObject(req.body)) {
      return sendValidationError(res, "A valid update object is required.");
    }

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

    if (Object.keys(updateData).length === 0) {
      return sendValidationError(res, "No valid fields provided for update.");
    }

    if (updateData.title !== undefined) {
      updateData.title = normalizeString(updateData.title);

      if (!updateData.title || updateData.title.length > MAX_TITLE_LENGTH) {
        return sendValidationError(
          res,
          `Title is required and cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        );
      }
    }

    if (updateData.slug !== undefined) {
      updateData.slug = normalizeSlug(updateData.slug);

      if (!isValidSlug(updateData.slug)) {
        return sendValidationError(
          res,
          "Slug must contain lowercase letters, numbers, and single hyphens only.",
        );
      }
    }

    if (updateData.shortDescription !== undefined) {
      updateData.shortDescription = normalizeString(
        updateData.shortDescription,
      );

      if (
        !updateData.shortDescription ||
        updateData.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH
      ) {
        return sendValidationError(
          res,
          `Short description is required and cannot exceed ${MAX_SHORT_DESCRIPTION_LENGTH} characters.`,
        );
      }
    }

    if (updateData.description !== undefined) {
      updateData.description = normalizeString(updateData.description);

      if (
        !updateData.description ||
        updateData.description.length > MAX_DESCRIPTION_LENGTH
      ) {
        return sendValidationError(
          res,
          `Description is required and cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        );
      }
    }

    if (updateData.image !== undefined) {
      if (typeof updateData.image !== "string") {
        return sendValidationError(res, "Image must be a string.");
      }

      updateData.image = normalizeString(updateData.image);

      if (!isValidImageValue(updateData.image)) {
        return sendValidationError(
          res,
          "Image must be a valid HTTP/HTTPS URL or root-relative path.",
        );
      }
    }

    if (updateData.category !== undefined) {
      if (typeof updateData.category !== "string") {
        return sendValidationError(res, "Category must be a string.");
      }

      updateData.category =
        normalizeString(updateData.category) || "Web Development";

      if (updateData.category.length > 100) {
        return sendValidationError(
          res,
          "Category cannot exceed 100 characters.",
        );
      }
    }

    for (const field of ["liveUrl", "githubClient", "githubServer"]) {
      if (updateData[field] !== undefined) {
        if (typeof updateData[field] !== "string") {
          return sendValidationError(res, `${field} must be a string.`);
        }

        updateData[field] = normalizeString(updateData[field]);

        if (updateData[field] && !isValidHttpUrl(updateData[field])) {
          return sendValidationError(
            res,
            `${field} must be a valid HTTP or HTTPS URL.`,
          );
        }
      }
    }

    for (const field of ["technologies", "features"]) {
      if (updateData[field] !== undefined) {
        if (!validateStringArray(updateData[field])) {
          return sendValidationError(
            res,
            `${field} must be an array of valid strings.`,
          );
        }

        updateData[field] = normalizeStringArray(updateData[field]);
      }
    }

    if (updateData.featured !== undefined) {
      const parsedFeatured = parseBoolean(updateData.featured);

      if (parsedFeatured === null) {
        return sendValidationError(res, "Featured must be a boolean value.");
      }

      updateData.featured = parsedFeatured;
    }

    if (updateData.order !== undefined) {
      const parsedOrder = parseOrder(updateData.order);

      if (parsedOrder === null) {
        return sendValidationError(
          res,
          "Order must be a non-negative safe integer.",
        );
      }

      updateData.order = parsedOrder;
    }

    if (
      updateData.status !== undefined &&
      !ALLOWED_STATUS.includes(updateData.status)
    ) {
      return sendValidationError(
        res,
        "Status must be either draft or published.",
      );
    }

    const collection = getProjectsCollection();
    const projectId = new ObjectId(id);

    const existingProject = await collection.findOne({
      _id: projectId,
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (
      updateData.slug !== undefined &&
      updateData.slug !== existingProject.slug
    ) {
      const duplicateSlug = await collection.findOne({
        slug: updateData.slug,
        _id: { $ne: projectId },
      });

      if (duplicateSlug) {
        return res.status(409).json({
          success: false,
          message: "A project with this slug already exists.",
        });
      }
    }

    updateData.updatedAt = new Date();

    await collection.updateOne({ _id: projectId }, { $set: updateData });

    const updatedProject = await collection.findOne({
      _id: projectId,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (error) {
    return handleProjectError(res, error, "Update project");
  }
});

/* =========================================================
   DELETE PROJECT
   DELETE /api/projects/:id
   Admin only
========================================================= */

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendValidationError(res, "Invalid project ID.");
    }

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
    return handleProjectError(res, error, "Delete project");
  }
});

export default router;
