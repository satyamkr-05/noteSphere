import { useEffect, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import QuestionPaperPreviewModal from "../components/QuestionPaperPreviewModal";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import api, { getErrorMessage } from "../services/api";

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
  totalQuestionPapers: 0,
  activeUploaders: 0,
  totalSubAdmins: 0
};

const initialQuestionPaperSummary = {
  totalQuestionPapers: 0,
  totalFeaturedQuestionPapers: 0,
  approvedQuestionPapers: 0,
  pendingQuestionPapers: 0,
  rejectedQuestionPapers: 0
};

const initialFeedbackSummary = {
  totalMessages: 0,
  newMessages: 0,
  reviewedMessages: 0
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
  const [questionPapers, setQuestionPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionPaperSearchQuery, setQuestionPaperSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [isQuestionPapersLoading, setIsQuestionPapersLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState(null);
  const [previewQuestionPaper, setPreviewQuestionPaper] = useState(null);
  const [notesSummary, setNotesSummary] = useState(initialNotesSummary);
  const [questionPaperSummary, setQuestionPaperSummary] = useState(initialQuestionPaperSummary);
  const [usersSummary, setUsersSummary] = useState(initialUsersSummary);
  const [feedbackSummary, setFeedbackSummary] = useState(initialFeedbackSummary);
  const [notesPagination, setNotesPagination] = useState(initialPagination);
  const [questionPapersPagination, setQuestionPapersPagination] = useState(initialPagination);
  const [usersPagination, setUsersPagination] = useState(initialUserPagination);
  const [feedbackPagination, setFeedbackPagination] = useState(initialUserPagination);
  const [notesPage, setNotesPage] = useState(1);
  const [questionPapersPage, setQuestionPapersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);

  useReveal([notes.length, questionPapers.length, users.length, feedback.length]);

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
      loadQuestionPapers(questionPapersPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [questionPaperSearchQuery, questionPapersPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFeedback(feedbackPage);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [feedbackSearchQuery, feedbackPage]);

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

  async function loadQuestionPapers(pageToLoad = questionPapersPage) {
    try {
      setIsQuestionPapersLoading(true);
      const response = await api.get("/admin/question-papers", {
        params: {
          ...(questionPaperSearchQuery ? { search: questionPaperSearchQuery } : {}),
          page: pageToLoad,
          limit: initialPagination.limit
        }
      });
      setQuestionPapers(response.data.questionPapers || []);
      setQuestionPaperSummary(response.data.summary || initialQuestionPaperSummary);
      setQuestionPapersPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setQuestionPapersPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setQuestionPapers([]);
      setQuestionPaperSummary(initialQuestionPaperSummary);
      setQuestionPapersPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load admin question papers."), "error");
    } finally {
      setIsQuestionPapersLoading(false);
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

  async function handleDeleteNote(noteId) {
    if (!window.confirm("Delete this note permanently?")) {
      return;
    }

    try {
      await api.delete(`/admin/notes/${noteId}`);
      showToast("Note deleted successfully.", "success");
      await Promise.all([loadNotes(notesPage), loadUsers(usersPage)]);
      onNotesChanged();
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this note."), "error");
    }
  }

  async function handleDeleteQuestionPaper(questionPaperId) {
    if (!window.confirm("Delete this question paper permanently?")) {
      return;
    }

    try {
      await api.delete(`/admin/question-papers/${questionPaperId}`);
      showToast("Question paper deleted successfully.", "success");
      await loadQuestionPapers(questionPapersPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete this question paper."), "error");
    }
  }

  async function handleCreateSubAdmin(userId) {
    if (!window.confirm("Give this account sub admin access?")) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/promote-sub-admin`);
      showToast("Sub admin access enabled successfully.", "success");
      await loadUsers(usersPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to enable sub admin access."), "error");
    }
  }

  async function handleRemoveSubAdmin(userId) {
    if (!window.confirm("Remove sub admin access from this account?")) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/remove-sub-admin`);
      showToast("Sub admin access removed successfully.", "success");
      await loadUsers(usersPage);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to remove sub admin access."), "error");
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

  return (
    <section className="section">
      <div className="container">
        <div className="split-layout admin-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Admin Panel</span>
            <h2>Manage notes, accounts, and user messages</h2>
            <p>
              Review uploads, remove unwanted content, and control account access from one place.
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
                  <h3>Admin tools</h3>
                  <p>Manage notes, feedback, and account access.</p>
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
                <strong>{questionPaperSummary.totalQuestionPapers}</strong>
                <span>Question Papers</span>
              </article>
              <article className="stat-card glass-card">
                <strong>{questionPaperSummary.totalFeaturedQuestionPapers}</strong>
                <span>Featured Papers</span>
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
                  <strong>{usersSummary.totalSubAdmins}</strong>
                  <span>Sub Admins</span>
                </article>
              ) : null}
            </div>
          </div>
        </div>

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Manage Notes</span>
            <h2>All uploaded notes</h2>
            <p>View notes and remove content that should not stay on the platform.</p>
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
            <span className="eyebrow">Manage Question Bank</span>
            <h2>All uploaded question papers</h2>
            <p>Review the structured question bank and remove duplicate or incorrect papers.</p>
          </div>

          <div className="explore-toolbar glass-card reveal">
            <div className="search-field">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search by university, course, subject, or title"
                value={questionPaperSearchQuery}
                onChange={(event) => {
                  setQuestionPaperSearchQuery(event.target.value);
                  setQuestionPapersPage(1);
                }}
              />
            </div>

            <div className="admin-toolbar-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setQuestionPaperSearchQuery("");
                  setQuestionPapersPage(1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {isQuestionPapersLoading ? <div className="page-status glass-card">Loading admin question papers...</div> : null}

          <div className="notes-grid">
            {questionPapers.map((paper) => (
              <article key={paper.id} className="note-card glass-card reveal is-visible">
                <div className="note-card__header">
                  <span className="note-card__chip">{paper.subjectName}</span>
                  {paper.featured ? <span className="status-badge status-badge--approved">Featured</span> : null}
                </div>
                <h3>{paper.title}</h3>
                <p>{paper.pathLabel}</p>
                <div className="note-card__meta">
                  <span><i className="fa-solid fa-user"></i> {paper.uploadedBy?.name || "Unknown user"}</span>
                  <span><i className="fa-solid fa-calendar"></i> {paper.paperLabel}</span>
                </div>
                <div className="note-card__meta">
                  <span><i className="fa-solid fa-file-lines"></i> {paper.fileName}</span>
                  <span><i className="fa-solid fa-download"></i> {paper.downloads}</span>
                </div>
                <div className="note-card__actions">
                  <div className="note-card__buttons">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setPreviewQuestionPaper(paper)}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => handleDeleteQuestionPaper(paper.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!isQuestionPapersLoading && questionPapers.length === 0 ? (
            <p className="empty-state glass-card">No question papers match the current admin filters.</p>
          ) : null}

          {!isQuestionPapersLoading && questionPapers.length > 0 ? (
            <PaginationControls
              pagination={questionPapersPagination}
              onPageChange={setQuestionPapersPage}
              itemLabel="papers"
            />
          ) : null}
        </section>

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Feedback Inbox</span>
            <h2>User messages</h2>
            <p>View user queries and feedback.</p>
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

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Accounts</span>
            <h2>Manage registered accounts</h2>
            <p>
              {usersSummary.totalAccounts} total accounts are available here, including sub admin access for eligible users.
            </p>
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
                  {account.adminRole === "sub_admin" ? (
                    <span className="status-badge status-badge--approved">Sub Admin</span>
                  ) : null}
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

                <div className="note-card__actions">
                  <div className="note-card__buttons">
                    {user?.isMainAdmin && !account.isAdmin ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => handleCreateSubAdmin(account.id)}
                      >
                        Create Sub Admin
                      </button>
                    ) : null}

                    {user?.isMainAdmin && account.adminRole === "sub_admin" ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => handleRemoveSubAdmin(account.id)}
                      >
                        Remove Sub Admin
                      </button>
                    ) : null}

                    {!account.isAdmin ? (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => handleDeleteUser(account.id)}
                      >
                        Delete Account
                      </button>
                    ) : null}
                  </div>
                </div>
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
        <QuestionPaperPreviewModal
          paper={previewQuestionPaper}
          onClose={() => setPreviewQuestionPaper(null)}
          showToast={showToast}
        />
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
