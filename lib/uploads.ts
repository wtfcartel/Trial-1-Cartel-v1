import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "certificates");
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export class UploadError extends Error {}

export function isAllowedCertificateFile(file: File) {
  return ALLOWED_MIME_TYPES.has(file.type) && file.size > 0 && file.size <= MAX_FILE_BYTES;
}

/** Saves an uploaded certificate under a per-nurse directory, keyed by a
 * random name so the original (attacker-controlled) filename never touches
 * the filesystem path. Returns the path to store on the Certificate row. */
export async function saveCertificateFile(nurseProfileId: string, file: File) {
  if (!isAllowedCertificateFile(file)) {
    throw new UploadError("Only PDF, PNG, or JPEG files up to 5MB are accepted");
  }

  const dir = path.join(UPLOAD_ROOT, nurseProfileId);
  await mkdir(dir, { recursive: true });

  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const storedName = `${randomUUID()}.${ext}`;
  const fullPath = path.join(dir, storedName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, bytes);

  return path.join(nurseProfileId, storedName);
}

export async function readCertificateFile(storedPath: string) {
  const safeRelative = path.normalize(storedPath);
  if (safeRelative.startsWith("..") || path.isAbsolute(safeRelative)) {
    throw new UploadError("Invalid file path");
  }
  const fullPath = path.join(UPLOAD_ROOT, safeRelative);
  return readFile(fullPath);
}
