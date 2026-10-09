import express from "express";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import { sendContactNotificationEmail } from "../services/email.service.js";
import verifyToken from "../middleware/verifyToken.js";
import requireAdmin from "../middleware/requireAdmin.js";

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
  return getDB().collection(CONTACTS_COLLECTION);
};

const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-fA-F0-9]{24}$/.test(id) &&
    ObjectId.isValid(id)
  );
};

const handleError = (res, error, message) => {
  console.error("Contact route error:", error);

  return res.status(500).json({
    success: false,
    message,
  });
};

// ============================================================
// POST /api/contact
// Public: Submit a new contact / project inquiry
// ============================================================
router.post("/", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "A valid contact request is required.",
      });
    }

    const { name, email, phone, service, subject, message } = req.body;

    const normalizedName = normalizeString(name);
    const normalizedEmail = normalizeString(email).toLowerCase();
    const normalizedPhone = normalizeString(phone);
    const normalizedService = normalizeString(service);
    const normalizedSubject = normalizeString(subject);
    const normalizedMessage = normalizeString(message);

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

    if (normalizedName.length < 2 || normalizedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Name must be between 2 and ${MAX_NAME_LENGTH} characters.`,
      });
    }

    if (
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      !EMAIL_REGEX.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (normalizedPhone) {
      if (
        normalizedPhone.length > MAX_PHONE_LENGTH ||
        !PHONE_REGEX.test(normalizedPhone)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid phone number.",
        });
      }
    }

    if (normalizedService.length > MAX_SERVICE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Service cannot exceed ${MAX_SERVICE_LENGTH} characters.`,
      });
    }

    if (
      normalizedSubject.length < 5 ||
      normalizedSubject.length > MAX_SUBJECT_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Subject must be between 5 and ${MAX_SUBJECT_LENGTH} characters.`,
      });
    }

    if (
      normalizedMessage.length < MIN_MESSAGE_LENGTH ||
      normalizedMessage.length > MAX_MESSAGE_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Project details must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

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

    // Save the contact before sending the notification email.
    const result = await collection.insertOne(contactData);
    const contactId = result.insertedId;

    try {
      await sendContactNotificationEmail({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        service: normalizedService,
        subject: normalizedSubject,
        message: normalizedMessage,
      });

      await collection.updateOne(
        { _id: contactId },
        {
          $set: {
            emailStatus: "sent",
            emailSentAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: {
            emailError: "",
          },
        },
      );
    } catch (emailError) {
      // Keep the contact even if the email notification fails.
      console.error("Contact notification email failed:", emailError);

      try {
        await collection.updateOne(
          { _id: contactId },
          {
            $set: {
              emailStatus: "failed",
              emailError:
                emailError?.message || "Failed to send notification email.",
              updatedAt: new Date(),
            },
          },
        );
      } catch (updateError) {
        console.error("Failed to update contact email status:", updateError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Your project inquiry has been submitted successfully.",
      data: {
        id: contactId.toString(),
      },
    });
  } catch (error) {
    return handleError(res, error, "Failed to submit your contact request.");
  }
});

// ============================================================
// GET /api/contact
// Admin only: Get all contact messages
// ============================================================
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const collection = getContactsCollection();

    const contacts = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Contact messages fetched successfully.",
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch contact messages.");
  }
});

// ============================================================
// GET /api/contact/:id
// Admin only: Get one contact message
// ============================================================
router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
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
      message: "Contact message fetched successfully.",
      data: contact,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch contact message.");
  }
});

// ============================================================
// PATCH /api/contact/:id
// Admin only: Update contact status
// ============================================================
router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!isValidObjectId(id)) {
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
      { _id: new ObjectId(id) },
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
    return handleError(res, error, "Failed to update contact message.");
  }
});

// ============================================================
// DELETE /api/contact/:id
// Admin only: Delete a contact message
// ============================================================
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
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
    return handleError(res, error, "Failed to delete contact message.");
  }
});

export default router;
