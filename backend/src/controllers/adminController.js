import path from "path";
import User from "../models/User.js";
import Note from "../models/Note.js";
import Feedback from "../models/Feedback.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createToken } from "../utils/createToken.js";
import {
  buildPagination,
  parsePagination,
  serializePagination
} from "../utils/pagination.js";
import {
  ADMIN_ROLES,
  getAdminEmail,
  getResolvedAdminRole,
  isAdminUser,
  isMainAdminEmail,
  isMainAdminUser
} from "../config/runtime.js";
import { serializeNote } from "../utils/serializeNote.js";
import { AppError } from "../utils/appError.js";
import { removeStoredFile } from "../utils/noteFiles.js";
import { NOTE_LIMITS } from "../../../shared/noteLimits.js";
import { serializeUser } from "../utils/serializeUser.js";

function getContentTypeLabel(fileName = "") {
  const extension = path.extname(fileName).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension)) {
    return "Image";
  }

  if (!extension) {
    return "Other";
  }

  return extension.slice(1).toUpperCase();
}

function serializeAdminUser(user, uploadedNotes = 0, sharedContentTypes = []) {
  const adminRole = getResolvedAdminRole(user);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminUser(user),
    isMainAdmin: adminRole === ADMIN_ROLES.MAIN_ADMIN,
    adminRole,
    createdAt: user.createdAt,
    uploadedNotes,
    sharedContentTypes
  };
}

function buildAdminAuthResponse(user) {
  return {
    token: createToken(user._id),
    user: serializeUser(user)
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRequiredTextField(res, label, value, maxLength) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    res.status(400);
    throw new Error(`${label} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    res.status(400);
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }

  return normalizedValue;
}

function validateStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();
  const allowedStatuses = ["pending", "approved", "rejected"];

  if (!allowedStatuses.includes(normalizedStatus)) {
    throw new AppError("Status must be pending, approved, or rejected.", 400);
  }

  return normalizedStatus;
}

function buildTextSearchFilter(search = "") {
  const normalizedSearch = search.trim();

  if (!normalizedSearch) {
    return { filter: {}, hasSearchQuery: false };
  }

  return {
    filter: { $text: { $search: normalizedSearch } },
    hasSearchQuery: true
  };
}

function buildFeedbackSearchFilter(search = "") {
  const normalizedSearch = search.trim();

  if (!normalizedSearch) {
    return {};
  }

  const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  return {
    $or: [
      { name: regex },
      { email: regex },
      { message: regex },
      { type: regex }
    ]
  };
}

function serializeFeedback(feedback) {
  return {
    id: feedback._id,
    name: feedback.name,
    email: feedback.email,
    type: feedback.type,
    message: feedback.message,
    status: feedback.status,
    submittedBy: feedback.submittedBy
      ? {
        id: feedback.submittedBy._id,
        name: feedback.submittedBy.name,
        email: feedback.submittedBy.email
      }
      : null,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt
  };
}

async function findNoteWithRelations(noteId) {
  return Note.findById(noteId)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");
}

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeText(email).toLowerCase();

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError("Invalid admin email or password.", 401);
  }

  if (!isAdminUser(user)) {
    throw new AppError("This account does not have admin access.", 403);
  }

  res.json(buildAdminAuthResponse(user));
});

export const getAdminNotes = asyncHandler(async (req, res) => {
  const { status = "", search = "" } = req.query;
  const normalizedStatus = status.trim().toLowerCase();
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 12,
    maxLimit: 36
  });
  const { filter, hasSearchQuery } = buildTextSearchFilter(search);

  if (normalizedStatus) {
    filter.status = normalizedStatus;
  }

  const [
    totalItems,
    totalNotes,
    totalFeaturedNotes,
    approvedNotes,
    pendingNotes,
    rejectedNotes
  ] = await Promise.all([
    Note.countDocuments(filter),
    Note.countDocuments({}),
    Note.countDocuments({ featured: true }),
    Note.countDocuments({ status: "approved" }),
    Note.countDocuments({ status: "pending" }),
    Note.countDocuments({ status: "rejected" })
  ]);
  const pagination = buildPagination(requestedPagination, totalItems);

  const notes = await Note.find(
    filter,
    hasSearchQuery ? { score: { $meta: "textScore" } } : {}
  )
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort(
      hasSearchQuery
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1 }
    )
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    summary: {
      totalNotes,
      totalFeaturedNotes,
      approvedNotes,
      pendingNotes,
      rejectedNotes
    },
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const updateAdminNote = asyncHandler(async (req, res) => {
  const note = await findNoteWithRelations(req.params.id);

  if (!note) {
    throw new AppError("Note not found.", 404);
  }

  const { title, subject, description, featured, status } = req.body;

  note.title = validateRequiredTextField(res, "Title", title, NOTE_LIMITS.titleMaxLength);
  note.subject = validateRequiredTextField(res, "Subject", subject, NOTE_LIMITS.subjectMaxLength);
  note.description = validateRequiredTextField(
    res,
    "Description",
    description,
    NOTE_LIMITS.descriptionMaxLength
  );
  note.featured = featured === true || featured === "true";

  if (status !== undefined) {
    note.status = validateStatus(status);
    note.reviewedBy = req.user._id;
    note.reviewedAt = new Date();
  }

  await note.save();
  await note.populate("uploadedBy", "name email");
  await note.populate("reviewedBy", "name email");

  res.json({ note: serializeNote(req, note) });
});

async function updateReviewStatus(req, res, nextStatus) {
  const note = await findNoteWithRelations(req.params.id);

  if (!note) {
    throw new AppError("Note not found.", 404);
  }

  note.status = nextStatus;
  note.reviewedBy = req.user._id;
  note.reviewedAt = new Date();

  await note.save();
  await note.populate("uploadedBy", "name email");
  await note.populate("reviewedBy", "name email");

  res.json({ note: serializeNote(req, note) });
}

export const approveNote = asyncHandler(async (req, res) => {
  await updateReviewStatus(req, res, "approved");
});

export const rejectNote = asyncHandler(async (req, res) => {
  await updateReviewStatus(req, res, "rejected");
});

export const deleteAdminNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw new AppError("Note not found.", 404);
  }

  removeStoredFile(note.filePath);
  await note.deleteOne();

  res.json({ message: "Note deleted successfully." });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 9,
    maxLimit: 30
  });
  const { filter, hasSearchQuery } = buildTextSearchFilter(search);
  const [totalItems, totalAccounts, totalNotes, activeUploaderIds] = await Promise.all([
    User.countDocuments({
      ...filter,
      adminRole: ADMIN_ROLES.USER,
      email: { $ne: getAdminEmail() }
    }),
    User.countDocuments({ adminRole: ADMIN_ROLES.USER, email: { $ne: getAdminEmail() } }),
    Note.countDocuments({}),
    Note.distinct("uploadedBy")
  ]);
  const pagination = buildPagination(requestedPagination, totalItems);
  const users = await User.find(
    {
      ...filter,
      adminRole: ADMIN_ROLES.USER,
      email: { $ne: getAdminEmail() }
    },
    hasSearchQuery ? { score: { $meta: "textScore" } } : {}
  )
    .sort(
      hasSearchQuery
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1 }
    )
    .skip(pagination.skip)
    .limit(pagination.limit);
  const userIds = users.map((user) => user._id);
  const userNotes = userIds.length
    ? await Note.find({ uploadedBy: { $in: userIds } }, "uploadedBy fileName")
    : [];
  const noteCountMap = new Map();
  const contentTypeMap = new Map();

  for (const note of userNotes) {
    const userId = String(note.uploadedBy);
    noteCountMap.set(userId, (noteCountMap.get(userId) || 0) + 1);

    if (!contentTypeMap.has(userId)) {
      contentTypeMap.set(userId, new Map());
    }

    const contentLabel = getContentTypeLabel(note.fileName);
    const userContentMap = contentTypeMap.get(userId);
    userContentMap.set(contentLabel, (userContentMap.get(contentLabel) || 0) + 1);
  }

  res.json({
    summary: {
      totalAccounts,
      totalNotes,
      activeUploaders: activeUploaderIds.length
    },
    users: users.map((user) => {
      const userId = String(user._id);
      const contentEntries = Array.from(contentTypeMap.get(userId)?.entries() || [])
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([type, count]) => ({ type, count }));

      return serializeAdminUser(
        user,
        noteCountMap.get(userId) || 0,
        contentEntries
      );
    }),
    pagination: serializePagination(pagination)
  });
});

export const getAdminFeedback = asyncHandler(async (req, res) => {
  const { search = "", status = "" } = req.query;
  const normalizedStatus = normalizeText(status).toLowerCase();
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 9,
    maxLimit: 30
  });
  const filter = buildFeedbackSearchFilter(search);

  if (normalizedStatus) {
    filter.status = normalizedStatus;
  }

  const [totalItems, totalMessages, newMessages, reviewedMessages] = await Promise.all([
    Feedback.countDocuments(filter),
    Feedback.countDocuments({}),
    Feedback.countDocuments({ status: "new" }),
    Feedback.countDocuments({ status: "reviewed" })
  ]);
  const pagination = buildPagination(requestedPagination, totalItems);
  const feedback = await Feedback.find(filter)
    .populate("submittedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    summary: {
      totalMessages,
      newMessages,
      reviewedMessages
    },
    feedback: feedback.map((entry) => serializeFeedback(entry)),
    pagination: serializePagination(pagination)
  });
});

export const markFeedbackReviewed = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id).populate("submittedBy", "name email");

  if (!feedback) {
    throw new AppError("Feedback entry not found.", 404);
  }

  feedback.status = "reviewed";
  await feedback.save();

  res.json({ feedback: serializeFeedback(feedback) });
});

export const deleteAdminFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    throw new AppError("Feedback entry not found.", 404);
  }

  await feedback.deleteOne();

  res.json({ message: "Feedback deleted successfully." });
});

export const getAdminSubAdmins = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 6,
    maxLimit: 18
  });
  const { filter, hasSearchQuery } = buildTextSearchFilter(search);
  filter.adminRole = ADMIN_ROLES.SUB_ADMIN;

  const [totalItems, totalSubAdmins] = await Promise.all([
    User.countDocuments(filter),
    User.countDocuments({ adminRole: ADMIN_ROLES.SUB_ADMIN })
  ]);
  const pagination = buildPagination(requestedPagination, totalItems);
  const subAdmins = await User.find(
    filter,
    hasSearchQuery ? { score: { $meta: "textScore" } } : {}
  )
    .sort(
      hasSearchQuery
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1 }
    )
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    summary: {
      totalSubAdmins
    },
    subAdmins: subAdmins.map((account) => serializeUser(account)),
    pagination: serializePagination(pagination)
  });
});

export const createSubAdmin = asyncHandler(async (req, res) => {
  const name = validateRequiredTextField(res, "Name", req.body.name, 60);
  const email = validateRequiredTextField(res, "Email", req.body.email, 120).toLowerCase();
  const password = normalizeText(req.body.password);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  if (isMainAdminEmail(email)) {
    throw new AppError("The main admin email is reserved and cannot be added as a sub admin.", 400);
  }

  if (!password || password.length < 6) {
    throw new AppError("Password must be at least 6 characters long.", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const subAdmin = await User.create({
    name,
    email,
    password,
    adminRole: ADMIN_ROLES.SUB_ADMIN
  });

  res.status(201).json({
    message: "Sub admin created successfully.",
    subAdmin: serializeUser(subAdmin)
  });
});

export const deleteSubAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("Sub admin account not found.", 404);
  }

  if (isMainAdminUser(user) || user.adminRole !== ADMIN_ROLES.SUB_ADMIN) {
    throw new AppError("Only sub admin accounts can be deleted from this section.", 400);
  }

  await user.deleteOne();

  res.json({ message: "Sub admin removed successfully." });
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  if (isAdminUser(user)) {
    throw new AppError("Admin accounts cannot be deleted from the user accounts section.", 403);
  }

  const notes = await Note.find({ uploadedBy: user._id });

  for (const note of notes) {
    removeStoredFile(note.filePath);
  }

  await Note.deleteMany({ uploadedBy: user._id });
  await user.deleteOne();

  res.json({ message: "User account deleted successfully." });
});
