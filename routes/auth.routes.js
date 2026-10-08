import express from "express";

import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated admin user.
 *
 * Authentication:
 * - Firebase ID Token
 *
 * Authorization:
 * - Firebase UID must match ADMIN_UID.
 */
router.get("/me", verifyToken, (req, res) => {
  try {
    const user = req.user;

    if (!user?.uid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const adminUid = process.env.ADMIN_UID?.trim();

    if (!adminUid) {
      console.error("❌ ADMIN_UID is not configured.");

      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured.",
      });
    }

    const authenticatedUid = user.uid.trim();

    if (authenticatedUid !== adminUid) {
      console.warn(`⚠️ Unauthorized admin access attempt: ${authenticatedUid}`);

      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges are required.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authenticated admin user.",
      data: {
        uid: authenticatedUid,
        email: user.email || null,
        name: user.name || null,
        picture: user.picture || null,
        emailVerified: Boolean(user.email_verified),
      },
    });
  } catch (error) {
    console.error("❌ GET /api/auth/me error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the authenticated user.",
    });
  }
});

export default router;
