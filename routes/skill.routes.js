import express from "express";

const router = express.Router();

// Get all skills
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Skills fetched successfully.",
      data: [],
    });
  } catch (error) {
    console.error("Get skills error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch skills.",
    });
  }
});

// Get single skill
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Skill fetched successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Get skill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch skill.",
    });
  }
});

// Create new skill
router.post("/", async (req, res) => {
  try {
    const skillData = req.body;

    res.status(201).json({
      success: true,
      message: "Skill created successfully.",
      data: skillData,
    });
  } catch (error) {
    console.error("Create skill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create skill.",
    });
  }
});

// Update skill
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const skillData = req.body;

    res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
      data: {
        id,
        ...skillData,
      },
    });
  } catch (error) {
    console.error("Update skill error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update skill.",
    });
  }
});

// Delete skill
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Skill deleted successfully.",
      data: { id },
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
