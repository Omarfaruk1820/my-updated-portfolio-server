import express from "express";

const router = express.Router();

// Get all experiences
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Experiences fetched successfully.",
      data: [],
    });
  } catch (error) {
    console.error("Get experiences error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch experiences.",
    });
  }
});

// Get single experience
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Experience fetched successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Get experience error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch experience.",
    });
  }
});

// Create new experience
router.post("/", async (req, res) => {
  try {
    const experienceData = req.body;

    res.status(201).json({
      success: true,
      message: "Experience created successfully.",
      data: experienceData,
    });
  } catch (error) {
    console.error("Create experience error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create experience.",
    });
  }
});

// Update experience
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const experienceData = req.body;

    res.status(200).json({
      success: true,
      message: "Experience updated successfully.",
      data: {
        id,
        ...experienceData,
      },
    });
  } catch (error) {
    console.error("Update experience error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update experience.",
    });
  }
});

// Delete experience
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Delete experience error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete experience.",
    });
  }
});

export default router;
