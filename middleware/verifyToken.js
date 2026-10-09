import adminAuth from "../config/firebase.js";

const verifyToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Authorization token is missing.",
      });
    }

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
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
