const multer = require("multer");
const path = require("path");
// Multer config
const uploadDisk = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".png" &&
      ext !== ".pdf" &&
      ext !== ".svg"
    ) {
      cb(new Error("Unsupported file type!"), false);
      return;
    }
    cb(null, true);
  },
});

const uploadBuffer = multer({
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".png" &&
      ext !== ".pdf" &&
      ext !== ".mp3" &&
      ext !== ".webp" &&
      ext !== ".svg" &&
      ext !== ".mp4"
    ) {
      cb(new Error("Unsupported file type!"), false);
      return;
    }
    if (!req.body) {
      console.log("fff");
    }
    cb(null, true);
  },
});

const uploadWithoutImage = multer().none();

module.exports = { uploadDisk, uploadBuffer, uploadWithoutImage };
