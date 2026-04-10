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
      trim: true,
      default: ""
    },
    branchName: {
      type: String,
      trim: true,
      default: ""
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
noteSchema.index({
  courseName: 1,
  branchName: 1,
  specializationName: 1,
  subject: 1,
  unitName: 1,
  status: 1,
  createdAt: -1
});
noteSchema.index({ fileHash: 1 });
noteSchema.index({
  title: "text",
  courseName: "text",
  branchName: "text",
  specializationName: "text",
  subject: "text",
  unitName: "text",
  topicName: "text",
  description: "text"
});

const Note = mongoose.model("Note", noteSchema);
export default Note;
