import mongoose from "mongoose";
import { QUESTION_PAPER_EXAM_TYPES } from "../../../shared/questionBankLimits.js";

const questionPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    universityName: {
      type: String,
      required: true,
      trim: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    examYear: {
      type: Number,
      default: null
    },
    examType: {
      type: String,
      enum: QUESTION_PAPER_EXAM_TYPES,
      required: true
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
      default: "approved"
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

questionPaperSchema.index({
  status: 1,
  universityName: 1,
  courseName: 1,
  semester: 1,
  subjectName: 1,
  examYear: -1
});
questionPaperSchema.index({ status: 1, featured: -1, createdAt: -1 });
questionPaperSchema.index({ status: 1, downloads: -1, createdAt: -1 });
questionPaperSchema.index({ uploadedBy: 1, createdAt: -1 });
questionPaperSchema.index({ fileHash: 1 });
questionPaperSchema.index({
  title: "text",
  universityName: "text",
  courseName: "text",
  semester: "text",
  subjectName: "text",
  description: "text"
});

const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);
export default QuestionPaper;
