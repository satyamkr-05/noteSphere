import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getApiPublicUrl, getR2Config, getStorageMode, uploadDir } from "../config/runtime.js";

const STORAGE_KEY_PREFIXES = {
  avatar: "avatars",
  note: "notes",
  questionPaper: "question-papers"
};

let cachedS3Client;

function getS3Client() {
  if (!cachedS3Client) {
    const config = getR2Config();
    cachedS3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  return cachedS3Client;
}

function sanitizeFileName(originalName = "") {
  const normalizedName = path.basename(originalName).replace(/\s+/g, "-").toLowerCase();
  return normalizedName.replace(/[^a-z0-9._-]/g, "") || "file";
}

function createStorageKey(scope, originalName) {
  const prefix = STORAGE_KEY_PREFIXES[scope];

  if (!prefix) {
    throw new Error(`Unsupported storage scope: ${scope}`);
  }

  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return `${prefix}/${Date.now()}-${randomSuffix}-${sanitizeFileName(originalName)}`;
}

export function normalizeStorageKey(value = "") {
  const normalizedValue = String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.startsWith("media/")) {
    return normalizedValue.slice("media/".length);
  }

  if (normalizedValue.startsWith("uploads/")) {
    return normalizedValue.slice("uploads/".length);
  }

  return normalizedValue;
}

function buildLocalAbsolutePath(storageKey = "") {
  return path.join(uploadDir, ...normalizeStorageKey(storageKey).split("/"));
}

async function writeLocalFile(storageKey, buffer) {
  const absolutePath = buildLocalAbsolutePath(storageKey);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, buffer);
}

async function putObject(storageKey, file) {
  const storageMode = getStorageMode();

  if (storageMode === "r2") {
    const { bucket } = getR2Config();
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
    return;
  }

  await writeLocalFile(storageKey, file.buffer);
}

export async function saveUploadedFile(file, scope) {
  const storageKey = createStorageKey(scope, file.originalname);
  await putObject(storageKey, file);
  return storageKey;
}

export async function deleteStorageObject(storageKey) {
  const normalizedKey = normalizeStorageKey(storageKey);

  if (!normalizedKey) {
    return;
  }

  if (getStorageMode() === "r2") {
    const { bucket } = getR2Config();
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: normalizedKey
      })
    );
    return;
  }

  const absolutePath = buildLocalAbsolutePath(normalizedKey);

  if (fs.existsSync(absolutePath)) {
    await fs.promises.unlink(absolutePath);
  }
}

export async function hasStorageObject(storageKey) {
  const normalizedKey = normalizeStorageKey(storageKey);

  if (!normalizedKey) {
    return false;
  }

  if (getStorageMode() === "r2") {
    try {
      const { bucket } = getR2Config();
      await getS3Client().send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: normalizedKey
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  return fs.existsSync(buildLocalAbsolutePath(normalizedKey));
}

export async function streamStorageObjectToResponse(res, storageKey, fileName, disposition = "inline") {
  const normalizedKey = normalizeStorageKey(storageKey);
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(fileName)}"`);

  if (getStorageMode() === "r2") {
    const { bucket } = getR2Config();
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: normalizedKey
      })
    );

    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    } else {
      res.type(fileName);
    }

    if (response.ContentLength) {
      res.setHeader("Content-Length", String(response.ContentLength));
    }

    await pipeline(response.Body, res);
    return;
  }

  const absolutePath = buildLocalAbsolutePath(normalizedKey);
  res.type(fileName);
  res.sendFile(absolutePath);
}

export function buildStoredFileAbsolutePath(storageKey) {
  return buildLocalAbsolutePath(storageKey);
}

export function buildAvatarUrl(avatarPath) {
  const normalizedKey = normalizeStorageKey(avatarPath);

  if (!normalizedKey) {
    return "";
  }

  return `${getApiPublicUrl()}/users/avatar/${encodeURI(normalizedKey)}`;
}

