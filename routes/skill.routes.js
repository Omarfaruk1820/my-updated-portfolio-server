import express from "express";

import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../models/skill.model.js";

const router = express.Router();

// GET /api/skills
router.get("/", async (req, res) => {
  try {
    const skills = await getAllSkills();

    res.status(200).json({
      success: true,
      message: "Skills fetched successfully.",
      data: skills,
    });
  } catch (error) {
    console.error("Get skills error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch skills.",
    });
  }
});

// GET /api/skills/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await getSkillById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Skill fetched successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Get skill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch skill.",
    });
  }
});

// POST /api/skills
router.post("/", async (req, res) => {
  try {
    const skill = await createSkill(req.body);

    res.status(201).json({
      success: true,
      message: "Skill created successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Create skill error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create skill.",
    });
  }
});

// PATCH /api/skills/:id
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await updateSkill(id, req.body);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
      data: skill,
    });
  } catch (error) {
    console.error("Update skill error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update skill.",
    });
  }
});

// DELETE /api/skills/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSkill = await deleteSkill(id);

    if (!deletedSkill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Skill deleted successfully.",
      data: deletedSkill,
    });
  } catch (error) {
    console.error("Delete skill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete skill.",
    });
  }
});

export default router;
