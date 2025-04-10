import multer from "multer";
import path from "path";

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    const uniqueName = `img-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;
