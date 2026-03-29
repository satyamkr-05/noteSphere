import Note from "../models/Note.js";
import DownloadRecord from "../models/DownloadRecord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildStoredFileAbsolutePath,
  hasStoredFile,
  removeStoredFile
} from "../utils/noteFiles.js";
import {
  buildPagination,
  parsePagination,
  serializePagination
} from "../utils/pagination.js";
import { hashFileAtPath } from "../utils/fileHash.js";
import { serializeNote } from "../utils/serializeNote.js";
import { NOTE_LIMITS } from "../../../shared/noteLimits.js";

function throwBadRequest(res, message) {
  res.status(400);
  throw new Error(message);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRequiredTextField(res, label, value, maxLength) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    throwBadRequest(res, `${label} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throwBadRequest(res, `${label} must be ${maxLength} characters or fewer.`);
  }

  return normalizedValue;
}

function validateOptionalTextField(res, label, value, maxLength) {
  if (value === undefined) {
    return undefined;
  }

  return validateRequiredTextField(res, label, value, maxLength);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildApprovedNoteFilter({ q = "", subject = "" }) {
  const filter = { status: "approved" };
  const normalizedQuery = q.trim();
  const normalizedSubject = subject.trim();

  if (normalizedQuery) {
    filter.$text = { $search: normalizedQuery };
  }

  if (normalizedSubject) {
    filter.subject = { $regex: `^${escapeRegExp(normalizedSubject)}$`, $options: "i" };
  }

  return {
    filter,
    hasSearchQuery: Boolean(normalizedQuery)
  };
}

async function populateNoteRelations(note) {
  await note.populate("uploadedBy", "name email");
  await note.populate("reviewedBy", "name email");
  return note;
}

function canAccessNoteFile(note, user) {
  if (!note || !user) {
    return false;
  }

  if (note.status === "approved") {
    return true;
  }

  if (user.isAdmin) {
    return true;
  }

  return note.uploadedBy.toString() === user._id.toString();
}

async function findAccessibleNoteFile(req, res) {
  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  if (!canAccessNoteFile(note, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this note file.");
  }

  if (!hasStoredFile(note.filePath)) {
    res.status(404);
    throw new Error("The note file could not be found.");
  }

  return note;
}

function sendNoteFileResponse(res, note, disposition = "inline") {
  const absolutePath = buildStoredFileAbsolutePath(note.filePath);
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(note.fileName)}"`);
  res.type(note.fileName);
  res.sendFile(absolutePath);
}

async function ensureUniqueFileHash(res, fileHash, currentNoteId = "") {
  const duplicateQuery = { fileHash };

  if (currentNoteId) {
    duplicateQuery._id = { $ne: currentNoteId };
  }

  const duplicateNote = await Note.findOne(duplicateQuery).select("_id title subject");

  if (duplicateNote) {
    throwBadRequest(
      res,
      "This note file has already been uploaded to the application. Please upload a different file."
    );
  }
}

export const getNotes = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 12,
    maxLimit: 36
  });
  const { filter, hasSearchQuery } = buildApprovedNoteFilter(req.query);
  const totalItems = await Note.countDocuments(filter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const notes = await Note.find(
    filter,
    hasSearchQuery ? { score: { $meta: "textScore" } } : {}
  )
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort(
      hasSearchQuery
        ? { score: { $meta: "textScore" }, featured: -1, createdAt: -1 }
        : { featured: -1, createdAt: -1 }
    )
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const getTrendingNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ status: "approved" })
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ downloads: -1, createdAt: -1 })
    .limit(3);

  res.json({ notes: notes.map((note) => serializeNote(req, note)) });
});

export const getMyNotes = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 9,
    maxLimit: 30
  });
  const filter = { uploadedBy: req.user._id };
  const totalItems = await Note.countDocuments(filter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const notes = await Note.find(filter)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    status: "approved"
  })
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  res.json({ note: serializeNote(req, note) });
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, subject, description, featured = "false" } = req.body;

  if (!req.file) {
    throwBadRequest(res, "Please upload a file for the note.");
  }

  const normalizedTitle = validateRequiredTextField(
    res,
    "Title",
    title,
    NOTE_LIMITS.titleMaxLength
  );
  const normalizedSubject = validateRequiredTextField(
    res,
    "Subject",
    subject,
    NOTE_LIMITS.subjectMaxLength
  );
  const normalizedDescription = validateRequiredTextField(
    res,
    "Description",
    description,
    NOTE_LIMITS.descriptionMaxLength
  );
  const fileHash = await hashFileAtPath(req.file.path);

  try {
    await ensureUniqueFileHash(res, fileHash);
  } catch (error) {
    removeStoredFile(req.file.path);
    throw error;
  }

  let note;

  try {
    note = await Note.create({
      title: normalizedTitle,
      subject: normalizedSubject,
      description: normalizedDescription,
      status: "approved",
      reviewedBy: null,
      reviewedAt: null,
      featured: featured === "true",
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileHash,
      uploadedBy: req.user._id
    });
  } catch (error) {
    removeStoredFile(req.file.path);
    throw error;
  }

  const populatedNote = await populateNoteRelations(note);
  res.status(201).json({ note: serializeNote(req, populatedNote) });
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  if (note.uploadedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update your own notes.");
  }

  const { title, subject, description, featured } = req.body;

  note.title =
    validateOptionalTextField(res, "Title", title, NOTE_LIMITS.titleMaxLength) ?? note.title;
  note.subject =
    validateOptionalTextField(res, "Subject", subject, NOTE_LIMITS.subjectMaxLength) ?? note.subject;
  note.description =
    validateOptionalTextField(
      res,
      "Description",
      description,
      NOTE_LIMITS.descriptionMaxLength
    ) ?? note.description;
  if (featured !== undefined) {
    note.featured = featured === "true" || featured === true;
  }

  note.status = "approved";
  note.reviewedBy = null;
  note.reviewedAt = null;

  if (req.file) {
    const nextFileHash = await hashFileAtPath(req.file.path);
    const previousFilePath = note.filePath;

    try {
      await ensureUniqueFileHash(res, nextFileHash, note._id.toString());
    } catch (error) {
      removeStoredFile(req.file.path);
      throw error;
    }

    removeStoredFile(previousFilePath);
    note.fileName = req.file.originalname;
    note.filePath = `/uploads/${req.file.filename}`;
    note.fileHash = nextFileHash;
  }

  let updatedNote;

  try {
    updatedNote = await note.save();
  } catch (error) {
    if (req.file) {
      removeStoredFile(req.file.path);
    }

    throw error;
  }

  await populateNoteRelations(updatedNote);

  res.json({ note: serializeNote(req, updatedNote) });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  if (note.uploadedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own notes.");
  }

  removeStoredFile(note.filePath);
  await note.deleteOne();

  res.json({ message: "Note deleted successfully." });
});

export const registerDownload = asyncHandler(async (req, res) => {
  const note = await findAccessibleNoteFile(req, res);

  if (note.status === "approved") {
    note.downloads += 1;
    await Promise.all([
      note.save(),
      DownloadRecord.create({
        user: req.user._id,
        note: note._id
      })
    ]);
  }

  sendNoteFileResponse(res, note, "attachment");
});

export const streamNoteFile = asyncHandler(async (req, res) => {
  const note = await findAccessibleNoteFile(req, res);
  sendNoteFileResponse(res, note, req.query.disposition === "attachment" ? "attachment" : "inline");
});

export const getPublicNoteStats = asyncHandler(async (_req, res) => {
  const [totalApprovedNotes, totalFeaturedNotes, subjectList, downloadSummary] = await Promise.all([
    Note.countDocuments({ status: "approved" }),
    Note.countDocuments({ status: "approved", featured: true }),
    Note.distinct("subject", { status: "approved" }),
    Note.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: "$downloads" }
        }
      }
    ])
  ]);

  res.json({
    summary: {
      totalApprovedNotes,
      totalFeaturedNotes,
      totalSubjects: subjectList.length,
      totalDownloads: downloadSummary[0]?.totalDownloads || 0
    }
  });
});
