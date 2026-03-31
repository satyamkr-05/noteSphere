import { useEffect, useRef, useState } from "react";
import {
  QUESTION_BANK_FILE_ACCEPT,
  QUESTION_BANK_FILE_SIZE_LABEL,
  QUESTION_BANK_FILE_TYPES_LABEL,
  QUESTION_BANK_LIMITS,
  QUESTION_PAPER_EXAM_TYPES
} from "../../shared/questionBankLimits.js";
import QuestionPaperPreviewModal from "./QuestionPaperPreviewModal";
import PaginationControls from "./PaginationControls";
import { useReveal } from "./useReveal";
import api, { getErrorMessage } from "../services/api";
import {
  formatQuestionBankCharacterCount,
  validateQuestionPaperFile,
  validateQuestionPaperForm
} from "../utils/questionBankValidation";

const initialForm = {
  title: "",
  universityName: "",
  courseName: "",
  semester: "",
  subjectName: "",
  examYear: "",
  examType: QUESTION_PAPER_EXAM_TYPES[0],
  description: "",
  featured: false
};

const initialPagination = {
  currentPage: 1,
  limit: 6,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

export default function QuestionPaperUploadPanel({ onPapersChanged, showToast }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("Choose a question paper or drag it here");
  const [editingId, setEditingId] = useState("");
  const [papers, setPapers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [previewPaper, setPreviewPaper] = useState(null);
  const fileInputRef = useRef(null);

  useReveal([isSaving, papers.length, editingId]);

  useEffect(() => {
    loadMyQuestionPapers(currentPage);
  }, [currentPage]);

  async function loadMyQuestionPapers(pageToLoad = currentPage) {
    try {
      const response = await api.get("/question-bank/papers/mine", {
        params: {
          page: pageToLoad,
          limit: initialPagination.limit
        }
      });
      setPapers(response.data.papers || []);
      setPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setPapers([]);
      setPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load your question papers."), "error");
    }
  }

  function resetForm() {
    setForm(initialForm);
    setFile(null);
    setEditingId("");
    setFileLabel("Choose a question paper or drag it here");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    const fileError = validateQuestionPaperFile(selectedFile);
    const fallbackLabel = editingId ? fileLabel : "Choose a question paper or drag it here";

    if (fileError) {
      setFile(null);
      setFileLabel(fallbackLabel);
      event.target.value = "";
      showToast(fileError, "error");
      return;
    }

    setFile(selectedFile);
    setFileLabel(selectedFile ? selectedFile.name : "Choose a question paper or drag it here");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { error, value } = validateQuestionPaperForm(form);

    if (error) {
      showToast(error, "error");
      return;
    }

    if (!editingId && !file) {
      showToast("Please choose a file for the question paper.", "error");
      return;
    }

    if (!editingId || file) {
      const fileError = validateQuestionPaperFile(file);

      if (fileError) {
        showToast(fileError, "error");
        return;
      }
    }

    const payload = new FormData();
    payload.append("title", value.title);
    payload.append("universityName", value.universityName);
    payload.append("courseName", value.courseName);
    payload.append("semester", value.semester);
    payload.append("subjectName", value.subjectName);
    payload.append("examYear", value.examYear);
    payload.append("examType", value.examType);
    payload.append("description", value.description);
    payload.append("featured", String(value.featured));

    if (file) {
      payload.append("file", file);
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await api.put(`/question-bank/papers/${editingId}`, payload);
        showToast("Question paper updated successfully.", "success");
      } else {
        await api.post("/question-bank/papers", payload);
        showToast("Question paper uploaded successfully.", "success");
      }

      resetForm();
      await loadMyQuestionPapers(currentPage);
      onPapersChanged?.();
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          editingId ? "Unable to update this question paper." : "Unable to save this question paper."
        ),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(paper) {
    setEditingId(paper.id);
    setForm({
      title: paper.title,
      universityName: paper.universityName,
      courseName: paper.courseName,
      semester: paper.semester,
      subjectName: paper.subjectName,
      examYear: paper.examYear ? String(paper.examYear) : "",
      examType: paper.examType,
      description: paper.description || "",
      featured: paper.featured
    });
    setFile(null);
    setFileLabel(paper.fileName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(paperId) {
    try {
      await api.delete(`/question-bank/papers/${paperId}`);
      showToast("Question paper deleted successfully.", "success");
      if (editingId === paperId) {
        resetForm();
      }
      await loadMyQuestionPapers(currentPage);
      onPapersChanged?.();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this question paper."), "error");
    }
  }

  return (
    <>
      <div className="split-layout">
        <div className="split-layout__intro reveal">
          <span className="eyebrow">Upload Question Bank</span>
          <h2>Upload or edit question papers</h2>
          <p>Keep papers structured by university, course, semester, subject, and exam type.</p>

          <div className="info-stack">
            <article className="info-card glass-card">
              <i className="fa-solid fa-folder-tree"></i>
              <div>
                <h3>{editingId ? "Edit mode is active" : "Structured uploads"}</h3>
                <p>
                  {editingId
                    ? "Update the selected paper here and save the latest details."
                    : "Upload papers in a way that keeps the question bank easy to browse."}
                </p>
              </div>
            </article>
          </div>
        </div>

        <form className="upload-form glass-card reveal" onSubmit={handleSubmit}>
          <div className="section-heading dashboard-editor__heading">
            <span className="eyebrow">{editingId ? "Edit Question Paper" : "Upload Question Paper"}</span>
            <h2>{editingId ? "Update selected paper" : "Share a new question paper"}</h2>
            <p>Fill in the hierarchy once so students can find the right paper quickly.</p>
          </div>

          <div className="question-bank-form-grid">
            <div className="form-group">
              <label htmlFor="paperTitle">Title</label>
              <input
                type="text"
                id="paperTitle"
                placeholder="e.g. 2024 Mid Sem"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={QUESTION_BANK_LIMITS.titleMaxLength}
                required
              />
              <small className="form-hint">
                <span>Max {QUESTION_BANK_LIMITS.titleMaxLength} characters.</span>
                <span>{formatQuestionBankCharacterCount(form.title, QUESTION_BANK_LIMITS.titleMaxLength)}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="paperUniversity">University</label>
              <input
                type="text"
                id="paperUniversity"
                placeholder="e.g. AKTU"
                value={form.universityName}
                onChange={(event) => setForm((current) => ({ ...current, universityName: event.target.value }))}
                maxLength={QUESTION_BANK_LIMITS.universityMaxLength}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperCourse">Course</label>
              <input
                type="text"
                id="paperCourse"
                placeholder="e.g. B.Tech"
                value={form.courseName}
                onChange={(event) => setForm((current) => ({ ...current, courseName: event.target.value }))}
                maxLength={QUESTION_BANK_LIMITS.courseMaxLength}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperSemester">Semester</label>
              <input
                type="text"
                id="paperSemester"
                placeholder="e.g. Sem 3"
                value={form.semester}
                onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))}
                maxLength={QUESTION_BANK_LIMITS.semesterMaxLength}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperSubject">Subject</label>
              <input
                type="text"
                id="paperSubject"
                placeholder="e.g. Data Structures"
                value={form.subjectName}
                onChange={(event) => setForm((current) => ({ ...current, subjectName: event.target.value }))}
                maxLength={QUESTION_BANK_LIMITS.subjectMaxLength}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperYear">Exam Year</label>
              <input
                type="number"
                id="paperYear"
                min="2000"
                max={new Date().getFullYear() + 1}
                placeholder="Optional"
                value={form.examYear}
                onChange={(event) => setForm((current) => ({ ...current, examYear: event.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperType">Exam Type</label>
              <select
                id="paperType"
                value={form.examType}
                onChange={(event) => setForm((current) => ({ ...current, examType: event.target.value }))}
              >
                {QUESTION_PAPER_EXAM_TYPES.map((examType) => (
                  <option key={examType} value={examType}>
                    {examType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paperDescription">Description</label>
            <textarea
              id="paperDescription"
              rows="4"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              maxLength={QUESTION_BANK_LIMITS.descriptionMaxLength}
            ></textarea>
            <small className="form-hint">
              <span>Optional. Keep it short and informative if you add one.</span>
              <span>
                {formatQuestionBankCharacterCount(form.description, QUESTION_BANK_LIMITS.descriptionMaxLength)}
              </span>
            </small>
          </div>

          <div className="form-group checkbox-row">
            <input
              id="paperFeatured"
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
            />
            <label htmlFor="paperFeatured">Mark as featured</label>
          </div>

          <div className="form-group">
            <label htmlFor="paperFile">{editingId ? "Replace File" : "Upload File"}</label>
            <label className="file-dropzone" htmlFor="paperFile">
              <input
                ref={fileInputRef}
                type="file"
                id="paperFile"
                accept={QUESTION_BANK_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!editingId}
              />
              <i className="fa-solid fa-file-arrow-up"></i>
              <span>{fileLabel}</span>
              <small>
                {editingId
                  ? `Leave empty to keep the current file. Accepted: ${QUESTION_BANK_FILE_TYPES_LABEL}. Max size: ${QUESTION_BANK_FILE_SIZE_LABEL}.`
                  : `Accepted: ${QUESTION_BANK_FILE_TYPES_LABEL}. Max size: ${QUESTION_BANK_FILE_SIZE_LABEL}.`}
              </small>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
              <i className={`fa-solid ${editingId ? "fa-floppy-disk" : "fa-upload"}`}></i>
              {isSaving ? "Saving..." : editingId ? "Update Question Paper" : "Share Question Paper"}
            </button>
            {editingId ? (
              <button type="button" className="btn btn--secondary btn--full" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <section className="section section--compact">
        <div className="section-heading reveal">
          <span className="eyebrow">My Question Bank Uploads</span>
          <h2>Your uploaded papers</h2>
        </div>

        <div className="notes-grid notes-grid--compact">
          {papers.map((paper) => (
            <article key={paper.id} className="note-card glass-card reveal is-visible">
              <div className="note-card__topbar">
                <span className="note-card__chip">{paper.subjectName}</span>
                <button
                  type="button"
                  className="note-card__icon-action"
                  onClick={() => startEditing(paper)}
                  aria-label={`Edit ${paper.title}`}
                  title="Edit question paper"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
              </div>
              <h3>{paper.title}</h3>
              <p>{paper.pathLabel}</p>
              <div className="note-card__meta">
                <span><i className="fa-solid fa-calendar"></i> {paper.paperLabel}</span>
                <span><i className="fa-solid fa-download"></i> {paper.downloads}</span>
              </div>
              <div className="note-card__meta">
                <span><i className="fa-solid fa-file-lines"></i> {paper.fileName}</span>
              </div>
              <div className="note-card__meta">
                <span className={`status-badge status-badge--${paper.status || "pending"}`}>
                  {paper.status || "pending"}
                </span>
              </div>
              <div className="note-card__actions">
                <div className="note-card__buttons">
                  <button type="button" className="btn btn--secondary" onClick={() => setPreviewPaper(paper)}>
                    Preview
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => handleDelete(paper.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {papers.length === 0 ? (
          <p className="empty-state glass-card">You have not uploaded any question papers yet.</p>
        ) : null}

        {papers.length > 0 ? (
          <PaginationControls pagination={pagination} onPageChange={setCurrentPage} itemLabel="papers" />
        ) : null}
      </section>

      <QuestionPaperPreviewModal
        paper={previewPaper}
        onClose={() => setPreviewPaper(null)}
        showToast={showToast}
      />
    </>
  );
}
