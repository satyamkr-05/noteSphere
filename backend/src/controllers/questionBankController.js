import QuestionPaper from "../models/QuestionPaper.js";
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
import { serializeQuestionPaper } from "../utils/serializeQuestionPaper.js";
import {
  QUESTION_BANK_LIMITS,
  QUESTION_PAPER_EXAM_TYPES
} from "../../../shared/questionBankLimits.js";

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

function validateExamYear(res, value) {
  const parsedYear = Number.parseInt(String(value), 10);
  const currentYear = new Date().getFullYear() + 1;

  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > currentYear) {
    throwBadRequest(res, "Exam year must be a valid year.");
  }

  return parsedYear;
}

function validateOptionalExamYear(res, value) {
  if (value === undefined) {
    return undefined;
  }

  return validateExamYear(res, value);
}

function validateExamType(res, value) {
  const normalizedValue = normalizeText(value);

  if (!QUESTION_PAPER_EXAM_TYPES.includes(normalizedValue)) {
    throwBadRequest(
      res,
      `Exam type must be one of: ${QUESTION_PAPER_EXAM_TYPES.join(", ")}.`
    );
  }

  return normalizedValue;
}

function validateOptionalExamType(res, value) {
  if (value === undefined) {
    return undefined;
  }

  return validateExamType(res, value);
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

function buildApprovedQuestionPaperFilter(query = {}) {
  const filter = { status: "approved" };
  const normalizedQuery = normalizeText(query.q);

  if (normalizedQuery) {
    filter.$text = { $search: normalizedQuery };
  }

  applyExactMatch(filter, "universityName", query.universityName);
  applyExactMatch(filter, "courseName", query.courseName);
  applyExactMatch(filter, "semester", query.semester);
  applyExactMatch(filter, "subjectName", query.subjectName);
  applyExactMatch(filter, "examType", query.examType);

  if (query.examYear) {
    const parsedYear = Number.parseInt(String(query.examYear), 10);

    if (Number.isInteger(parsedYear)) {
      filter.examYear = parsedYear;
    }
  }

  return {
    filter,
    hasSearchQuery: Boolean(normalizedQuery)
  };
}

function buildDistinctApprovedFilter(query = {}) {
  const filter = { status: "approved" };
  applyExactMatch(filter, "universityName", query.universityName);
  applyExactMatch(filter, "courseName", query.courseName);
  applyExactMatch(filter, "semester", query.semester);
  applyExactMatch(filter, "subjectName", query.subjectName);
  return filter;
}

function sortSemesterValues(values) {
  return [...values].sort((left, right) => {
    const leftMatch = left.match(/\d+/);
    const rightMatch = right.match(/\d+/);
    const leftNumber = leftMatch ? Number.parseInt(leftMatch[0], 10) : Number.MAX_SAFE_INTEGER;
    const rightNumber = rightMatch ? Number.parseInt(rightMatch[0], 10) : Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.localeCompare(right);
  });
}

async function populateQuestionPaperRelations(paper) {
  await paper.populate("uploadedBy", "name email");
  await paper.populate("reviewedBy", "name email");
  return paper;
}

function canAccessQuestionPaperFile(paper, user) {
  if (!paper || !user) {
    return false;
  }

  if (paper.status === "approved") {
    return true;
  }

  if (user.isAdmin) {
    return true;
  }

  return paper.uploadedBy.toString() === user._id.toString();
}

async function findAccessibleQuestionPaperFile(req, res) {
  const paper = await QuestionPaper.findById(req.params.id);

  if (!paper) {
    res.status(404);
    throw new Error("Question paper not found.");
  }

  if (!canAccessQuestionPaperFile(paper, req.user)) {
    res.status(403);
    throw new Error("You do not have access to this question paper file.");
  }

  if (!hasStoredFile(paper.filePath)) {
    res.status(404);
    throw new Error("The question paper file could not be found.");
  }

  return paper;
}

function sendQuestionPaperFileResponse(res, paper, disposition = "inline") {
  const absolutePath = buildStoredFileAbsolutePath(paper.filePath);
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(paper.fileName)}"`);
  res.type(paper.fileName);
  res.sendFile(absolutePath);
}

async function ensureUniqueFileHash(res, fileHash, currentPaperId = "") {
  const duplicateQuery = { fileHash };

  if (currentPaperId) {
    duplicateQuery._id = { $ne: currentPaperId };
  }

  const duplicatePaper = await QuestionPaper.findOne(duplicateQuery).select(
    "_id title subjectName examYear examType"
  );

  if (duplicatePaper) {
    throwBadRequest(
      res,
      "This question paper file has already been uploaded. Please upload a different file."
    );
  }
}

export const getQuestionBankUniversities = asyncHandler(async (_req, res) => {
  const universities = await QuestionPaper.distinct("universityName", { status: "approved" });
  res.json({ universities: universities.sort((left, right) => left.localeCompare(right)) });
});

export const getQuestionBankCourses = asyncHandler(async (req, res) => {
  const courses = await QuestionPaper.distinct(
    "courseName",
    buildDistinctApprovedFilter({ universityName: req.query.universityName })
  );
  res.json({ courses: courses.sort((left, right) => left.localeCompare(right)) });
});

export const getQuestionBankSemesters = asyncHandler(async (req, res) => {
  const semesters = await QuestionPaper.distinct(
    "semester",
    buildDistinctApprovedFilter({
      universityName: req.query.universityName,
      courseName: req.query.courseName
    })
  );
  res.json({ semesters: sortSemesterValues(semesters) });
});

export const getQuestionBankSubjects = asyncHandler(async (req, res) => {
  const subjects = await QuestionPaper.distinct(
    "subjectName",
    buildDistinctApprovedFilter({
      universityName: req.query.universityName,
      courseName: req.query.courseName,
      semester: req.query.semester
    })
  );
  res.json({ subjects: subjects.sort((left, right) => left.localeCompare(right)) });
});

export const getQuestionPapers = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 12,
    maxLimit: 36
  });
  const { filter, hasSearchQuery } = buildApprovedQuestionPaperFilter(req.query);
  const totalItems = await QuestionPaper.countDocuments(filter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const papers = await QuestionPaper.find(
    filter,
    hasSearchQuery ? { score: { $meta: "textScore" } } : {}
  )
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort(
      hasSearchQuery
        ? { score: { $meta: "textScore" }, featured: -1, examYear: -1, createdAt: -1 }
        : { featured: -1, examYear: -1, createdAt: -1 }
    )
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    papers: papers.map((paper) => serializeQuestionPaper(req, paper)),
    pagination: serializePagination(pagination)
  });
});

export const getTrendingQuestionPapers = asyncHandler(async (req, res) => {
  const papers = await QuestionPaper.find({ status: "approved" })
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ downloads: -1, examYear: -1, createdAt: -1 })
    .limit(6);

  res.json({ papers: papers.map((paper) => serializeQuestionPaper(req, paper)) });
});

export const getMyQuestionPapers = asyncHandler(async (req, res) => {
  const requestedPagination = parsePagination(req.query, {
    defaultLimit: 9,
    maxLimit: 30
  });
  const filter = { uploadedBy: req.user._id };
  const totalItems = await QuestionPaper.countDocuments(filter);
  const pagination = buildPagination(requestedPagination, totalItems);

  const papers = await QuestionPaper.find(filter)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  res.json({
    papers: papers.map((paper) => serializeQuestionPaper(req, paper)),
    pagination: serializePagination(pagination)
  });
});

export const getQuestionPaperById = asyncHandler(async (req, res) => {
  const paper = await QuestionPaper.findOne({
    _id: req.params.id,
    status: "approved"
  })
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");

  if (!paper) {
    res.status(404);
    throw new Error("Question paper not found.");
  }

  res.json({ paper: serializeQuestionPaper(req, paper) });
});

export const createQuestionPaper = asyncHandler(async (req, res) => {
  const {
    title,
    universityName,
    courseName,
    semester,
    subjectName,
    examYear,
    examType,
    description = "",
    featured = "false"
  } = req.body;

  if (!req.file) {
    throwBadRequest(res, "Please upload a file for the question paper.");
  }

  const normalizedUniversityName = validateRequiredTextField(
    res,
    "University",
    universityName,
    QUESTION_BANK_LIMITS.universityMaxLength
  );
  const normalizedCourseName = validateRequiredTextField(
    res,
    "Course",
    courseName,
    QUESTION_BANK_LIMITS.courseMaxLength
  );
  const normalizedSemester = validateRequiredTextField(
    res,
    "Semester",
    semester,
    QUESTION_BANK_LIMITS.semesterMaxLength
  );
  const normalizedSubjectName = validateRequiredTextField(
    res,
    "Subject",
    subjectName,
    QUESTION_BANK_LIMITS.subjectMaxLength
  );
  const normalizedExamType = validateExamType(res, examType);
  const normalizedExamYear = validateExamYear(res, examYear);
  const normalizedTitle =
    normalizeText(title) ||
    `${normalizedExamYear} ${normalizedExamType}`;
  const validatedTitle = validateRequiredTextField(
    res,
    "Title",
    normalizedTitle,
    QUESTION_BANK_LIMITS.titleMaxLength
  );
  const normalizedDescription = validateOptionalTextField(
    res,
    "Description",
    description,
    QUESTION_BANK_LIMITS.descriptionMaxLength
  ) ?? "";
  const fileHash = await hashFileAtPath(req.file.path);

  try {
    await ensureUniqueFileHash(res, fileHash);
  } catch (error) {
    removeStoredFile(req.file.path);
    throw error;
  }

  const paper = await QuestionPaper.create({
    title: validatedTitle,
    universityName: normalizedUniversityName,
    courseName: normalizedCourseName,
    semester: normalizedSemester,
    subjectName: normalizedSubjectName,
    examYear: normalizedExamYear,
    examType: normalizedExamType,
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

  const populatedPaper = await populateQuestionPaperRelations(paper);
  res.status(201).json({ paper: serializeQuestionPaper(req, populatedPaper) });
});

export const updateQuestionPaper = asyncHandler(async (req, res) => {
  const paper = await QuestionPaper.findById(req.params.id)
    .populate("uploadedBy", "name email")
    .populate("reviewedBy", "name email");

  if (!paper) {
    res.status(404);
    throw new Error("Question paper not found.");
  }

  if (paper.uploadedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update your own question papers.");
  }

  const { title, universityName, courseName, semester, subjectName, examYear, examType, description, featured } =
    req.body;

  paper.universityName =
    validateOptionalTextField(
      res,
      "University",
      universityName,
      QUESTION_BANK_LIMITS.universityMaxLength
    ) ?? paper.universityName;
  paper.courseName =
    validateOptionalTextField(
      res,
      "Course",
      courseName,
      QUESTION_BANK_LIMITS.courseMaxLength
    ) ?? paper.courseName;
  paper.semester =
    validateOptionalTextField(
      res,
      "Semester",
      semester,
      QUESTION_BANK_LIMITS.semesterMaxLength
    ) ?? paper.semester;
  paper.subjectName =
    validateOptionalTextField(
      res,
      "Subject",
      subjectName,
      QUESTION_BANK_LIMITS.subjectMaxLength
    ) ?? paper.subjectName;
  paper.examYear = validateOptionalExamYear(res, examYear) ?? paper.examYear;
  paper.examType = validateOptionalExamType(res, examType) ?? paper.examType;
  paper.title =
    validateOptionalTextField(res, "Title", title, QUESTION_BANK_LIMITS.titleMaxLength) ?? paper.title;
  paper.description =
    validateOptionalTextField(
      res,
      "Description",
      description,
      QUESTION_BANK_LIMITS.descriptionMaxLength
    ) ?? paper.description;

  if (featured !== undefined) {
    paper.featured = featured === "true" || featured === true;
  }

  paper.status = "approved";
  paper.reviewedBy = null;
  paper.reviewedAt = null;

  if (req.file) {
    const nextFileHash = await hashFileAtPath(req.file.path);

    try {
      await ensureUniqueFileHash(res, nextFileHash, paper._id.toString());
    } catch (error) {
      removeStoredFile(req.file.path);
      throw error;
    }

    removeStoredFile(paper.filePath);
    paper.fileName = req.file.originalname;
    paper.filePath = `/uploads/${req.file.filename}`;
    paper.fileHash = nextFileHash;
  }

  const updatedPaper = await paper.save();
  await populateQuestionPaperRelations(updatedPaper);

  res.json({ paper: serializeQuestionPaper(req, updatedPaper) });
});

export const deleteQuestionPaper = asyncHandler(async (req, res) => {
  const paper = await QuestionPaper.findById(req.params.id).populate("uploadedBy", "name email");

  if (!paper) {
    res.status(404);
    throw new Error("Question paper not found.");
  }

  if (paper.uploadedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own question papers.");
  }

  removeStoredFile(paper.filePath);
  await paper.deleteOne();

  res.json({ message: "Question paper deleted successfully." });
});

export const registerQuestionPaperDownload = asyncHandler(async (req, res) => {
  const paper = await findAccessibleQuestionPaperFile(req, res);

  if (paper.status === "approved") {
    paper.downloads += 1;
    await paper.save();
  }

  sendQuestionPaperFileResponse(res, paper, "attachment");
});

export const streamQuestionPaperFile = asyncHandler(async (req, res) => {
  const paper = await findAccessibleQuestionPaperFile(req, res);
  sendQuestionPaperFileResponse(
    res,
    paper,
    req.query.disposition === "attachment" ? "attachment" : "inline"
  );
});
