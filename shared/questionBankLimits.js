import {
  NOTE_FILE_ACCEPT,
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES,
  NOTE_FILE_SIZE_BYTES,
  NOTE_FILE_SIZE_LABEL,
  NOTE_FILE_TYPES_LABEL
} from "./uploadLimitsShared.js";

export const QUESTION_BANK_LIMITS = Object.freeze({
  titleMaxLength: 120,
  universityMaxLength: 80,
  courseMaxLength: 80,
  semesterMaxLength: 20,
  subjectMaxLength: 80,
  descriptionMaxLength: 500,
  fileSizeBytes: NOTE_FILE_SIZE_BYTES
});

export const QUESTION_PAPER_EXAM_TYPES = Object.freeze([
  "Mid Sem",
  "End Sem",
  "Sessional",
  "Practical",
  "Other"
]);

export {
  NOTE_FILE_ACCEPT as QUESTION_BANK_FILE_ACCEPT,
  NOTE_FILE_EXTENSIONS as QUESTION_BANK_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES as QUESTION_BANK_FILE_MIME_TYPES,
  NOTE_FILE_SIZE_LABEL as QUESTION_BANK_FILE_SIZE_LABEL,
  NOTE_FILE_TYPES_LABEL as QUESTION_BANK_FILE_TYPES_LABEL
};
