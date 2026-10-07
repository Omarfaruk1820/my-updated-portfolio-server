import express from "express";

const router = express.Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: [],
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects.",
    });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Project fetched successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch project.",
    });
  }
});

// Create new project
router.post("/", async (req, res) => {
  try {
    const projectData = req.body;

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: projectData,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create project.",
    });
  }
});

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: {
        id,
        ...projectData,
      },
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update project.",
    });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete project.",
    });
  }
});

export default router;
