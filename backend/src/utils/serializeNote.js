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
  return {
    id: note._id,
    title: note.title,
    subject: note.subject,
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
