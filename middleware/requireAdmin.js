import "dotenv/config";

const requireAdmin = (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const adminUid = process.env.ADMIN_UID?.trim();

    // Ensure the Firebase token has already been verified.
    if (!authenticatedUser?.uid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in first.",
      });
    }

    // Ensure the configured admin UID exists.
    if (!adminUid) {
      console.error(
        "❌ Admin authorization configuration error: ADMIN_UID is missing.",
      );

      return res.status(500).json({
        success: false,
        message: "Admin authorization is not configured.",
      });
    }

    const authenticatedUid = authenticatedUser.uid.trim();

    // Allow access only to the configured administrator.
    if (authenticatedUid !== adminUid) {
      console.warn("⚠️ Unauthorized admin access attempt.", {
        uid: authenticatedUid,
        email: authenticatedUser.email || null,
        path: req.originalUrl,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges are required.",
      });
    }

    // The authenticated Firebase user is the authorized administrator.
    req.admin = {
      uid: authenticatedUid,
      email: authenticatedUser.email || null,
      name: authenticatedUser.name || null,
    };

    next();
  } catch (error) {
    console.error("❌ Admin authorization middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify administrator permissions.",
    });
  }
};

export default requireAdmin;
