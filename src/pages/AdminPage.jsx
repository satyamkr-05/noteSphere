import { useEffect, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import api, { getErrorMessage } from "../services/api";
import { NOTE_LIMITS } from "../../shared/noteLimits.js";
import { formatCharacterCount, validateNoteForm } from "../utils/noteValidation";

const initialForm = {
  title: "",
  subject: "",
  description: "",
  featured: false
};

const initialNotesSummary = {
  totalNotes: 0,
  totalFeaturedNotes: 0,
  approvedNotes: 0,
  pendingNotes: 0,
  rejectedNotes: 0
};

const initialUsersSummary = {
  totalAccounts: 0,
  totalNotes: 0,
  activeUploaders: 0
};

const initialFeedbackSummary = {
  totalMessages: 0,
  newMessages: 0,
  reviewedMessages: 0
};

const initialSubAdminSummary = {
  totalSubAdmins: 0
};

const initialSubAdminForm = {
  name: "",
  email: "",
  password: ""
};

const initialPagination = {
  currentPage: 1,
  limit: 12,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

const initialUserPagination = {
  ...initialPagination,
  limit: 9
};

export default function AdminPage({ onNotesChanged, showToast }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [subAdminSearchQuery, setSubAdminSearchQuery] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [isSubAdminsLoading, setIsSubAdminsLoading] = useState(true);
  const [isCreatingSubAdmin, setIsCreatingSubAdmin] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [subAdminForm, setSubAdminForm] = useState(initialSubAdminForm);
  const [isSaving, setIsSaving] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [notesSummary, setNotesSummary] = useState(initialNotesSummary);
  const [usersSummary, setUsersSummary] = useState(initialUsersSummary);
  const [feedbackSummary, setFeedbackSummary] = useState(initialFeedbackSummary);
  const [subAdminSummary, setSubAdminSummary] = useState(initialSubAdminSummary);
  const [notesPagination, setNotesPagination] = useState(initialPagination);
  const [usersPagination, setUsersPagination] = useState(initialUserPagination);
  const [feedbackPagination, setFeedbackPagination] = useState(initialUserPagination);
  const [subAdminPagination, setSubAdminPagination] = useState({
    ...initialPagination,
    limit: 6
  });
  const [notesPage, setNotesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [subAdminPage, setSubAdminPage] = useState(1);

  useReveal([notes.length, users.length, feedback.length, subAdmins.length, editingNoteId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotes(notesPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [notesPage, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers(usersPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [userSearchQuery, usersPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFeedback(feedbackPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [feedbackSearchQuery, feedbackPage]);

  useEffect(() => {
    if (!user?.isMainAdmin) {
      setSubAdmins([]);
      setSubAdminSummary(initialSubAdminSummary);
      setSubAdminPagination({
        ...initialPagination,
        limit: 6
      });
      setIsSubAdminsLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      loadSubAdmins(subAdminPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [subAdminSearchQuery, subAdminPage, user?.isMainAdmin]);

  async function loadNotes(pageToLoad = notesPage) {
    try {
      setIsNotesLoading(true);
      const response = await api.get("/admin/notes", {
        params: {
          ...(searchQuery ? { search: searchQuery } : {}),
          page: pageToLoad,
          limit: initialPagination.limit
        }
      });
      setNotes(response.data.notes);
      setNotesSummary(response.data.summary || initialNotesSummary);
      setNotesPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setNotesPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setNotes([]);
      setNotesSummary(initialNotesSummary);
      setNotesPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load admin notes."), "error");
    } finally {
      setIsNotesLoading(false);
    }
  }

  async function loadUsers(pageToLoad = usersPage) {
    try {
      setIsUsersLoading(true);
      const response = await api.get("/admin/users", {
        params: {
          ...(userSearchQuery ? { search: userSearchQuery } : {}),
          page: pageToLoad,
          limit: initialUserPagination.limit
        }
      });
      setUsers(response.data.users);
      setUsersSummary(response.data.summary || initialUsersSummary);
      setUsersPagination(response.data.pagination || initialUserPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setUsersPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setUsers([]);
      setUsersSummary(initialUsersSummary);
      setUsersPagination(initialUserPagination);
      showToast(getErrorMessage(error, "Unable to load user accounts."), "error");
    } finally {
      setIsUsersLoading(false);
    }
  }

  async function loadFeedback(pageToLoad = feedbackPage) {
    try {
      setIsFeedbackLoading(true);
      const response = await api.get("/admin/feedback", {
        params: {
          ...(feedbackSearchQuery ? { search: feedbackSearchQuery } : {}),
          page: pageToLoad,
          limit: initialUserPagination.limit
        }
      });
      setFeedback(response.data.feedback || []);
      setFeedbackSummary(response.data.summary || initialFeedbackSummary);
      setFeedbackPagination(response.data.pagination || initialUserPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setFeedbackPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setFeedback([]);
      setFeedbackSummary(initialFeedbackSummary);
      setFeedbackPagination(initialUserPagination);
      showToast(getErrorMessage(error, "Unable to load feedback inbox."), "error");
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  async function loadSubAdmins(pageToLoad = subAdminPage) {
    try {
      setIsSubAdminsLoading(true);
      const response = await api.get("/admin/sub-admins", {
        params: {
          ...(subAdminSearchQuery ? { search: subAdminSearchQuery } : {}),
          page: pageToLoad,
          limit: 6
        }
      });
      setSubAdmins(response.data.subAdmins || []);
      setSubAdminSummary(response.data.summary || initialSubAdminSummary);
      setSubAdminPagination(response.data.pagination || { ...initialPagination, limit: 6 });
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setSubAdminPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setSubAdmins([]);
      setSubAdminSummary(initialSubAdminSummary);
      setSubAdminPagination({ ...initialPagination, limit: 6 });
      showToast(getErrorMessage(error, "Unable to load sub admin accounts."), "error");
    } finally {
      setIsSubAdminsLoading(false);
    }
  }

  function resetEditor() {
    setEditingNoteId("");
    setForm(initialForm);
  }

  function startEditing(note) {
    setEditingNoteId(note.id);
    setForm({
      title: note.title,
      subject: note.subject,
      description: note.description,
      featured: note.featured
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveNote(event) {
    event.preventDefault();

    const { error, value } = validateNoteForm(form);
    if (error) {
      showToast(error, "error");
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/admin/notes/${editingNoteId}`, {
        title: value.title,
        subject: value.subject,
        description: value.description,
        featured: value.featured
      });
      showToast("Note updated successfully.", "success");
      resetEditor();
      await loadNotes(notesPage);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update this note."), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteNote(noteId) {
    if (!window.confirm("Delete this note permanently?")) {
      return;
    }

    try {
      await api.delete(`/admin/notes/${noteId}`);
      showToast("Note deleted successfully.", "success");
      if (editingNoteId === noteId) {
        resetEditor();
      }
      await Promise.all([loadNotes(notesPage), loadUsers(usersPage)]);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this note."), "error");
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Delete this account and all notes uploaded by this user?")) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      showToast("User account deleted successfully.", "success");
      await Promise.all([loadUsers(usersPage), loadNotes(notesPage)]);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this user account."), "error");
    }
  }

  async function handleMarkFeedbackReviewed(feedbackId) {
    try {
      await api.put(`/admin/feedback/${feedbackId}/review`);
      showToast("Feedback marked as reviewed.", "success");
      await loadFeedback(feedbackPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update this feedback item."), "error");
    }
  }

  async function handleDeleteFeedback(feedbackId) {
    if (!window.confirm("Delete this feedback message permanently?")) {
      return;
    }

    try {
      await api.delete(`/admin/feedback/${feedbackId}`);
      showToast("Feedback deleted successfully.", "success");
      await loadFeedback(feedbackPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this feedback item."), "error");
    }
  }

  async function handleCreateSubAdmin(event) {
    event.preventDefault();

    try {
      setIsCreatingSubAdmin(true);
      await api.post("/admin/sub-admins", subAdminForm);
      setSubAdminForm(initialSubAdminForm);
      showToast("Sub admin created successfully.", "success");
      await loadSubAdmins(subAdminPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to create the sub admin account."), "error");
    } finally {
      setIsCreatingSubAdmin(false);
    }
  }

  async function handleDeleteSubAdmin(subAdminId) {
    if (!window.confirm("Remove this sub admin account?")) {
      return;
    }

    try {
      await api.delete(`/admin/sub-admins/${subAdminId}`);
      showToast("Sub admin removed successfully.", "success");
      await loadSubAdmins(subAdminPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to remove this sub admin."), "error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="split-layout admin-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Admin Panel</span>
            <h2>Moderate notes and manage platform accounts</h2>
            <p>
              Review every upload, edit note details, and manage platform accounts from one place.
            </p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-shield-halved"></i>
                <div>
                  <h3>{user?.name || "Administrator"}</h3>
                  <p>
                    {user?.isMainAdmin
                      ? "Main admin access is active for this workspace."
                      : "Sub admin access is active for this workspace."}
                  </p>
                </div>
              </article>
              <article className="info-card glass-card">
                <i className="fa-solid fa-users-gear"></i>
                <div>
                  <h3>All-in-one control</h3>
                  <p>Handle note review, editing, deletion, and account cleanup from one place.</p>
                </div>
              </article>
            </div>

            <div className="admin-summary-grid">
              <article className="stat-card glass-card">
                <strong>{notesSummary.totalNotes}</strong>
                <span>Total Notes</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{notesSummary.totalFeaturedNotes}</strong>
                <span>Featured Notes</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{usersSummary.totalAccounts}</strong>
                <span>Total Accounts</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{usersSummary.activeUploaders}</strong>
                <span>Active Uploaders</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{feedbackSummary.totalMessages}</strong>
                <span>Inbox Messages</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{feedbackSummary.newMessages}</strong>
                <span>New Messages</span>
              </article>
              {user?.isMainAdmin ? (
                <article className="stat-card glass-card">
                  <strong>{subAdminSummary.totalSubAdmins}</strong>
                  <span>Sub Admins</span>
                </article>
              ) : null}
            </div>
          </div>

          <form className="upload-form glass-card reveal" onSubmit={handleSaveNote}>
            <div className="section-heading dashboard-editor__heading">
              <span className="eyebrow">Note Editor</span>
              <h2>{editingNoteId ? "Edit selected note" : "Choose a note to manage"}</h2>
              <p>
                {editingNoteId
                  ? "Update the note metadata and save the changes."
                  : "Use the controls below to select a note for editing."}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="adminNoteTitle">Note Title</label>
              <input
                type="text"
                id="adminNoteTitle"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={NOTE_LIMITS.titleMaxLength}
                disabled={!editingNoteId}
                required
              />
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.titleMaxLength} characters.</span>
                <span>{formatCharacterCount(form.title, NOTE_LIMITS.titleMaxLength)}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="adminNoteSubject">Subject</label>
              <input
                type="text"
                id="adminNoteSubject"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                maxLength={NOTE_LIMITS.subjectMaxLength}
                disabled={!editingNoteId}
                required
              />
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.subjectMaxLength} characters.</span>
                <span>{formatCharacterCount(form.subject, NOTE_LIMITS.subjectMaxLength)}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="adminNoteDescription">Description</label>
              <textarea
                id="adminNoteDescription"
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={NOTE_LIMITS.descriptionMaxLength}
                disabled={!editingNoteId}
                required
              ></textarea>
              <small className="form-hint">
                <span>Max {NOTE_LIMITS.descriptionMaxLength} characters.</span>
                <span>{formatCharacterCount(form.description, NOTE_LIMITS.descriptionMaxLength)}</span>
              </small>
            </div>

            <div className="form-group checkbox-row">
              <input
                id="adminFeatured"
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                disabled={!editingNoteId}
              />
              <label htmlFor="adminFeatured">Featured note</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary btn--full" disabled={!editingNoteId || isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              {editingNoteId ? (
                <button type="button" className="btn btn--secondary btn--full" onClick={resetEditor}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Manage Notes</span>
            <h2>Review every uploaded resource</h2>
            <p>All uploads are published directly, so no admin approval is required.</p>
          </div>

          <div className="explore-toolbar glass-card reveal">
            <div className="search-field">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search notes by title, subject, or description"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setNotesPage(1);
                }}
              />
            </div>

            <div className="admin-toolbar-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setSearchQuery("");
                  setNotesPage(1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {isNotesLoading ? <div className="page-status glass-card">Loading admin notes...</div> : null}

          <div className="notes-grid">
            {notes.map((note) => (
              <article key={note.id} className="note-card glass-card reveal is-visible">
                <div className="note-card__header">
                  <span className="note-card__chip">{note.subject}</span>
                  {note.featured ? <span className="status-badge status-badge--approved">Featured</span> : null}
                </div>
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <div className="note-card__meta">
                  <span><i className="fa-solid fa-user"></i> {note.uploadedBy?.name || "Unknown user"}</span>
                  <span><i className="fa-solid fa-file-lines"></i> {note.fileName}</span>
                </div>
                <div className="note-card__meta">
                  <span><i className="fa-solid fa-download"></i> {note.downloads}</span>
                  <span><i className="fa-regular fa-clock"></i> {formatDate(note.createdAt)}</span>
                </div>
                <div className="note-card__actions">
                  <div className="note-card__buttons">
                    <button type="button" className="btn btn--secondary" onClick={() => setPreviewNote(note)}>
                      Preview
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => startEditing(note)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn--primary" onClick={() => handleDeleteNote(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!isNotesLoading && notes.length === 0 ? (
            <p className="empty-state glass-card">No notes match the current admin filters.</p>
          ) : null}

          {!isNotesLoading && notes.length > 0 ? (
            <PaginationControls
              pagination={notesPagination}
              onPageChange={setNotesPage}
              itemLabel="notes"
            />
          ) : null}
        </section>

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Feedback Inbox</span>
            <h2>Queries, bugs, and feature requests</h2>
            <p>Review user messages from the homepage feedback form in one place.</p>
          </div>

          <div className="explore-toolbar glass-card reveal">
            <div className="search-field">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search by name, email, type, or message"
                value={feedbackSearchQuery}
                onChange={(event) => {
                  setFeedbackSearchQuery(event.target.value);
                  setFeedbackPage(1);
                }}
              />
            </div>

            <div className="admin-toolbar-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setFeedbackSearchQuery("");
                  setFeedbackPage(1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {isFeedbackLoading ? <div className="page-status glass-card">Loading feedback inbox...</div> : null}

          <div className="admin-feedback-grid">
            {feedback.map((entry) => (
              <article key={entry.id} className="user-card glass-card reveal is-visible">
                <div className="user-card__header">
                  <div>
                    <h3>{entry.name}</h3>
                    <p>{entry.email}</p>
                  </div>
                  <span className={`status-badge status-badge--${entry.status === "reviewed" ? "approved" : "pending"}`}>
                    {entry.status}
                  </span>
                </div>

                <div className="note-card__meta">
                  <span><i className="fa-regular fa-envelope"></i> {entry.type}</span>
                  <span><i className="fa-regular fa-clock"></i> {formatDate(entry.createdAt)}</span>
                </div>

                <p className="feedback-card__message">{entry.message}</p>

                {entry.submittedBy ? (
                  <div className="user-card__meta">
                    <span><i className="fa-regular fa-user"></i> Linked account: {entry.submittedBy.name}</span>
                  </div>
                ) : null}

                <div className="note-card__actions">
                  <div className="note-card__buttons">
                    {entry.status !== "reviewed" ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => handleMarkFeedbackReviewed(entry.id)}
                      >
                        Mark Reviewed
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => handleDeleteFeedback(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!isFeedbackLoading && feedback.length === 0 ? (
            <p className="empty-state glass-card">No feedback messages found.</p>
          ) : null}

          {!isFeedbackLoading && feedback.length > 0 ? (
            <PaginationControls
              pagination={feedbackPagination}
              onPageChange={setFeedbackPage}
              itemLabel="messages"
            />
          ) : null}
        </section>

        {user?.isMainAdmin ? (
          <section className="section section--compact">
            <div className="split-layout admin-layout">
              <div className="split-layout__intro reveal">
                <span className="eyebrow">Sub Admins</span>
                <h2>Create and manage sub admin accounts</h2>
                <p>
                  Sub admins can use the admin panel like regular admins, but they cannot replace
                  or delete the main admin account.
                </p>

                <div className="info-stack">
                  <article className="info-card glass-card">
                    <i className="fa-solid fa-user-shield"></i>
                    <div>
                      <h3>Main admin controls this list</h3>
                      <p>Only the main admin can create or remove sub admin accounts.</p>
                    </div>
                  </article>
                </div>
              </div>

              <form className="upload-form glass-card reveal" onSubmit={handleCreateSubAdmin}>
                <div className="section-heading dashboard-editor__heading">
                  <span className="eyebrow">Create Sub Admin</span>
                  <h2>Add another admin account</h2>
                  <p>Create a new sub admin who can help manage notes, users, and feedback.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="subAdminName">Name</label>
                  <input
                    id="subAdminName"
                    type="text"
                    value={subAdminForm.name}
                    onChange={(event) => setSubAdminForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subAdminEmail">Email</label>
                  <input
                    id="subAdminEmail"
                    type="email"
                    value={subAdminForm.email}
                    onChange={(event) => setSubAdminForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subAdminPassword">Password</label>
                  <input
                    id="subAdminPassword"
                    type="password"
                    minLength="6"
                    value={subAdminForm.password}
                    onChange={(event) => setSubAdminForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn--primary btn--full" disabled={isCreatingSubAdmin}>
                  {isCreatingSubAdmin ? "Creating..." : "Create Sub Admin"}
                </button>
              </form>
            </div>

            <div className="explore-toolbar glass-card reveal">
              <div className="search-field">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search sub admins by name or email"
                  value={subAdminSearchQuery}
                  onChange={(event) => {
                    setSubAdminSearchQuery(event.target.value);
                    setSubAdminPage(1);
                  }}
                />
              </div>

              <div className="admin-toolbar-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setSubAdminSearchQuery("");
                    setSubAdminPage(1);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {isSubAdminsLoading ? <div className="page-status glass-card">Loading sub admin accounts...</div> : null}

            <div className="admin-users-grid">
              {subAdmins.map((account) => (
                <article key={account.id} className="user-card glass-card reveal is-visible">
                  <div className="user-card__header">
                    <div>
                      <h3>{account.name}</h3>
                      <p>{account.email}</p>
                    </div>
                    <span className="status-badge status-badge--approved">Sub Admin</span>
                  </div>

                  <div className="user-card__meta">
                    <span><i className="fa-regular fa-calendar"></i> Joined {formatDate(account.createdAt)}</span>
                    <span><i className="fa-solid fa-shield-halved"></i> Admin access enabled</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn--primary btn--full"
                    onClick={() => handleDeleteSubAdmin(account.id)}
                  >
                    Remove Sub Admin
                  </button>
                </article>
              ))}
            </div>

            {!isSubAdminsLoading && subAdmins.length === 0 ? (
              <p className="empty-state glass-card">No sub admin accounts found.</p>
            ) : null}

            {!isSubAdminsLoading && subAdmins.length > 0 ? (
              <PaginationControls
                pagination={subAdminPagination}
                onPageChange={setSubAdminPage}
                itemLabel="sub admins"
              />
            ) : null}
          </section>
        ) : null}

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Accounts</span>
            <h2>Manage registered users</h2>
            <p>{usersSummary.totalAccounts} total accounts have been created on the platform.</p>
          </div>

          <div className="explore-toolbar glass-card reveal">
            <div className="search-field">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search users by name or email"
                value={userSearchQuery}
                onChange={(event) => {
                  setUserSearchQuery(event.target.value);
                  setUsersPage(1);
                }}
              />
            </div>

            <div className="admin-toolbar-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setUserSearchQuery("");
                  setUsersPage(1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {isUsersLoading ? <div className="page-status glass-card">Loading user accounts...</div> : null}

          <div className="admin-users-grid">
            {users.map((account) => (
              <article key={account.id} className="user-card glass-card reveal is-visible">
                <div className="user-card__header">
                  <div>
                    <h3>{account.name}</h3>
                    <p>{account.email}</p>
                  </div>
                  {account.isAdmin ? <span className="status-badge status-badge--approved">Admin</span> : null}
                </div>

                <div className="user-card__meta">
                  <span><i className="fa-solid fa-note-sticky"></i> {account.uploadedNotes} notes</span>
                  <span><i className="fa-regular fa-calendar"></i> Joined {formatDate(account.createdAt)}</span>
                </div>

                <div className="user-card__content-types">
                  <strong>Shared content</strong>
                  {account.sharedContentTypes?.length ? (
                    <div className="content-tags">
                      {account.sharedContentTypes.map((content) => (
                        <span key={`${account.id}-${content.type}`} className="content-tag">
                          {content.type} ({content.count})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No uploads yet.</p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn--primary btn--full"
                  onClick={() => handleDeleteUser(account.id)}
                  disabled={account.isAdmin}
                >
                  {account.isAdmin ? "Primary Admin Account" : "Delete Account"}
                </button>
              </article>
            ))}
          </div>

          {!isUsersLoading && users.length === 0 ? (
            <p className="empty-state glass-card">No user accounts were found.</p>
          ) : null}

          {!isUsersLoading && users.length > 0 ? (
            <PaginationControls
              pagination={usersPagination}
              onPageChange={setUsersPage}
              itemLabel="accounts"
            />
          ) : null}
        </section>

        <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} showToast={showToast} />
      </div>
    </section>
  );
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
