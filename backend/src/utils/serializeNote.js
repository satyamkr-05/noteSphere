function serializePerson(person) {
  if (!person) {
    return null;
  }

  return {
    id: person._id,
    name: person.name,
    email: person.email
  };
}

export function serializeNote(req, note) {
  const courseName = note.courseName?.trim() || "General";
  const branchName = note.branchName?.trim() || "General";
  const specializationName = note.specializationName?.trim() || "";
  const subject = note.subject?.trim() || "General";
  const unitName = note.unitName?.trim() || "";
  const topicName = note.topicName?.trim() || "";
  const academicPath = [courseName, branchName, specializationName, subject].filter(Boolean).join(" > ");

  return {
    id: note._id,
    title: note.title,
    courseName,
    branchName,
    specializationName,
    subject,
    unitName,
    topicName,
    academicPath,
    unitPath: [academicPath, unitName].filter(Boolean).join(" > "),
    description: note.description,
    fileName: note.fileName,
    downloads: note.downloads,
    status: note.status,
    featured: note.featured,
    reviewedAt: note.reviewedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    uploadedBy: serializePerson(note.uploadedBy),
    reviewedBy: serializePerson(note.reviewedBy)
  };
}
