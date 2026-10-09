import express from "express";
import { ObjectId } from "mongodb";

import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../models/skill.model.js";

import verifyToken from "../middleware/verifyToken.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-fA-F0-9]{24}$/.test(id) &&
    ObjectId.isValid(id)
  );
};

const handleSkillError = (res, error, defaultMessage) => {
  console.error("Skill route error:", error);

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A skill with this information already exists.",
    });
  }

  if (error?.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: defaultMessage,
  });
};

// GET /api/skills
// Public: Fetch active skills
router.get("/", async (req, res) => {
  try {
    const skills = await getAllSkills();

    return res.status(200).json({
      success: true,
      message: "Skills fetched successfully.",
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    return handleSkillError(res, error, "Failed to fetch skills.");
  }
});

// GET /api/skills/:id
// Public: Fetch a skill by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID.",
      });
    }

    const skill = await getSkillById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill fetched successfully.",
      data: skill,
    });
  } catch (error) {
    return handleSkillError(res, error, "Failed to fetch skill.");
  }
});

// POST /api/skills
// Admin only: Create a skill
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "A valid skill object is required.",
      });
    }

    const skill = await createSkill(req.body);

    return res.status(201).json({
      success: true,
      message: "Skill created successfully.",
      data: skill,
    });
  } catch (error) {
    return handleSkillError(res, error, "Failed to create skill.");
  }
});

// PATCH /api/skills/:id
// Admin only: Update a skill
router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID.",
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "A valid skill object is required.",
      });
    }

    const skill = await updateSkill(id, req.body);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
      data: skill,
    });
  } catch (error) {
    return handleSkillError(res, error, "Failed to update skill.");
  }
});

// DELETE /api/skills/:id
// Admin only: Delete a skill
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID.",
      });
    }

    const deletedSkill = await deleteSkill(id);

    if (!deletedSkill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill deleted successfully.",
      data: deletedSkill,
    });
  } catch (error) {
    return handleSkillError(res, error, "Failed to delete skill.");
  }
});

export default router;
