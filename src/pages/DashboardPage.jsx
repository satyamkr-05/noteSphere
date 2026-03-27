import { useEffect, useRef, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
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
  subject: "",
  description: "",
  featured: false
};

const initialPagination = {
  currentPage: 1,
  limit: 9,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

export default function DashboardPage({ onNotesChanged, showToast }) {
  const { user } = useAuth();
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

  useReveal([myNotes.length, editingId]);

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
      setMyNotes(response.data.notes);
      setPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setMyNotes([]);
      setPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load your notes."), "error");
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

    if (fileError) {
      setFile(null);
      setFileLabel("Choose a file or drag it here");
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

    const fileError = validateNoteFile(file);
    if (fileError) {
      showToast(fileError, "error");
      return;
    }

    const payload = new FormData();
    payload.append("title", value.title);
    payload.append("subject", value.subject);
    payload.append("description", value.description);
    payload.append("featured", String(value.featured));
    if (file) {
      payload.append("file", file);
    }

    try {
      setIsSaving(true);
      await api.put(`/notes/${editingId}`, payload);
      showToast("Note updated successfully.", "success");
      resetForm();
      await loadMyNotes(currentPage);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to save this note."), "error");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(note) {
    setEditingId(note.id);
    setForm({
      title: note.title,
      subject: note.subject,
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
        <div className="split-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Dashboard</span>
            <h2>Manage your uploaded notes</h2>
            <p>
              Review everything you have shared, update note details, preview files online,
              and remove content when needed.
            </p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-user-check"></i>
                <div>
                  <h3>{user?.name || "Your workspace"}</h3>
                  <p>All note management actions are available from this dashboard.</p>
                </div>
              </article>
              <article className="info-card glass-card">
                <i className="fa-solid fa-pen-to-square"></i>
                <div>
                  <h3>Edit with control</h3>
                  <p>Open any note below to edit metadata, replace files, preview, or delete it.</p>
                </div>
              </article>
            </div>
          </div>

          <form className="upload-form glass-card reveal" onSubmit={handleSubmit}>
            <div className="section-heading dashboard-editor__heading">
              <span className="eyebrow">Editor</span>
              <h2>{editingId ? "Update selected note" : "Select a note to edit"}</h2>
              <p>{editingId ? "Make changes and save them here." : "Choose any note below to start editing."}</p>
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
                disabled={!editingId}
              />
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.titleMaxLength} characters.</span>
                <span>{formatCharacterCount(form.title, NOTE_LIMITS.titleMaxLength)}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="noteSubject">Subject</label>
              <input
                type="text"
                id="noteSubject"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                maxLength={NOTE_LIMITS.subjectMaxLength}
                required
                disabled={!editingId}
              />
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.subjectMaxLength} characters.</span>
                <span>{formatCharacterCount(form.subject, NOTE_LIMITS.subjectMaxLength)}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="noteDescription">Description</label>
              <textarea
                id="noteDescription"
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={NOTE_LIMITS.descriptionMaxLength}
                required
                disabled={!editingId}
              ></textarea>
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.descriptionMaxLength} characters.</span>
                <span>{formatCharacterCount(form.description, NOTE_LIMITS.descriptionMaxLength)}</span>
              </small>
            </div>

            <div className="form-group checkbox-row">
              <input
                id="featured"
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                disabled={!editingId}
              />
              <label htmlFor="featured">Mark as featured</label>
            </div>

            <div className="form-group">
              <label htmlFor="noteFile">Replace File</label>
              <label className={`file-dropzone${editingId ? "" : " file-dropzone--disabled"}`} htmlFor="noteFile">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="noteFile"
                  accept={NOTE_FILE_ACCEPT}
                  onChange={handleFileChange}
                  disabled={!editingId}
                />
                <i className="fa-solid fa-file-arrow-up"></i>
                <span>{fileLabel}</span>
                <small>
                  {editingId
                    ? `Leave empty to keep the current file. Accepted: ${NOTE_FILE_TYPES_LABEL}. Max size: ${NOTE_FILE_SIZE_LABEL}.`
                    : "Select a note first to edit it."}
                </small>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary btn--full" disabled={!editingId || isSaving}>
                <i className="fa-solid fa-floppy-disk"></i>
                {isSaving ? "Saving..." : "Update Note"}
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
            <span className="eyebrow">My Notes</span>
            <h2>Review and manage your library</h2>
          </div>

          <div className="notes-grid notes-grid--compact">
            {myNotes.map((note) => (
              <article key={note.id} className="note-card glass-card reveal is-visible">
                <span className="note-card__chip">{note.subject}</span>
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
                    <button type="button" className="btn btn--secondary" onClick={() => startEditing(note)}>
                      Edit
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
            <PaginationControls
              pagination={pagination}
              onPageChange={setCurrentPage}
              itemLabel="notes"
            />
          ) : null}
        </section>

        <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} showToast={showToast} />
      </div>
    </section>
  );
}
