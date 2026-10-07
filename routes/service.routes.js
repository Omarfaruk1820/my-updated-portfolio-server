import express from "express";

const router = express.Router();

// Get all services
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Services fetched successfully.",
      data: [],
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
    });
  }
});

// Get single service
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Service fetched successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Get service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch service.",
    });
  }
});

// Create new service
router.post("/", async (req, res) => {
  try {
    const serviceData = req.body;

    res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: serviceData,
    });
  } catch (error) {
    console.error("Create service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create service.",
    });
  }
});

// Update service
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = req.body;

    res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: {
        id,
        ...serviceData,
      },
    });
  } catch (error) {
    console.error("Update service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service.",
    });
  }
});

// Delete service
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Delete service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete service.",
    });
  }
});

export default router;
