import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const UPLOADS_DIR = path.resolve("uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function generateStoredFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uuid = crypto.randomUUID();
  return `${timestamp}_${uuid}${ext}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, generateStoredFilename(file.originalname));
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".pdf", ".txt", ".docx", ".epub", ".md"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${ext}. Solo se permiten documentos (PDF, TXT, DOCX, EPUB, MD).`));
  }
};

export const multerOptions: multer.Options = {
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
};

export const upload = multer(multerOptions);

export { UPLOADS_DIR, generateStoredFilename };
