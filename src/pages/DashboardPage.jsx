import { useEffect, useState } from "react";
import NotePreviewModal from "../components/NotePreviewModal";
import PaginationControls from "../components/PaginationControls";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";

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
  const [myNotes, setMyNotes] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNote, setPreviewNote] = useState(null);

  useReveal([myNotes.length]);

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
      showToast(getErrorMessage(error, "Unable to load your notes."), "error");
    }
  }

  async function handleDelete(noteId) {
    try {
      await api.delete(`/notes/${noteId}`);
      showToast("Note deleted successfully.", "success");
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
            <h2>Your notes</h2>
            <p>Preview your files, track note status, and delete uploads when needed.</p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-user-check"></i>
                <div>
                  <h3>{user?.name || "Your workspace"}</h3>
                  <p>This dashboard stays focused on overview, preview, and cleanup.</p>
                </div>
              </article>
            </div>
          </div>
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
