import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    branchName: {
      type: String,
      required: true,
      trim: true
    },
    specializationName: {
      type: String,
      trim: true,
      default: ""
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    unitName: {
      type: String,
      trim: true,
      default: ""
    },
    topicName: {
      type: String,
      trim: true,
      default: ""
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileHash: {
      type: String,
      default: ""
    },
    downloads: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    featured: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ status: 1, featured: -1, createdAt: -1 });
noteSchema.index({ status: 1, downloads: -1, createdAt: -1 });
noteSchema.index({ uploadedBy: 1, createdAt: -1 });
noteSchema.index({ subject: 1, status: 1, createdAt: -1 });
noteSchema.index({ courseName: 1, status: 1, createdAt: -1 });
noteSchema.index({ fileHash: 1 });

const Note = mongoose.model("Note", noteSchema);
export default Note;
