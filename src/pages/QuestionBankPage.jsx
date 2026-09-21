import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaginationControls from "../components/PaginationControls";
import QuestionPaperPreviewModal from "../components/QuestionPaperPreviewModal";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import api, { getErrorMessage } from "../services/api";

const initialPagination = {
  currentPage: 1,
  limit: 12,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

export default function QuestionBankPage({ showToast }) {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewPaper, setPreviewPaper] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useReveal([papers.length, isLoading]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPapers();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [currentPage, searchQuery]);

  async function loadPapers() {
    try {
      setIsLoading(true);
      const response = await api.get("/question-bank/papers", {
        params: {
          ...(searchQuery ? { q: searchQuery } : {}),
          page: currentPage,
          limit: initialPagination.limit
        }
      });
      setPapers(response.data.papers || []);
      setPagination(response.data.pagination || initialPagination);
      setLoadError("");
      if (response.data.pagination?.currentPage && response.data.pagination.currentPage !== currentPage) {
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setPapers([]);
      setPagination(initialPagination);
      setLoadError(getErrorMessage(error, "Unable to load question papers right now."));
    } finally {
      setIsLoading(false);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setCurrentPage(1);
  }

  function handlePreview(paper) {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      showToast("Create an account or log in to preview question papers.", "info");
      return;
    }

    setPreviewPaper(paper);
  }

  async function handleDownload(paperId) {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent("/question-bank")}`);
      showToast("Create an account or log in to download question papers.", "info");
      return;
    }

    try {
      const paperToDownload = papers.find((paper) => paper.id === paperId);
      const response = await api.get(`/question-bank/papers/${paperId}/download`, {
        responseType: "blob"
      });
      const objectUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = paperToDownload?.fileName || "question-paper";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      showToast("Download started.", "success");
      setPapers((current) =>
        current.map((paper) =>
          paper.id === paperId ? { ...paper, downloads: paper.downloads + 1 } : paper
        )
      );
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to download this question paper."), "error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading reveal">
          <span className="eyebrow">Question Bank</span>
          <h2>Browse question papers</h2>
          <p>Search by title, subject, university, course, semester, year, or exam type.</p>
        </div>

        <div className="question-bank-toolbar glass-card reveal">
          <div className="search-field">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by subject, university, course, or title"
              aria-label="Search question papers"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button type="button" className="btn btn--secondary" onClick={clearSearch}>
            Clear
          </button>
        </div>

        {isLoading ? <div className="page-status glass-card">Loading question papers...</div> : null}
        {!isLoading && loadError ? <div className="page-status glass-card">{loadError}</div> : null}

        {!isLoading && !loadError ? (
          <>
            <div className="notes-grid notes-grid--subject">
              {papers.map((paper) => (
                <article key={paper.id} className="note-card glass-card reveal is-visible">
                  <div className="note-card__topbar">
                    <span className="note-card__chip">{paper.subjectName}</span>
                    <div className="note-card__icon-actions">
                      <button
                        type="button"
                        className="note-card__icon-action"
                        onClick={() => handlePreview(paper)}
                        aria-label={`Preview ${paper.title}`}
                        title="Preview"
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                      <button
                        type="button"
                        className="note-card__icon-action note-card__icon-action--primary"
                        onClick={() => handleDownload(paper.id)}
                        aria-label={`Download ${paper.title}`}
                        title="Download"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <h3>{paper.title}</h3>
                  <p>{paper.paperLabel}</p>
                  <div className="note-card__meta">
                    <span><i className="fa-solid fa-building-columns"></i> {paper.universityName}</span>
                    <span><i className="fa-regular fa-clock"></i> {formatDate(paper.createdAt)}</span>
                  </div>
                  <div className="note-card__meta">
                    <span><i className="fa-solid fa-file-lines"></i> {paper.fileName}</span>
                    <span><i className="fa-solid fa-download"></i> {paper.downloads}</span>
                  </div>
                  <div className="note-card__actions">
                    <span className="note-card__downloads">{paper.courseName} | {paper.semester}</span>
                  </div>
                </article>
              ))}
            </div>

            {papers.length === 0 ? (
              <p className="empty-state glass-card">
                No question papers match your search.
              </p>
            ) : null}

            {papers.length > 0 ? (
              <PaginationControls
                pagination={pagination}
                onPageChange={setCurrentPage}
                itemLabel="papers"
              />
            ) : null}
          </>
        ) : null}

        <QuestionPaperPreviewModal
          paper={previewPaper}
          onClose={() => setPreviewPaper(null)}
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
