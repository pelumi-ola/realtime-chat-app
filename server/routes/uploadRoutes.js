import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../controllers/uploadController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }

    callback(null, true);
  },
});

router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

export default router;
