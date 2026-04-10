import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";
import { useReveal } from "../components/useReveal";

const initialPagination = {
  currentPage: 1,
  limit: 12,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

export default function ExplorePage({ onNotesChanged, showToast }) {
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [previewNote, setPreviewNote] = useState(null);
  const [isResolvingFocusNote, setIsResolvingFocusNote] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusNoteId = searchParams.get("focus") || "";
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get("course") || "");
  const [currentPage, setCurrentPage] = useState(getPageFromQuery(searchParams.get("page")));
  const [pagination, setPagination] = useState(initialPagination);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const groupedNotes = useMemo(() => {
    const groups = new Map();

    for (const note of notes) {
      const subject = note.subject?.trim() || "Other";

      if (!groups.has(subject)) {
        groups.set(subject, []);
      }

      groups.get(subject).push(note);
    }

    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [notes]);

  useReveal([notes.length, isLoading]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCourses() {
      try {
        const response = await api.get("/notes/courses");

        if (!isCancelled) {
          setCourses(response.data.courses || []);
          setCoursesError("");
        }
      } catch (error) {
        if (!isCancelled) {
          setCourses([]);
          setCoursesError(getErrorMessage(error, "Unable to load courses right now."));
        }
      }
    }

    loadCourses();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/notes", {
          params: {
            ...(searchQuery ? { q: searchQuery } : {}),
            ...(selectedCourse ? { courseName: selectedCourse } : {}),
            page: currentPage,
            limit: initialPagination.limit
          }
        });
        setNotes(response.data.notes);
        setPagination(response.data.pagination || initialPagination);
        setLoadError("");
        setSearchParams(
          searchQuery || selectedCourse || currentPage > 1 || focusNoteId
            ? {
                ...(searchQuery ? { search: searchQuery } : {}),
                ...(selectedCourse ? { course: selectedCourse } : {}),
                ...(currentPage > 1 ? { page: String(currentPage) } : {}),
                ...(focusNoteId ? { focus: focusNoteId } : {})
              }
            : {}
        );
        if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== currentPage) {
          setCurrentPage(response.data.pagination.currentPage);
        }
      } catch (error) {
        setNotes([]);
        setPagination(initialPagination);
        setLoadError(getErrorMessage(error, "Unable to load notes right now."));
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [currentPage, focusNoteId, searchQuery, selectedCourse, setSearchParams]);

  useEffect(() => {
    const noteIdToDownload = searchParams.get("download");

    if (!isAuthenticated || !noteIdToDownload) {
      return;
    }

    handleDownload(noteIdToDownload, true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("download");
    setSearchParams(nextParams);
  }, [isAuthenticated, searchParams, setSearchParams]);

  useEffect(() => {
    if (isLoading || !focusNoteId || notes.length === 0) {
      return;
    }

    const targetCard = document.getElementById(`explore-note-${focusNoteId}`);

    if (!targetCard) {
      return;
    }

    window.requestAnimationFrame(() => {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusNoteId, isLoading, notes]);

  useEffect(() => {
    if (!focusNoteId || isLoading || isResolvingFocusNote || notes.some((note) => note.id === focusNoteId)) {
      return;
    }

    let isCancelled = false;

    async function resolveFocusedNote() {
      try {
        setIsResolvingFocusNote(true);
        const response = await api.get(`/notes/${focusNoteId}`);

        if (isCancelled || !response.data?.note) {
          return;
        }

        setNotes((current) => [response.data.note, ...current.filter((note) => note.id !== focusNoteId)]);
      } catch (_error) {
        // Keep the existing list if the focused note is unavailable.
      } finally {
        if (!isCancelled) {
          setIsResolvingFocusNote(false);
        }
      }
    }

    resolveFocusedNote();

    return () => {
      isCancelled = true;
    };
  }, [focusNoteId, isLoading, isResolvingFocusNote, notes]);

  function handlePreview(note) {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      showToast("Create an account or log in to preview notes.", "info");
      return;
    }

    setPreviewNote(note);
  }

  async function handleDownload(noteId, skipAuthRedirect = false) {
    if (!isAuthenticated && !skipAuthRedirect) {
      const redirectParams = new URLSearchParams(location.search);
      redirectParams.set("download", noteId);
      navigate(`/auth?redirect=${encodeURIComponent(`/explore?${redirectParams.toString()}`)}`);
      showToast("Create an account or log in to download notes.", "info");
      return;
    }

    try {
      const noteToDownload = notes.find((note) => note.id === noteId);
      const response = await api.get(`/notes/${noteId}/download`, {
        responseType: "blob"
      });
      const objectUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = noteToDownload?.fileName || "note";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      showToast("Download started.", "success");
      onNotesChanged();
      setNotes((current) =>
        current.map((note) =>
          note.id === noteId ? { ...note, downloads: note.downloads + 1 } : note
        )
      );
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to download this note."), "error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading reveal">
          <span className="eyebrow">Explore Notes</span>
          <h2>Find notes fast</h2>
          <p>Find the notes you need quickly and easily.</p>
        </div>

        <div className="explore-toolbar glass-card reveal">
          <div className="search-field">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by subject or title"
              aria-label="Search notes"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="explore-toolbar__actions">
            {selectedCourse ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setSelectedCourse("");
                  setCurrentPage(1);
                }}
              >
                {selectedCourse}
                <i className="fa-solid fa-xmark"></i>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("");
                setCurrentPage(1);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="course-shortcuts glass-card reveal is-visible">
            {courses.map((courseName) => (
              <button
                key={courseName}
                type="button"
                className={`course-shortcuts__button${selectedCourse === courseName ? " is-active" : ""}`}
                onClick={() => {
                  setSelectedCourse((current) => (current === courseName ? "" : courseName));
                  setCurrentPage(1);
                }}
              >
                {courseName}
              </button>
            ))}
          </div>
        ) : null}

        {!isLoading && coursesError ? <div className="page-status glass-card">{coursesError}</div> : null}

        {isLoading ? <div className="page-status glass-card">Loading notes...</div> : null}
        {!isLoading && loadError ? <div className="page-status glass-card">{loadError}</div> : null}

        {groupedNotes.map(([subject, subjectNotes]) => (
          <section key={subject} className="subject-section reveal is-visible">
            <div className="subject-section__header">
              <div>
                <span className="eyebrow eyebrow--subject">{subject}</span>
                <h3>{subject} Notes</h3>
              </div>
              <span className="subject-section__count">{subjectNotes.length} notes</span>
            </div>

            <div className="notes-grid notes-grid--subject">
              {subjectNotes.map((note) => (
                <article
                  key={note.id}
                  id={`explore-note-${note.id}`}
                  className={`note-card glass-card reveal is-visible${note.id === focusNoteId ? " note-card--focused" : ""}`}
                >
                  <div className="note-card__topbar">
                    <span className="note-card__chip">{note.subject}</span>
                    <div className="note-card__icon-actions">
                      <button
                        type="button"
                        className="note-card__icon-action"
                        onClick={() => handlePreview(note)}
                        aria-label={`Preview ${note.title}`}
                        title="Preview"
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                      <button
                        type="button"
                        className="note-card__icon-action note-card__icon-action--primary"
                        onClick={() => handleDownload(note.id)}
                        aria-label={`Download ${note.title}`}
                        title="Download"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.description}</p>
                  <div className="note-card__meta">
                    <span><i className="fa-solid fa-file-lines"></i> {note.fileName}</span>
                    <span><i className="fa-regular fa-clock"></i> {formatDate(note.createdAt)}</span>
                  </div>
                  <div className="note-card__actions">
                    <span className="note-card__downloads">{note.downloads} downloads</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {!isLoading && !loadError && notes.length === 0 ? (
          <p className="empty-state glass-card">
            No notes match your search yet. Upload one from your dashboard to get started.
          </p>
        ) : null}

        {!isLoading && !loadError && notes.length > 0 ? (
          <PaginationControls
            pagination={pagination}
            onPageChange={setCurrentPage}
            itemLabel="notes"
          />
        ) : null}

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

function getPageFromQuery(pageValue) {
  const parsedValue = Number.parseInt(pageValue || "1", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}
