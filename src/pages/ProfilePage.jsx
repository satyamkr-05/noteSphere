import { useEffect, useMemo, useRef, useState } from "react";
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
  totalUploads: 0,
  approvedUploads: 0,
  pendingUploads: 0,
  featuredUploads: 0,
  totalUploadDownloads: 0,
  notesDownloaded: 0,
  downloadActions: 0
};

export default function ProfilePage({ showToast }) {
  const { user, updateCurrentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [stats, setStats] = useState(emptyStats);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNote, setPreviewNote] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useReveal([notes.length, currentPage]);

  useEffect(() => {
    loadProfile(currentPage);
  }, [currentPage]);

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
      updateCurrentUser(response.data.user);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to load your profile."), "error");
    }
  }

  async function handleAvatarChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      showToast("Please choose a valid image file.", "error");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      showToast("Profile picture must be 2 MB or smaller.", "error");
      event.target.value = "";
      return;
    }

    const payload = new FormData();
    payload.append("avatar", selectedFile);

    try {
      setIsUploadingAvatar(true);
      const response = await api.put("/users/me", payload);
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);
      showToast("Profile picture updated successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update your profile picture."), "error");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  const memberSince = useMemo(() => {
    if (!profileUser?.createdAt) {
      return "Recently joined";
    }

    return new Date(profileUser.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }, [profileUser?.createdAt]);

  return (
    <section className="section">
      <div className="container">
        <div className="profile-grid">
          <aside className="profile-card glass-card reveal is-visible">
            <div className="profile-card__avatar">
              {profileUser?.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt={profileUser.name} className="profile-card__avatar-image" />
              ) : (
                <span className="profile-card__avatar-fallback">{getInitials(profileUser?.name)}</span>
              )}
            </div>

            <div className="profile-card__copy">
              <span className="eyebrow">My Profile</span>
              <h2>{profileUser?.name || "Your profile"}</h2>
              <p>{profileUser?.email}</p>
              <small>Member since {memberSince}</small>
            </div>

            <div className="profile-card__actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className="btn btn--primary btn--full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? "Uploading..." : "Upload Profile Picture"}
              </button>
            </div>
          </aside>

          <div className="profile-content">
            <div className="section-heading reveal">
              <span className="eyebrow">Your Stats</span>
              <h2>Track your uploads and activity</h2>
            </div>

            <div className="profile-stats-grid">
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.totalUploads}</strong>
                <span>Total Uploads</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.totalUploadDownloads}</strong>
                <span>Downloads On Your Notes</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.notesDownloaded}</strong>
                <span>Notes Downloaded</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.downloadActions}</strong>
                <span>Download Actions</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.approvedUploads}</strong>
                <span>Approved Notes</span>
              </article>
              <article className="stat-card glass-card reveal is-visible">
                <strong>{stats.featuredUploads}</strong>
                <span>Featured Notes</span>
              </article>
            </div>

            <section className="section section--compact">
              <div className="section-heading reveal">
                <span className="eyebrow">Uploaded Notes</span>
                <h2>Your uploaded library</h2>
                <p>All your uploaded notes are listed here with status and download numbers.</p>
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
                      <span className={`status-badge status-badge--${note.status || "pending"}`}>
                        {note.status || "pending"}
                      </span>
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
                <p className="empty-state glass-card">You have not uploaded any notes yet.</p>
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
