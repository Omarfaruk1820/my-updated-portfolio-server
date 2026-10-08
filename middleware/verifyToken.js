import adminAuth from "../config/firebase.js";

const verifyToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    console.log("🔐 Authorization header exists:", Boolean(authorization));

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Authorization token is missing.",
      });
    }

    console.log(
      "🔐 Authorization format:",
      authorization.startsWith("Bearer ") ? "Bearer token" : "Invalid format",
    );

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authorization.slice(7).trim();

    console.log("🔐 Token exists:", Boolean(token));
    console.log("🔐 Token length:", token.length);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    console.log("✅ Firebase token verified");
    console.log("👤 Firebase UID:", decodedToken.uid);
    console.log("📧 Firebase email:", decodedToken.email);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("❌ Firebase token verification failed");
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error(error);

    switch (error?.code) {
      case "auth/id-token-expired":
        return res.status(401).json({
          success: false,
          message: "Authentication token has expired. Please sign in again.",
        });

      case "auth/id-token-revoked":
      case "auth/invalid-id-token":
        return res.status(401).json({
          success: false,
          message: "Invalid authentication token. Please sign in again.",
        });

      case "auth/argument-error":
        return res.status(401).json({
          success: false,
          message: "Invalid authentication token.",
        });

      default:
        return res.status(401).json({
          success: false,
          message: "Authentication failed. Please sign in again.",
        });
    }
  }
};

export default verifyToken;
