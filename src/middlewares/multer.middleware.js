import multer from "multer";
import path from "path";

// Store files in /public/temp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});

export const upload = multer({ storage });
