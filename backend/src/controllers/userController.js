import User from "../models/User.js";
import DownloadRecord from "../models/DownloadRecord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeUser } from "../utils/serializeUser.js";
import { serializeNote } from "../utils/serializeNote.js";
import { buildPagination, parsePagination, serializePagination } from "../utils/pagination.js";
import { normalizeStorageKey, streamStorageObjectToResponse } from "../utils/storageService.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 6,
    maxLimit: 18
  });
  const downloadFilter = { user: req.user._id };
  const totalItems = await DownloadRecord.countDocuments(downloadFilter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const [downloadRecords, uniqueDownloadedNoteIds, totalDownloadActions] = await Promise.all([
    DownloadRecord.find(downloadFilter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate({
        path: "note",
        populate: [
          { path: "uploadedBy", select: "name email avatarPath createdAt updatedAt" },
          { path: "reviewedBy", select: "name email" }
        ]
      }),
    DownloadRecord.distinct("note", { user: req.user._id }),
    DownloadRecord.countDocuments({ user: req.user._id })
  ]);

  const notes = downloadRecords
    .map((record) => record.note)
    .filter((note) => note && note.status === "approved");

  res.json({
    user: serializeUser(req.user),
    stats: {
      notesDownloaded: uniqueDownloadedNoteIds.length,
      downloadActions: totalDownloadActions
    },
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const nextName = typeof req.body.name === "string" ? req.body.name.trim() : "";

  if (nextName) {
    if (nextName.length > 60) {
      res.status(400);
      throw new Error("Name must be 60 characters or fewer.");
    }

    req.user.name = nextName;
  }

  await req.user.save();
  const refreshedUser = await User.findById(req.user._id);

  res.json({
    user: serializeUser(refreshedUser)
  });
});

export const streamAvatar = asyncHandler(async (req, res) => {
  const avatarKey = normalizeStorageKey(req.params[0] || "");

  if (!avatarKey || !avatarKey.startsWith("avatars/")) {
    res.status(404);
    throw new Error("Profile picture not found.");
  }

  await streamStorageObjectToResponse(res, avatarKey, avatarKey.split("/").pop() || "avatar", "inline");
});
