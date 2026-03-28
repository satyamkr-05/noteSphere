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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewNote, setPreviewNote] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
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
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/notes", {
          params: {
            ...(searchQuery ? { q: searchQuery } : {}),
            page: currentPage,
            limit: initialPagination.limit
          }
        });
        setNotes(response.data.notes);
        setPagination(response.data.pagination || initialPagination);
        setLoadError("");
        setSearchParams(
          searchQuery || currentPage > 1
            ? {
                ...(searchQuery ? { search: searchQuery } : {}),
                ...(currentPage > 1 ? { page: String(currentPage) } : {})
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
  }, [currentPage, searchQuery, setSearchParams]);

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
          <h2>Search and download helpful notes in seconds</h2>
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
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            Clear
          </button>
        </div>

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
                <article key={note.id} className="note-card glass-card reveal is-visible">
                  <span className="note-card__chip">{note.subject}</span>
                  <h3>{note.title}</h3>
                  <p>{note.description}</p>
                  <div className="note-card__meta">
                    <span><i className="fa-solid fa-file-lines"></i> {note.fileName}</span>
                    <span><i className="fa-regular fa-clock"></i> {formatDate(note.createdAt)}</span>
                  </div>
                  <div className="note-card__actions">
                    <span className="note-card__downloads">{note.downloads} downloads</span>
                    <div className="note-card__buttons">
                      <button type="button" className="btn btn--secondary" onClick={() => handlePreview(note)}>
                        <i className="fa-regular fa-eye"></i>
                        Preview
                      </button>
                      <button type="button" className="btn btn--primary" onClick={() => handleDownload(note.id)}>
                        <i className="fa-solid fa-download"></i>
                        Download
                      </button>
                    </div>
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
