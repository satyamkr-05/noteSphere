export const NOTE_LIMITS = Object.freeze({
  titleMaxLength: 100,
  subjectMaxLength: 60,
  descriptionMaxLength: 500,
  fileSizeBytes: 10 * 1024 * 1024
});

export const NOTE_FILE_EXTENSIONS = Object.freeze([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".ppt",
  ".pptx",
  ".jpg",
  ".png"
]);

export const NOTE_FILE_MIME_TYPES = Object.freeze([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png"
]);

export const NOTE_FILE_ACCEPT = NOTE_FILE_EXTENSIONS.join(",");
export const NOTE_FILE_TYPES_LABEL = "PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG";
export const NOTE_FILE_SIZE_MB = NOTE_LIMITS.fileSizeBytes / (1024 * 1024);
export const NOTE_FILE_SIZE_LABEL = `${NOTE_FILE_SIZE_MB} MB`;
