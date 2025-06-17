import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs'

const __filename =fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.resolve(__dirname, "backend/public/uploads");


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

export const upload = multer({ storage, fileFilter });
