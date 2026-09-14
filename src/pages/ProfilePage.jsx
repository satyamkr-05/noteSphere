import { useEffect, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import api, { getErrorMessage } from "../services/api";

const initialPagination = {
  currentPage: 1,
  limit: 6,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

const emptyStats = {
  notesDownloaded: 0,
  downloadActions: 0
};

export default function ProfilePage({ showToast }) {
  const { user, updateCurrentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [nameDraft, setNameDraft] = useState(user?.name || "");
  const [stats, setStats] = useState(emptyStats);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNote, setPreviewNote] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useReveal([notes.length, currentPage]);

  useEffect(() => {
    loadProfile(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setNameDraft(profileUser?.name || "");
  }, [profileUser?.name]);

  async function loadProfile(pageToLoad = currentPage) {
    try {
      const response = await api.get("/users/me/profile", {
        params: {
          page: pageToLoad,
          limit: initialPagination.limit
        }
      });
      setProfileUser(response.data.user);
      setStats(response.data.stats || emptyStats);
      setNotes(response.data.notes || []);
      setPagination(response.data.pagination || initialPagination);
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== pageToLoad) {
        setCurrentPage(response.data.pagination.currentPage);
      }
      updateCurrentUser(response.data.user);
    } catch (error) {
      setStats(emptyStats);
      setNotes([]);
      setPagination(initialPagination);
      showToast(getErrorMessage(error, "Unable to load your profile."), "error");
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    const normalizedName = nameDraft.trim();

    if (!normalizedName) {
      showToast("Please enter your name.", "error");
      return;
    }

    try {
      setIsSavingProfile(true);
      const response = await api.put("/users/me", {
        name: normalizedName
      });
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);
      setIsEditingProfile(false);
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update your profile."), "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="profile-grid">
          <aside className="profile-card glass-card reveal is-visible">
            <div className="profile-card__avatar-wrap">
              <div className="profile-card__avatar">
                {profileUser?.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt={profileUser.name} className="profile-card__avatar-image" />
                ) : (
                  <span className="profile-card__avatar-fallback">{getInitials(profileUser?.name)}</span>
                )}
              </div>
            </div>

            <div className="profile-card__copy">
              <span className="eyebrow">My Profile</span>
              <div className="profile-card__info-list">
                <div className="profile-card__info-item">
                  <span className="profile-card__info-label">User Name</span>
                  <div className="profile-card__info-value">{profileUser?.name || "Your profile"}</div>
                </div>
                <div className="profile-card__info-item">
                  <span className="profile-card__info-label">Email</span>
                  <div className="profile-card__info-value">{profileUser?.email || "No email found"}</div>
                </div>
              </div>
            </div>

            <div className="profile-card__actions">
              {isEditingProfile ? (
                <form className="profile-card__form" onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label htmlFor="profileName">User Name</label>
                    <input
                      id="profileName"
                      type="text"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      maxLength="60"
                      required
                    />
                  </div>
                  <div className="profile-card__button-group">
                    <button
                      type="submit"
                      className="btn btn--primary btn--full"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--full"
                      onClick={() => {
                        setNameDraft(profileUser?.name || "");
                        setIsEditingProfile(false);
                      }}
                      disabled={isSavingProfile}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--full"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </aside>

          <div className="profile-content">
            <div className="section-heading reveal">
              <span className="eyebrow">Your Stats</span>
              <h2>Track your reading activity</h2>
            </div>

            <div className="profile-stats-grid">
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.notesDownloaded}</strong>
                <span>Notes Downloaded</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.downloadActions}</strong>
                <span>Download Actions</span>
              </article>
            </div>

            <section className="section section--compact">
              <div className="section-heading reveal">
                <span className="eyebrow">Downloaded Notes</span>
                <h2>Your recent note activity</h2>
                <p>Notes you downloaded recently appear here for quick access.</p>
              </div>

              <div className="notes-grid notes-grid--compact">
                {notes.map((note) => (
                  <article key={note.id} className="note-card glass-card reveal is-visible">
                    <span className="note-card__chip">{note.subject}</span>
                    <h3>{note.title}</h3>
                    <p>{note.description}</p>
                    <div className="note-card__meta">
                      <span><i className="fa-solid fa-file-lines"></i> {note.fileName}</span>
                      <span><i className="fa-solid fa-download"></i> {note.downloads}</span>
                    </div>
                    <div className="note-card__meta">
                      <span className="status-badge status-badge--approved">Downloaded</span>
                    </div>
                    <div className="note-card__actions">
                      <div className="note-card__buttons">
                        <button type="button" className="btn btn--secondary" onClick={() => setPreviewNote(note)}>
                          Preview
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {notes.length === 0 ? (
                <p className="empty-state glass-card">Downloaded notes will appear here after you save study material.</p>
              ) : null}

              {notes.length > 0 ? (
                <PaginationControls pagination={pagination} onPageChange={setCurrentPage} itemLabel="notes" />
              ) : null}
            </section>
          </div>
        </div>

        <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} showToast={showToast} />
      </div>
    </section>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NS";
}
