import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const profileSections = [
  { id: "profile", label: "My Profile", icon: "fa-regular fa-user" },
  { id: "settings", label: "Settings", icon: "fa-solid fa-gear" },
  { id: "notifications", label: "Notifications", icon: "fa-regular fa-bell" }
];

const languageOptions = ["English", "Hindi", "Bengali", "Spanish"];

export default function ProfilePage({ showToast, isDark, onToggleTheme }) {
  const { user, updateCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(user);
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    location: user?.location || ""
  });
  const [settingsDraft, setSettingsDraft] = useState({
    preferredLanguage: user?.preferredLanguage || "English",
    themeMode: isDark ? "dark" : "light"
  });
  const [notificationsDraft, setNotificationsDraft] = useState({
    emailNotifications: typeof user?.emailNotifications === "boolean" ? user.emailNotifications : true
  });
  const [activePanel, setActivePanel] = useState("profile");
  const [stats, setStats] = useState(emptyStats);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNote, setPreviewNote] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const fileInputRef = useRef(null);

  useReveal([notes.length, currentPage, activePanel]);

  useEffect(() => {
    loadProfile(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setProfileDraft({
      name: profileUser?.name || "",
      phoneNumber: profileUser?.phoneNumber || "",
      location: profileUser?.location || ""
    });
    setSettingsDraft((current) => ({
      ...current,
      preferredLanguage: profileUser?.preferredLanguage || "English"
    }));
    setNotificationsDraft({
      emailNotifications:
        typeof profileUser?.emailNotifications === "boolean" ? profileUser.emailNotifications : true
    });
  }, [profileUser]);

  useEffect(() => {
    setSettingsDraft((current) => ({
      ...current,
      themeMode: isDark ? "dark" : "light"
    }));
  }, [isDark]);

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

  async function handleRemoveAvatar() {
    if (!profileUser?.avatarUrl) {
      return;
    }

    try {
      setIsRemovingAvatar(true);
      const payload = new FormData();
      payload.append("removeAvatar", "true");
      const response = await api.put("/users/me", payload);
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);
      showToast("Profile picture removed successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to remove your profile picture."), "error");
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    const normalizedName = profileDraft.name.trim();

    if (!normalizedName) {
      showToast("Please enter your name.", "error");
      return;
    }

    try {
      setIsSavingProfile(true);
      const response = await api.put("/users/me", {
        name: normalizedName,
        phoneNumber: profileDraft.phoneNumber.trim(),
        location: profileDraft.location.trim()
      });
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);
      showToast("Profile details updated successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update your profile."), "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    try {
      setIsSavingSettings(true);
      const response = await api.put("/users/me", {
        preferredLanguage: settingsDraft.preferredLanguage
      });
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);

      const shouldUseDarkMode = settingsDraft.themeMode === "dark";

      if (shouldUseDarkMode !== isDark) {
        onToggleTheme();
      }

      showToast("Settings updated successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update your settings."), "error");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSaveNotifications(event) {
    event.preventDefault();

    try {
      setIsSavingNotifications(true);
      const response = await api.put("/users/me", {
        emailNotifications: notificationsDraft.emailNotifications
      });
      setProfileUser(response.data.user);
      updateCurrentUser(response.data.user);
      showToast("Notification preferences updated successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update notifications."), "error");
    } finally {
      setIsSavingNotifications(false);
    }
  }

  function handleLogout() {
    logout();
    showToast("Logged out successfully.", "info");
    navigate("/");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="profile-grid profile-grid--figma">
          <aside className="profile-sidebar glass-card reveal is-visible">
            <div className="profile-sidebar__identity">
              <div className="profile-sidebar__avatar-wrap">
                <div className="profile-sidebar__avatar">
                  {profileUser?.avatarUrl ? (
                    <img src={profileUser.avatarUrl} alt={profileUser.name} className="profile-sidebar__avatar-image" />
                  ) : (
                    <span className="profile-sidebar__avatar-fallback">{getInitials(profileUser?.name)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="profile-sidebar__avatar-edit"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  aria-label="Upload profile picture"
                  title="Upload profile picture"
                >
                  <i className={`fa-solid ${isUploadingAvatar ? "fa-spinner fa-spin" : "fa-pen"}`}></i>
                </button>
              </div>

              <div className="profile-sidebar__copy">
                <strong>{profileUser?.name || "Your name"}</strong>
                <span>{profileUser?.email}</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={handleAvatarChange}
            />

            <div className="profile-sidebar__menu">
              {profileSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`profile-sidebar__menu-item${activePanel === section.id ? " is-active" : ""}`}
                  onClick={() => setActivePanel(section.id)}
                >
                  <span className="profile-sidebar__menu-label">
                    <i className={section.icon}></i>
                    <span>{section.label}</span>
                  </span>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              ))}

              <button
                type="button"
                className="profile-sidebar__menu-item profile-sidebar__menu-item--logout"
                onClick={handleLogout}
              >
                <span className="profile-sidebar__menu-label">
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Log Out</span>
                </span>
              </button>
            </div>

            <div className="profile-sidebar__quick-stats">
              <div>
                <strong>{stats.totalUploads}</strong>
                <span>Uploads</span>
              </div>
              <div>
                <strong>{stats.notesDownloaded}</strong>
                <span>Downloads</span>
              </div>
            </div>
          </aside>

          <div className="profile-content">
            <div className="profile-panel glass-card reveal is-visible">
              <div className="profile-panel__header">
                <div className="profile-panel__title">
                  <div className="profile-panel__mini-avatar">
                    {profileUser?.avatarUrl ? (
                      <img src={profileUser.avatarUrl} alt={profileUser.name} className="profile-panel__mini-avatar-image" />
                    ) : (
                      <span className="profile-panel__mini-avatar-fallback">{getInitials(profileUser?.name)}</span>
                    )}
                  </div>
                  <div>
                    <strong>{profileUser?.name || "Your name"}</strong>
                    <span>{profileUser?.email}</span>
                  </div>
                </div>
                <span className="profile-panel__badge">
                  {profileSections.find((section) => section.id === activePanel)?.label || "My Profile"}
                </span>
              </div>

              {activePanel === "profile" ? (
                <form className="profile-panel__form" onSubmit={handleSaveProfile}>
                  <div className="profile-panel__grid">
                    <label className="profile-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={profileDraft.name}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        maxLength="60"
                        required
                      />
                    </label>

                    <label className="profile-field">
                      <span>Email account</span>
                      <input type="email" value={profileUser?.email || ""} readOnly />
                    </label>

                    <label className="profile-field">
                      <span>Mobile number</span>
                      <input
                        type="text"
                        placeholder="Add mobile number"
                        value={profileDraft.phoneNumber}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, phoneNumber: event.target.value }))
                        }
                        maxLength="24"
                      />
                    </label>

                    <label className="profile-field">
                      <span>Location</span>
                      <input
                        type="text"
                        placeholder="Add location"
                        value={profileDraft.location}
                        onChange={(event) =>
                          setProfileDraft((current) => ({ ...current, location: event.target.value }))
                        }
                        maxLength="60"
                      />
                    </label>
                  </div>

                  <div className="profile-panel__actions">
                    <button type="submit" className="btn btn--primary" disabled={isSavingProfile}>
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || isRemovingAvatar || isSavingProfile}
                    >
                      {isUploadingAvatar ? "Uploading..." : "Change Picture"}
                    </button>
                    {profileUser?.avatarUrl ? (
                      <button
                        type="button"
                        className="profile-panel__trash"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar || isRemovingAvatar || isSavingProfile}
                        aria-label="Remove profile picture"
                        title="Remove profile picture"
                      >
                        <i className={`fa-solid ${isRemovingAvatar ? "fa-spinner fa-spin" : "fa-trash-can"}`}></i>
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {activePanel === "settings" ? (
                <form className="profile-panel__form" onSubmit={handleSaveSettings}>
                  <div className="profile-panel__grid">
                    <label className="profile-field">
                      <span>Theme</span>
                      <select
                        value={settingsDraft.themeMode}
                        onChange={(event) =>
                          setSettingsDraft((current) => ({ ...current, themeMode: event.target.value }))
                        }
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </label>

                    <label className="profile-field">
                      <span>Language</span>
                      <select
                        value={settingsDraft.preferredLanguage}
                        onChange={(event) =>
                          setSettingsDraft((current) => ({
                            ...current,
                            preferredLanguage: event.target.value
                          }))
                        }
                      >
                        {languageOptions.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="profile-panel__actions">
                    <button type="submit" className="btn btn--primary" disabled={isSavingSettings}>
                      {isSavingSettings ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : null}

              {activePanel === "notifications" ? (
                <form className="profile-panel__form" onSubmit={handleSaveNotifications}>
                  <div className="profile-notice">
                    <div>
                      <strong>Email updates</strong>
                      <p>Allow account and activity updates on your registered email address.</p>
                    </div>

                    <label className="profile-switch" aria-label="Toggle email notifications">
                      <input
                        type="checkbox"
                        checked={notificationsDraft.emailNotifications}
                        onChange={(event) =>
                          setNotificationsDraft({ emailNotifications: event.target.checked })
                        }
                      />
                      <span className="profile-switch__slider"></span>
                      <span className="profile-switch__text">
                        {notificationsDraft.emailNotifications ? "Allow" : "Mute"}
                      </span>
                    </label>
                  </div>

                  <div className="profile-panel__actions">
                    <button type="submit" className="btn btn--primary" disabled={isSavingNotifications}>
                      {isSavingNotifications ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>

            {activePanel === "profile" ? (
              <>
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
              </>
            ) : (
              <section className="profile-side-card glass-card reveal is-visible">
                <span className="eyebrow">Quick Tip</span>
                <h3>Keep your profile up to date</h3>
                <p>
                  A complete profile helps you manage your study identity, personalize your space,
                  and stay on top of note activity.
                </p>
              </section>
            )}
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
