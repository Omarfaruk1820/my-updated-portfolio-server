import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import { sendContactNotificationEmail } from "../services/email.service.js";

const router = express.Router();

const CONTACTS_COLLECTION = "contacts";

const ALLOWED_STATUSES = ["unread", "read", "replied"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^\+?[0-9\s().-]{7,25}$/;

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const MAX_PHONE_LENGTH = 25;
const MAX_SERVICE_LENGTH = 100;
const MAX_SUBJECT_LENGTH = 150;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 3000;

const getContactsCollection = () => {
  const db = getDB();

  return db.collection(CONTACTS_COLLECTION);
};

const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

// ============================================================
// POST /api/contact
// Submit a new contact / project inquiry
// Public endpoint
// ============================================================
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, service, subject, message } = req.body;

    const normalizedName = normalizeString(name);

    const normalizedEmail = normalizeString(email).toLowerCase();

    const normalizedPhone = normalizeString(phone);

    const normalizedService = normalizeString(service);

    const normalizedSubject = normalizeString(subject);

    const normalizedMessage = normalizeString(message);

    // ========================================================
    // Required fields
    // ========================================================
    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedService ||
      !normalizedSubject ||
      !normalizedMessage
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, service, subject, and project details are required.",
      });
    }

    // ========================================================
    // Name validation
    // ========================================================
    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }

    if (normalizedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Name cannot exceed ${MAX_NAME_LENGTH} characters.`,
      });
    }

    // ========================================================
    // Email validation
    // ========================================================
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Email cannot exceed ${MAX_EMAIL_LENGTH} characters.`,
      });
    }

    // ========================================================
    // Phone validation
    // Optional field
    // ========================================================
    if (normalizedPhone) {
      if (normalizedPhone.length > MAX_PHONE_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Phone number cannot exceed ${MAX_PHONE_LENGTH} characters.`,
        });
      }

      if (!PHONE_REGEX.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid phone number.",
        });
      }
    }

    // ========================================================
    // Service validation
    // ========================================================
    if (normalizedService.length > MAX_SERVICE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Service cannot exceed ${MAX_SERVICE_LENGTH} characters.`,
      });
    }

    // ========================================================
    // Subject validation
    // ========================================================
    if (normalizedSubject.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Subject must be at least 5 characters.",
      });
    }

    if (normalizedSubject.length > MAX_SUBJECT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Subject cannot exceed ${MAX_SUBJECT_LENGTH} characters.`,
      });
    }

    // ========================================================
    // Message validation
    // ========================================================
    if (normalizedMessage.length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Project details must be at least ${MIN_MESSAGE_LENGTH} characters.`,
      });
    }

    if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Project details cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    // ========================================================
    // Prepare contact document
    // ========================================================
    const now = new Date();

    const contactData = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      service: normalizedService,
      subject: normalizedSubject,
      message: normalizedMessage,

      status: "unread",

      emailStatus: "pending",

      createdAt: now,
      updatedAt: now,
    };

    const collection = getContactsCollection();

    // ========================================================
    // 1. Save contact FIRST
    // ========================================================
    const result = await collection.insertOne(contactData);

    const contactId = result.insertedId;

    // ========================================================
    // 2. Send HR notification email SECOND
    // ========================================================
    try {
      await sendContactNotificationEmail({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        service: normalizedService,
        subject: normalizedSubject,
        message: normalizedMessage,
      });

      // ======================================================
      // Email successfully sent
      // ======================================================
      await collection.updateOne(
        {
          _id: contactId,
        },
        {
          $set: {
            emailStatus: "sent",
            emailSentAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    } catch (emailError) {
      // ======================================================
      // IMPORTANT
      //
      // The contact is already stored in MongoDB.
      // Never delete it just because email failed.
      // ======================================================
      console.error("❌ Contact notification email failed:", emailError);

      await collection.updateOne(
        {
          _id: contactId,
        },
        {
          $set: {
            emailStatus: "failed",
            emailError:
              emailError?.message || "Failed to send notification email.",
            updatedAt: new Date(),
          },
        },
      );
    }

    // ========================================================
    // Success response
    // ========================================================
    return res.status(201).json({
      success: true,
      message: "Your project inquiry has been sent successfully.",
      data: {
        id: contactId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/contact
// Get all contact messages
//
// IMPORTANT:
// This endpoint should be protected by your admin
// authentication before production deployment.
// ============================================================
router.get("/", async (req, res, next) => {
  try {
    const collection = getContactsCollection();

    const contacts = await collection
      .find({})
      .sort({
        createdAt: -1,
      })
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

// ============================================================
// GET /api/contact/:id
// Get one contact message
//
// IMPORTANT:
// This endpoint should be protected by admin authentication.
// ============================================================
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    const collection = getContactsCollection();

    const contact = await collection.findOne({
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

// ============================================================
// PATCH /api/contact/:id
// Update contact status
//
// IMPORTANT:
// This endpoint should be protected by admin authentication.
// ============================================================
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values are: unread, read, replied.",
      });
    }

    const collection = getContactsCollection();

    const result = await collection.updateOne(
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
      message: "Contact message status updated successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DELETE /api/contact/:id
// Delete contact message
//
// IMPORTANT:
// This endpoint should be protected by admin authentication.
// ============================================================
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID.",
      });
    }

    const collection = getContactsCollection();

    const result = await collection.deleteOne({
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
