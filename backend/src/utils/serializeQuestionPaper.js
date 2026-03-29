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

export function serializeQuestionPaper(_req, paper) {
  return {
    id: paper._id,
    title: paper.title,
    universityName: paper.universityName,
    courseName: paper.courseName,
    semester: paper.semester,
    subjectName: paper.subjectName,
    examYear: paper.examYear,
    examType: paper.examType,
    description: paper.description,
    fileName: paper.fileName,
    downloads: paper.downloads,
    status: paper.status,
    featured: paper.featured,
    reviewedAt: paper.reviewedAt,
    createdAt: paper.createdAt,
    updatedAt: paper.updatedAt,
    pathLabel: `${paper.universityName} > ${paper.courseName} > ${paper.semester} > ${paper.subjectName}`,
    paperLabel: `${paper.examYear} ${paper.examType}`,
    uploadedBy: serializePerson(paper.uploadedBy),
    reviewedBy: serializePerson(paper.reviewedBy)
  };
}
