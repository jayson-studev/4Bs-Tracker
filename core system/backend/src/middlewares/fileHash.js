import crypto from "crypto";
import multer from "multer";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

const generateFileHash = (req, res, next) => {
  // If no file was uploaded, explicitly set null
  if (!req.file) {
    req.fileHash = null;
    return next();
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Store hash in the request
    req.fileHash = hash;

    // Optionally delete file after hashing to save disk space
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error("Error generating file hash:", err);
    return res.status(500).json({ error: "Failed to generate file hash." });
  }

  next();
};

export { upload, generateFileHash };

