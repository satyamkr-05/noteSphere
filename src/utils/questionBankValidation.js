import {
  QUESTION_BANK_FILE_EXTENSIONS,
  QUESTION_BANK_FILE_SIZE_LABEL,
  QUESTION_BANK_FILE_TYPES_LABEL,
  QUESTION_BANK_LIMITS,
  QUESTION_PAPER_EXAM_TYPES
} from "../../shared/questionBankLimits.js";

const questionPaperFields = [
  ["title", "Title", QUESTION_BANK_LIMITS.titleMaxLength],
  ["universityName", "University", QUESTION_BANK_LIMITS.universityMaxLength],
  ["courseName", "Course", QUESTION_BANK_LIMITS.courseMaxLength],
  ["semester", "Semester", QUESTION_BANK_LIMITS.semesterMaxLength],
  ["subjectName", "Subject", QUESTION_BANK_LIMITS.subjectMaxLength]
];

export function formatQuestionBankCharacterCount(value, maxLength) {
  return `${value.length}/${maxLength} characters`;
}

export function validateQuestionPaperForm(form) {
  const normalizedForm = {
    title: form.title.trim(),
    universityName: form.universityName.trim(),
    courseName: form.courseName.trim(),
    semester: form.semester.trim(),
    subjectName: form.subjectName.trim(),
    examYear: String(form.examYear || "").trim(),
    examType: String(form.examType || "").trim(),
    description: form.description.trim(),
    featured: Boolean(form.featured)
  };

  for (const [field, label, maxLength] of questionPaperFields) {
    if (!normalizedForm[field]) {
      return {
        error: `${label} is required.`,
        value: normalizedForm
      };
    }

    if (normalizedForm[field].length > maxLength) {
      return {
        error: `${label} must be ${maxLength} characters or fewer.`,
        value: normalizedForm
      };
    }
  }

  if (!QUESTION_PAPER_EXAM_TYPES.includes(normalizedForm.examType)) {
    return {
      error: "Please choose a valid exam type.",
      value: normalizedForm
    };
  }

  if (normalizedForm.description.length > QUESTION_BANK_LIMITS.descriptionMaxLength) {
    return {
      error: `Description must be ${QUESTION_BANK_LIMITS.descriptionMaxLength} characters or fewer.`,
      value: normalizedForm
    };
  }

  let normalizedExamYear = "";

  if (normalizedForm.examYear) {
    const parsedYear = Number.parseInt(normalizedForm.examYear, 10);
    const currentYear = new Date().getFullYear() + 1;

    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > currentYear) {
      return {
        error: "Exam year must be a valid year.",
        value: normalizedForm
      };
    }

    normalizedExamYear = String(parsedYear);
  }

  return {
    error: "",
    value: {
      ...normalizedForm,
      examYear: normalizedExamYear
    }
  };
}

export function validateQuestionPaperFile(file) {
  if (!file) {
    return "";
  }

  if (file.size > QUESTION_BANK_LIMITS.fileSizeBytes) {
    return `File is too large. Maximum allowed size is ${QUESTION_BANK_FILE_SIZE_LABEL}.`;
  }

  const lowerCaseName = file.name.toLowerCase();
  const hasAllowedExtension = QUESTION_BANK_FILE_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension)
  );

  if (!hasAllowedExtension) {
    return `Unsupported file type. Upload ${QUESTION_BANK_FILE_TYPES_LABEL}.`;
  }

  return "";
}
