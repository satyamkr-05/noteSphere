import Note from "../models/Note.js";
import User from "../models/User.js";
import DownloadRecord from "../models/DownloadRecord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeUser } from "../utils/serializeUser.js";
import { serializeNote } from "../utils/serializeNote.js";
import { buildPagination, parsePagination, serializePagination } from "../utils/pagination.js";
import { removeAvatarFile } from "../utils/userFiles.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 6,
    maxLimit: 18
  });
  const uploadedFilter = { uploadedBy: req.user._id };
  const totalItems = await Note.countDocuments(uploadedFilter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const [notes, uploadSummary, uniqueDownloadedNoteIds, totalDownloadActions] = await Promise.all([
    Note.find(uploadedFilter)
      .populate("uploadedBy", "name email avatarPath createdAt updatedAt")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Note.aggregate([
      { $match: uploadedFilter },
      {
        $group: {
          _id: null,
          totalUploads: { $sum: 1 },
          approvedUploads: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0]
            }
          },
          pendingUploads: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
            }
          },
          featuredUploads: {
            $sum: {
              $cond: [{ $eq: ["$featured", true] }, 1, 0]
            }
          },
          totalUploadDownloads: { $sum: "$downloads" }
        }
      }
    ]),
    DownloadRecord.distinct("note", { user: req.user._id }),
    DownloadRecord.countDocuments({ user: req.user._id })
  ]);

  const stats = uploadSummary[0] || {
    totalUploads: 0,
    approvedUploads: 0,
    pendingUploads: 0,
    featuredUploads: 0,
    totalUploadDownloads: 0
  };

  res.json({
    user: serializeUser(req.user),
    stats: {
      totalUploads: stats.totalUploads,
      approvedUploads: stats.approvedUploads,
      pendingUploads: stats.pendingUploads,
      featuredUploads: stats.featuredUploads,
      totalUploadDownloads: stats.totalUploadDownloads,
      notesDownloaded: uniqueDownloadedNoteIds.length,
      downloadActions: totalDownloadActions
    },
    notes: notes.map((note) => serializeNote(req, note)),
    pagination: serializePagination(pagination)
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const nextName = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const shouldRemoveAvatar =
    req.body.removeAvatar === true ||
    req.body.removeAvatar === "true" ||
    req.body.removeAvatar === "1";

  if (nextName) {
    if (nextName.length > 60) {
      res.status(400);
      throw new Error("Name must be 60 characters or fewer.");
    }

    req.user.name = nextName;
  }

  if (shouldRemoveAvatar && req.user.avatarPath) {
    removeAvatarFile(req.user.avatarPath);
    req.user.avatarPath = "";
  }

  if (req.file) {
    removeAvatarFile(req.user.avatarPath);
    req.user.avatarPath = `/media/avatars/${req.file.filename}`;
  }

  await req.user.save();
  const refreshedUser = await User.findById(req.user._id);

  res.json({
    user: serializeUser(refreshedUser)
  });
});
