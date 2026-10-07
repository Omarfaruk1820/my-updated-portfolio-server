import express from "express";
import { getDB } from "../config/db.js";

const router = express.Router();

// POST /api/contact
// Submit a contact message
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Prepare contact document
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || "",
      message: message.trim(),
      status: "unread",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into MongoDB
    const db = getDB();

    const result = await db.collection("contacts").insertOne(contactData);

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully.",
      data: {
        id: result.insertedId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/contact
// Get all contact messages
router.get("/", async (req, res, next) => {
  try {
    const db = getDB();

    const contacts = await db
      .collection("contacts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/contact/:id
// Get a single contact message
router.get("/:id", async (req, res, next) => {
  try {
    const { ObjectId } = await import("mongodb");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    const db = getDB();

    const contact = await db.collection("contacts").findOne({
      _id: new ObjectId(id),
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contact/:id
// Update contact message status
router.patch("/:id", async (req, res, next) => {
  try {
    const { ObjectId } = await import("mongodb");
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    const allowedStatuses = ["unread", "read", "replied"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const db = getDB();

    const result = await db.collection("contacts").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message updated successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contact/:id
// Delete a contact message
router.delete("/:id", async (req, res, next) => {
  try {
    const { ObjectId } = await import("mongodb");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    const db = getDB();

    const result = await db.collection("contacts").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
