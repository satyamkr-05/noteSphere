import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaginationControls from "../components/PaginationControls";
import QuestionPaperPreviewModal from "../components/QuestionPaperPreviewModal";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import api, { getErrorMessage } from "../services/api";
import { QUESTION_PAPER_EXAM_TYPES } from "../../shared/questionBankLimits.js";

const initialPagination = {
  currentPage: 1,
  limit: 12,
  totalItems: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false
};

const initialFilters = {
  universityName: "",
  courseName: "",
  semester: "",
  subjectName: "",
  examYear: "",
  examType: ""
};

export default function QuestionBankPage({ showToast }) {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewPaper, setPreviewPaper] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const groupedPapers = useMemo(() => {
    const groups = new Map();

    for (const paper of papers) {
      const groupKey = paper.pathLabel;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey).push(paper);
    }

    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [papers]);

  const breadcrumb = [
    filters.universityName,
    filters.courseName,
    filters.semester,
    filters.subjectName
  ]
    .filter(Boolean)
    .join(" > ");

  useReveal([papers.length, isLoading, filters.subjectName, filters.universityName]);

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (!filters.universityName) {
      setCourses([]);
      setSemesters([]);
      setSubjects([]);
      return;
    }

    loadCourses(filters.universityName);
  }, [filters.universityName]);

  useEffect(() => {
    if (!filters.universityName || !filters.courseName) {
      setSemesters([]);
      setSubjects([]);
      return;
    }

    loadSemesters(filters.universityName, filters.courseName);
  }, [filters.universityName, filters.courseName]);

  useEffect(() => {
    if (!filters.universityName || !filters.courseName || !filters.semester) {
      setSubjects([]);
      return;
    }

    loadSubjects(filters.universityName, filters.courseName, filters.semester);
  }, [filters.universityName, filters.courseName, filters.semester]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPapers();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [currentPage, searchQuery, filters]);

  async function loadUniversities() {
    try {
      const response = await api.get("/question-bank/universities");
      setUniversities(response.data.universities || []);
    } catch (error) {
      setUniversities([]);
      showToast(getErrorMessage(error, "Unable to load universities."), "error");
    }
  }

  async function loadCourses(universityName) {
    try {
      const response = await api.get("/question-bank/courses", {
        params: { universityName }
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      setCourses([]);
      showToast(getErrorMessage(error, "Unable to load courses."), "error");
    }
  }

  async function loadSemesters(universityName, courseName) {
    try {
      const response = await api.get("/question-bank/semesters", {
        params: { universityName, courseName }
      });
      setSemesters(response.data.semesters || []);
    } catch (error) {
      setSemesters([]);
      showToast(getErrorMessage(error, "Unable to load semesters."), "error");
    }
  }

  async function loadSubjects(universityName, courseName, semester) {
    try {
      const response = await api.get("/question-bank/subjects", {
        params: { universityName, courseName, semester }
      });
      setSubjects(response.data.subjects || []);
    } catch (error) {
      setSubjects([]);
      showToast(getErrorMessage(error, "Unable to load subjects."), "error");
    }
  }

  async function loadPapers() {
    try {
      setIsLoading(true);
      const response = await api.get("/question-bank/papers", {
        params: {
          ...(searchQuery ? { q: searchQuery } : {}),
          ...(filters.universityName ? { universityName: filters.universityName } : {}),
          ...(filters.courseName ? { courseName: filters.courseName } : {}),
          ...(filters.semester ? { semester: filters.semester } : {}),
          ...(filters.subjectName ? { subjectName: filters.subjectName } : {}),
          ...(filters.examYear ? { examYear: filters.examYear } : {}),
          ...(filters.examType ? { examType: filters.examType } : {}),
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

  function updateFilter(name, value) {
    setCurrentPage(1);
    setFilters((current) => {
      const nextFilters = { ...current, [name]: value };

      if (name === "universityName") {
        nextFilters.courseName = "";
        nextFilters.semester = "";
        nextFilters.subjectName = "";
      }

      if (name === "courseName") {
        nextFilters.semester = "";
        nextFilters.subjectName = "";
      }

      if (name === "semester") {
        nextFilters.subjectName = "";
      }

      return nextFilters;
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setFilters(initialFilters);
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
          <h2>Browse question papers in a clear hierarchy</h2>
          <p>Filter by university, course, semester, subject, year, and exam type.</p>
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

          <div className="question-bank-filter-grid">
            <select
              value={filters.universityName}
              onChange={(event) => updateFilter("universityName", event.target.value)}
            >
              <option value="">All Universities</option>
              {universities.map((university) => (
                <option key={university} value={university}>
                  {university}
                </option>
              ))}
            </select>

            <select
              value={filters.courseName}
              onChange={(event) => updateFilter("courseName", event.target.value)}
              disabled={!filters.universityName}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={filters.semester}
              onChange={(event) => updateFilter("semester", event.target.value)}
              disabled={!filters.courseName}
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>

            <select
              value={filters.subjectName}
              onChange={(event) => updateFilter("subjectName", event.target.value)}
              disabled={!filters.semester}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Year"
              min="2000"
              max={new Date().getFullYear() + 1}
              value={filters.examYear}
              onChange={(event) => updateFilter("examYear", event.target.value)}
            />

            <select
              value={filters.examType}
              onChange={(event) => updateFilter("examType", event.target.value)}
            >
              <option value="">All Exam Types</option>
              {QUESTION_PAPER_EXAM_TYPES.map((examType) => (
                <option key={examType} value={examType}>
                  {examType}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn--secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {breadcrumb ? (
          <div className="question-bank-breadcrumb glass-card reveal is-visible">
            <strong>Current path</strong>
            <span>{breadcrumb}</span>
          </div>
        ) : null}

        {!filters.universityName && universities.length > 0 ? (
          <section className="section section--compact">
            <div className="section-heading reveal">
              <span className="eyebrow">Browse by University</span>
              <h2>Start from the first level</h2>
            </div>

            <div className="subjects-grid">
              {universities.map((university) => (
                <button
                  key={university}
                  type="button"
                  className="subject-pill glass-card reveal"
                  onClick={() => updateFilter("universityName", university)}
                >
                  <i className="fa-solid fa-building-columns"></i>
                  <span>{university}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {isLoading ? <div className="page-status glass-card">Loading question papers...</div> : null}
        {!isLoading && loadError ? <div className="page-status glass-card">{loadError}</div> : null}

        {!isLoading && !loadError ? (
          <>
            {groupedPapers.map(([pathLabel, pathPapers]) => (
              <section key={pathLabel} className="subject-section reveal is-visible">
                <div className="subject-section__header">
                  <div>
                    <span className="eyebrow eyebrow--subject">Question Bank</span>
                    <h3>{pathLabel}</h3>
                  </div>
                  <span className="subject-section__count">{pathPapers.length} papers</span>
                </div>

                <div className="notes-grid notes-grid--subject">
                  {pathPapers.map((paper) => (
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
              </section>
            ))}

            {papers.length === 0 ? (
              <p className="empty-state glass-card">
                No question papers match your current filters.
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
