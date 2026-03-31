import {
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_SIZE_LABEL,
  NOTE_FILE_TYPES_LABEL,
  NOTE_LIMITS
} from "../../shared/noteLimits.js";

const noteFields = [
  ["title", "Title", NOTE_LIMITS.titleMaxLength],
  ["subject", "Subject", NOTE_LIMITS.subjectMaxLength]
];

export function formatCharacterCount(value, maxLength) {
  return `${value.length}/${maxLength} characters`;
}

export function validateNoteForm(form) {
  const normalizedForm = {
    title: form.title.trim(),
    subject: form.subject.trim(),
    description: form.description.trim(),
    featured: Boolean(form.featured)
  };

  for (const [field, label, maxLength] of noteFields) {
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

  if (normalizedForm.description.length > NOTE_LIMITS.descriptionMaxLength) {
    return {
      error: `Description must be ${NOTE_LIMITS.descriptionMaxLength} characters or fewer.`,
      value: normalizedForm
    };
  }

  return {
    error: "",
    value: normalizedForm
  };
}

export function validateNoteFile(file) {
  if (!file) {
    return "";
  }

  if (file.size > NOTE_LIMITS.fileSizeBytes) {
    return `File is too large. Maximum allowed size is ${NOTE_FILE_SIZE_LABEL}.`;
  }

  const lowerCaseName = file.name.toLowerCase();
  const hasAllowedExtension = NOTE_FILE_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension));

  if (!hasAllowedExtension) {
    return `Unsupported file type. Upload ${NOTE_FILE_TYPES_LABEL}.`;
  }

  return "";
}
