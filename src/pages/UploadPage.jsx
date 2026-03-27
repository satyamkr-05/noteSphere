import { useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  subject: "",
  description: "",
  featured: false
};

export default function UploadPage({ onNotesChanged, showToast }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("Choose a file or drag it here");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useReveal([isSaving]);

  function resetForm() {
    setForm(initialForm);
    setFile(null);
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
      await api.post("/notes", payload);
      showToast("Your note is uploaded.", "success");
      resetForm();
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to save this note."), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="split-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Upload Notes</span>
            <h2>Share a new note in a focused upload flow</h2>
            <p>
              Add a title, subject, description, and note file to publish a new resource for
              other learners right away.
            </p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-upload"></i>
                <div>
                  <h3>Quick publishing</h3>
                  <p>Upload a note in minutes with a simple, distraction-free form.</p>
                </div>
              </article>
              <article className="info-card glass-card">
                <i className="fa-solid fa-table-list"></i>
                <div>
                  <h3>Need to manage notes?</h3>
                  <p>Use your dashboard to review uploads, edit details, preview files, and delete notes.</p>
                  <Link to="/dashboard" className="text-link">Open Dashboard</Link>
                </div>
              </article>
            </div>
          </div>

          <form className="upload-form glass-card reveal" onSubmit={handleSubmit}>
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
                <span>Add the subject so users can find topic-related notes more easily.</span>
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
              />
              <label htmlFor="featured">Mark as featured</label>
            </div>

            <div className="form-group">
              <label htmlFor="noteFile">Upload File</label>
              <label className="file-dropzone" htmlFor="noteFile">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="noteFile"
                  accept={NOTE_FILE_ACCEPT}
                  onChange={handleFileChange}
                  required
                />
                <i className="fa-solid fa-file-arrow-up"></i>
                <span>{fileLabel}</span>
                <small>Accepted: {NOTE_FILE_TYPES_LABEL}. Max size: {NOTE_FILE_SIZE_LABEL}.</small>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
                <i className="fa-solid fa-upload"></i>
                {isSaving ? "Saving..." : "Share Note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
