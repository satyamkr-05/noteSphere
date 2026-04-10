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

function validateOptionalLooseTextField(res, label, value, maxLength) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = normalizeText(value);

  if (normalizedValue.length > maxLength) {
    throwBadRequest(res, `${label} must be ${maxLength} characters or fewer.`);
  }

  return normalizedValue;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyExactMatch(filter, field, value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return;
  }

  filter[field] = { $regex: `^${escapeRegExp(normalizedValue)}$`, $options: "i" };
}

function buildApprovedNoteFilter({
  q = "",
  courseName = "",
  branchName = "",
  specializationName = "",
  subject = "",
  unitName = "",
  topicName = ""
}) {
  const filter = { status: "approved" };
  const normalizedQuery = q.trim();

  if (normalizedQuery) {
    const searchRegex = new RegExp(escapeRegExp(normalizedQuery), "i");
    filter.$or = [
      { title: searchRegex },
      { courseName: searchRegex },
      { branchName: searchRegex },
      { specializationName: searchRegex },
      { subject: searchRegex },
      { unitName: searchRegex },
      { topicName: searchRegex },
      { description: searchRegex }
    ];
  }

  applyExactMatch(filter, "courseName", courseName);
  applyExactMatch(filter, "branchName", branchName);
  applyExactMatch(filter, "specializationName", specializationName);
  applyExactMatch(filter, "subject", subject);
  applyExactMatch(filter, "unitName", unitName);
  applyExactMatch(filter, "topicName", topicName);

  return {
    filter,
    hasSearchQuery: Boolean(normalizedQuery)
  };
}

function buildDistinctApprovedNoteFilter(query = {}) {
  const filter = { status: "approved" };
  applyExactMatch(filter, "courseName", query.courseName);
  applyExactMatch(filter, "branchName", query.branchName);
  applyExactMatch(filter, "specializationName", query.specializationName);
  applyExactMatch(filter, "subject", query.subject);
  applyExactMatch(filter, "unitName", query.unitName);
  return filter;
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

  const notes = await Note.find(filter)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort(hasSearchQuery ? { featured: -1, downloads: -1, createdAt: -1 } : { featured: -1, createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const getNoteCourses = asyncHandler(async (_req, res) => {
  const courses = await Note.distinct("courseName", {
    status: "approved",
    courseName: { $nin: ["", null] }
  });

  res.json({ courses: courses.sort((left, right) => left.localeCompare(right)) });
});

export const getNoteBranches = asyncHandler(async (req, res) => {
  const branches = await Note.distinct("branchName", {
    ...buildDistinctApprovedNoteFilter({ courseName: req.query.courseName }),
    branchName: { $nin: ["", null] }
  });

  res.json({ branches: branches.sort((left, right) => left.localeCompare(right)) });
});

export const getNoteSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Note.distinct("specializationName", {
    ...buildDistinctApprovedNoteFilter({
      courseName: req.query.courseName,
      branchName: req.query.branchName
    }),
    specializationName: { $nin: ["", null] }
  });

  res.json({ specializations: specializations.sort((left, right) => left.localeCompare(right)) });
});

export const getNoteSubjects = asyncHandler(async (req, res) => {
  const subjects = await Note.distinct(
    "subject",
    buildDistinctApprovedNoteFilter({
      courseName: req.query.courseName,
      branchName: req.query.branchName,
      specializationName: req.query.specializationName
    })
  );

  res.json({ subjects: subjects.sort((left, right) => left.localeCompare(right)) });
});

export const getNoteUnits = asyncHandler(async (req, res) => {
  const units = await Note.distinct("unitName", {
    ...buildDistinctApprovedNoteFilter({
      courseName: req.query.courseName,
      branchName: req.query.branchName,
      specializationName: req.query.specializationName,
      subject: req.query.subject
    }),
    unitName: { $nin: ["", null] }
  });

  res.json({ units: units.sort((left, right) => left.localeCompare(right)) });
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
  const {
    title,
    courseName,
    branchName,
    specializationName,
    subject,
    unitName,
    topicName,
    description,
    featured = "false"
  } = req.body;

  if (!req.file) {
    throwBadRequest(res, "Please upload a file for the note.");
  }

  const normalizedTitle = validateRequiredTextField(
    res,
    "Title",
    title,
    NOTE_LIMITS.titleMaxLength
  );
  const normalizedCourseName = validateRequiredTextField(
    res,
    "Course",
    courseName,
    NOTE_LIMITS.courseMaxLength
  );
  const normalizedBranchName = validateRequiredTextField(
    res,
    "Branch",
    branchName,
    NOTE_LIMITS.branchMaxLength
  );
  const normalizedSpecializationName =
    validateOptionalLooseTextField(
      res,
      "Specialization",
      specializationName,
      NOTE_LIMITS.specializationMaxLength
    ) ?? "";
  const normalizedSubject = validateRequiredTextField(
    res,
    "Subject",
    subject,
    NOTE_LIMITS.subjectMaxLength
  );
  const normalizedUnitName =
    validateOptionalLooseTextField(
      res,
      "Unit",
      unitName,
      NOTE_LIMITS.unitMaxLength
    ) ?? "";
  const normalizedTopicName =
    validateOptionalLooseTextField(
      res,
      "Topic",
      topicName,
      NOTE_LIMITS.topicMaxLength
    ) ?? "";
  const normalizedDescription = validateOptionalLooseTextField(
    res,
    "Description",
    description,
    NOTE_LIMITS.descriptionMaxLength
  ) ?? "";
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
      courseName: normalizedCourseName,
      branchName: normalizedBranchName,
      specializationName: normalizedSpecializationName,
      subject: normalizedSubject,
      unitName: normalizedUnitName,
      topicName: normalizedTopicName,
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

  const {
    title,
    courseName,
    branchName,
    specializationName,
    subject,
    unitName,
    topicName,
    description,
    featured
  } = req.body;

  note.title =
    validateOptionalTextField(res, "Title", title, NOTE_LIMITS.titleMaxLength) ?? note.title;
  note.courseName =
    validateOptionalTextField(res, "Course", courseName, NOTE_LIMITS.courseMaxLength) ?? note.courseName;
  note.branchName =
    validateOptionalTextField(res, "Branch", branchName, NOTE_LIMITS.branchMaxLength) ?? note.branchName;
  note.specializationName =
    validateOptionalLooseTextField(
      res,
      "Specialization",
      specializationName,
      NOTE_LIMITS.specializationMaxLength
    ) ?? note.specializationName;
  note.subject =
    validateOptionalTextField(res, "Subject", subject, NOTE_LIMITS.subjectMaxLength) ?? note.subject;
  note.unitName =
    validateOptionalLooseTextField(res, "Unit", unitName, NOTE_LIMITS.unitMaxLength) ?? note.unitName;
  note.topicName =
    validateOptionalLooseTextField(res, "Topic", topicName, NOTE_LIMITS.topicMaxLength) ?? note.topicName;
  note.description =
    validateOptionalLooseTextField(
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
