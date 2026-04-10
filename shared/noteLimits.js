import {
  NOTE_FILE_ACCEPT,
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES,
  NOTE_FILE_SIZE_BYTES,
  NOTE_FILE_SIZE_LABEL,
  NOTE_FILE_SIZE_MB,
  NOTE_FILE_TYPES_LABEL
} from "./uploadLimitsShared.js";

export const NOTE_LIMITS = Object.freeze({
  titleMaxLength: 100,
  courseMaxLength: 60,
  branchMaxLength: 60,
  specializationMaxLength: 80,
  subjectMaxLength: 60,
  unitMaxLength: 60,
  topicMaxLength: 80,
  descriptionMaxLength: 500,
  fileSizeBytes: NOTE_FILE_SIZE_BYTES
});

export {
  NOTE_FILE_ACCEPT,
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES,
  NOTE_FILE_SIZE_LABEL,
  NOTE_FILE_SIZE_MB,
  NOTE_FILE_TYPES_LABEL
};
