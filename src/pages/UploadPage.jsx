import { useEffect, useRef, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import QuestionPaperUploadPanel from "../components/QuestionPaperUploadPanel";
import api, { getErrorMessage } from "../services/api";
import { useReveal } from "../components/useReveal";
import {
  NOTE_FILE_ACCEPT,
  NOTE_FILE_SIZE_LABEL,
  NOTE_FILE_TYPES_LABEL,
  NOTE_LIMITS
} from "../../shared/noteLimits.js";
import {
  formatCharacterCount,
  validateNoteFile,
  validateNoteForm
} from "../utils/noteValidation";

const initialForm = {
  title: "",
  courseName: "",
  branchName: "",
  specializationName: "",
  subject: "",
  unitName: "",
  topicName: "",
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

export default function UploadPage({ onNotesChanged, showToast }) {
  const [contentType, setContentType] = useState("note");
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("Choose a file or drag it here");
  const [editingId, setEditingId] = useState("");
  const [myNotes, setMyNotes] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const fileInputRef = useRef(null);

  useReveal([isSaving, myNotes.length, editingId]);

  useEffect(() => {
    loadMyNotes(currentPage);
  }, [currentPage]);

  async function loadMyNotes(pageToLoad = currentPage) {
    try {
      const response = await api.get("/notes/mine", {
        params: {
          page: pageToLoad,
          limit: initialPagination.limit
        }
      });
      setMyNotes(response.data.notes || []);
      setPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setMyNotes([]);
      setPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load your uploaded notes."), "error");
    }
  }

  function resetForm() {
    setForm(initialForm);
    setFile(null);
    setEditingId("");
    setFileLabel("Choose a file or drag it here");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    const fileError = validateNoteFile(selectedFile);
    const fallbackLabel = editingId ? fileLabel : "Choose a file or drag it here";

    if (fileError) {
      setFile(null);
      setFileLabel(fallbackLabel);
      event.target.value = "";
      showToast(fileError, "error");
      return;
    }

    setFile(selectedFile);
    setFileLabel(selectedFile ? selectedFile.name : "Choose a file or drag it here");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { error, value } = validateNoteForm(form);

    if (error) {
      showToast(error, "error");
      return;
    }

    if (!editingId) {
      const fileError = validateNoteFile(file);
      if (fileError) {
        showToast(fileError, "error");
        return;
      }
    } else if (file) {
      const fileError = validateNoteFile(file);
      if (fileError) {
        showToast(fileError, "error");
        return;
      }
    }

    const payload = new FormData();
    payload.append("title", value.title);
    payload.append("courseName", value.courseName);
    payload.append("branchName", value.branchName);
    payload.append("specializationName", value.specializationName);
    payload.append("subject", value.subject);
    payload.append("unitName", value.unitName);
    payload.append("topicName", value.topicName);
    payload.append("description", value.description);
    payload.append("featured", String(value.featured));
    if (file) {
      payload.append("file", file);
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await api.put(`/notes/${editingId}`, payload);
        showToast("Note updated successfully.", "success");
      } else {
        await api.post("/notes", payload);
        showToast("Your note is uploaded.", "success");
      }

      resetForm();
      await loadMyNotes(currentPage);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, editingId ? "Unable to update this note." : "Unable to save this note."), "error");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(note) {
    setEditingId(note.id);
    setForm({
      title: note.title,
      courseName: note.courseName || "",
      branchName: note.branchName || "",
      specializationName: note.specializationName || "",
      subject: note.subject,
      unitName: note.unitName || "",
      topicName: note.topicName || "",
      description: note.description,
      featured: note.featured
    });
    setFile(null);
    setFileLabel(note.fileName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(noteId) {
    try {
      await api.delete(`/notes/${noteId}`);
      showToast("Note deleted successfully.", "success");
      if (editingId === noteId) {
        resetForm();
      }
      await loadMyNotes(currentPage);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this note."), "error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="content-type-switcher glass-card reveal is-visible">
          <button
            type="button"
            className={`content-type-switcher__button${contentType === "note" ? " is-active" : ""}`}
            onClick={() => setContentType("note")}
          >
            Notes
          </button>
          <button
            type="button"
            className={`content-type-switcher__button${contentType === "question-paper" ? " is-active" : ""}`}
            onClick={() => setContentType("question-paper")}
          >
            Question Bank
          </button>
        </div>

        {contentType === "question-paper" ? (
          <QuestionPaperUploadPanel onPapersChanged={onNotesChanged} showToast={showToast} />
        ) : (
          <>
        <div className="split-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Upload Notes</span>
            <h2>Upload or edit notes</h2>
            <p>Upload a new note or update one of your existing notes.</p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-upload"></i>
                <div>
                  <h3>{editingId ? "Edit mode is active" : "Quick publishing"}</h3>
                  <p>
                    {editingId
                      ? "Update the selected note here and save the new details."
                      : "Upload a note in minutes with a simple, distraction-free form."}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <form className="upload-form glass-card reveal" onSubmit={handleSubmit}>
            <div className="section-heading dashboard-editor__heading">
              <span className="eyebrow">{editingId ? "Edit Note" : "Upload Note"}</span>
              <h2>{editingId ? "Update selected note" : "Share a new note"}</h2>
              <p>
                {editingId
                  ? "Make changes below. You can keep the current file or replace it."
                  : "Add a title, subject, description, and note file to publish a new resource."}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="noteTitle">Note Title</label>
              <input
                type="text"
                id="noteTitle"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={NOTE_LIMITS.titleMaxLength}
                required
              />
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.titleMaxLength} characters.</span>
                <span>{formatCharacterCount(form.title, NOTE_LIMITS.titleMaxLength)}</span>
              </small>
            </div>

            <div className="question-bank-form-grid">
              <div className="form-group">
                <label htmlFor="noteCourse">Course</label>
                <input
                  type="text"
                  id="noteCourse"
                  placeholder="e.g. B.Tech, MBA, Diploma"
                  value={form.courseName}
                  onChange={(event) => setForm((current) => ({ ...current, courseName: event.target.value }))}
                  maxLength={NOTE_LIMITS.courseMaxLength}
                  required
                />
                <small className="form-hint">
                  <span>Required.</span>
                  <span>{formatCharacterCount(form.courseName, NOTE_LIMITS.courseMaxLength)}</span>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="noteBranch">Branch</label>
                <input
                  type="text"
                  id="noteBranch"
                  placeholder="e.g. CSE, Civil, Mechanical"
                  value={form.branchName}
                  onChange={(event) => setForm((current) => ({ ...current, branchName: event.target.value }))}
                  maxLength={NOTE_LIMITS.branchMaxLength}
                  required
                />
                <small className="form-hint">
                  <span>Required.</span>
                  <span>{formatCharacterCount(form.branchName, NOTE_LIMITS.branchMaxLength)}</span>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="noteSpecialization">Specialization</label>
                <input
                  type="text"
                  id="noteSpecialization"
                  placeholder="e.g. AI & ML, Data Science"
                  value={form.specializationName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, specializationName: event.target.value }))
                  }
                  maxLength={NOTE_LIMITS.specializationMaxLength}
                />
                <small className="form-hint">
                  <span>Optional.</span>
                  <span>{formatCharacterCount(form.specializationName, NOTE_LIMITS.specializationMaxLength)}</span>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="noteSubject">Subject</label>
                <input
                  type="text"
                  id="noteSubject"
                  placeholder="e.g. Data Structures, Thermodynamics, Surveying"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  maxLength={NOTE_LIMITS.subjectMaxLength}
                  required
                />
                <small className="form-hint">
                  <span>Required.</span>
                  <span>{formatCharacterCount(form.subject, NOTE_LIMITS.subjectMaxLength)}</span>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="noteUnit">Unit or Module</label>
                <input
                  type="text"
                  id="noteUnit"
                  placeholder="e.g. Unit 2, Module 4"
                  value={form.unitName}
                  onChange={(event) => setForm((current) => ({ ...current, unitName: event.target.value }))}
                  maxLength={NOTE_LIMITS.unitMaxLength}
                />
                <small className="form-hint">
                  <span>Optional.</span>
                  <span>{formatCharacterCount(form.unitName, NOTE_LIMITS.unitMaxLength)}</span>
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="noteTopic">Topic</label>
                <input
                  type="text"
                  id="noteTopic"
                  placeholder="e.g. Trees, Operating System Basics"
                  value={form.topicName}
                  onChange={(event) => setForm((current) => ({ ...current, topicName: event.target.value }))}
                  maxLength={NOTE_LIMITS.topicMaxLength}
                />
                <small className="form-hint">
                  <span>Optional.</span>
                  <span>{formatCharacterCount(form.topicName, NOTE_LIMITS.topicMaxLength)}</span>
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="noteDescription">Description</label>
              <textarea
                id="noteDescription"
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={NOTE_LIMITS.descriptionMaxLength}
              ></textarea>
              <small className="form-hint">
                <span>Optional. Max {NOTE_LIMITS.descriptionMaxLength} characters.</span>
                <span>{formatCharacterCount(form.description, NOTE_LIMITS.descriptionMaxLength)}</span>
              </small>
            </div>

            <div className="form-group checkbox-row">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
              />
              <label htmlFor="featured">Mark as featured</label>
            </div>

            <div className="form-group">
              <label htmlFor="noteFile">{editingId ? "Replace File" : "Upload File"}</label>
              <label className="file-dropzone" htmlFor="noteFile">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="noteFile"
                  accept={NOTE_FILE_ACCEPT}
                  onChange={handleFileChange}
                  required={!editingId}
                />
                <i className="fa-solid fa-file-arrow-up"></i>
                <span>{fileLabel}</span>
                <small>
                  {editingId
                    ? `Leave empty to keep the current file. Accepted: ${NOTE_FILE_TYPES_LABEL}. Max size: ${NOTE_FILE_SIZE_LABEL}.`
                    : `Accepted: ${NOTE_FILE_TYPES_LABEL}. Max size: ${NOTE_FILE_SIZE_LABEL}.`}
                </small>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
                <i className={`fa-solid ${editingId ? "fa-floppy-disk" : "fa-upload"}`}></i>
                {isSaving ? "Saving..." : editingId ? "Update Note" : "Share Note"}
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
            <span className="eyebrow">My Uploads</span>
            <h2>Your uploaded notes</h2>
          </div>

          <div className="notes-grid notes-grid--compact">
            {myNotes.map((note) => (
              <article key={note.id} className="note-card glass-card reveal is-visible">
                <div className="note-card__topbar">
                  <span className="note-card__chip">{note.subject}</span>
                  <button
                    type="button"
                    className="note-card__icon-action"
                    onClick={() => startEditing(note)}
                    aria-label={`Edit ${note.title}`}
                    title="Edit note"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <div className="note-card__meta">
                  <span><i className="fa-solid fa-file-lines"></i> {note.fileName}</span>
                  <span><i className="fa-solid fa-download"></i> {note.downloads}</span>
                </div>
                <div className="note-card__meta">
                  <span className={`status-badge status-badge--${note.status || "pending"}`}>
                    {note.status || "pending"}
                  </span>
                </div>
                <div className="note-card__actions">
                  <div className="note-card__buttons">
                    <button type="button" className="btn btn--secondary" onClick={() => setPreviewNote(note)}>
                      Preview
                    </button>
                    <button type="button" className="btn btn--primary" onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {myNotes.length === 0 ? (
            <p className="empty-state glass-card">You have not uploaded any notes yet.</p>
          ) : null}

          {myNotes.length > 0 ? (
            <PaginationControls pagination={pagination} onPageChange={setCurrentPage} itemLabel="notes" />
          ) : null}
        </section>

        <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} showToast={showToast} />
          </>
        )}
      </div>
    </section>
  );
}
