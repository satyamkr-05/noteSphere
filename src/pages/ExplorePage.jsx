import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const DEFAULT_COURSES = ["B.Tech", "MBA", "Diploma"];

const initialFilters = {
  courseName: "",
  branchName: "",
  specializationName: "",
  subject: "",
  unitName: ""
};

export default function ExplorePage({ onNotesChanged, showToast }) {
  const { courseSlug = "" } = useParams();
  const [notes, setNotes] = useState([]);
  const [topNotes, setTopNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewNote, setPreviewNote] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState(() => ({
    courseName: searchParams.get("course") || "",
    branchName: searchParams.get("branch") || "",
    specializationName: searchParams.get("specialization") || "",
    subject: searchParams.get("subject") || "",
    unitName: searchParams.get("unit") || ""
  }));
  const [currentPage, setCurrentPage] = useState(getPageFromQuery(searchParams.get("page")));
  const [pagination, setPagination] = useState(initialPagination);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleCourses = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_COURSES, ...courses]))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [courses]
  );

  const routedCourseName = useMemo(
    () => resolveCourseNameFromSlug(courseSlug, visibleCourses),
    [courseSlug, visibleCourses]
  );
  const isDedicatedCoursePage = Boolean(courseSlug);

  const hierarchyState = useMemo(() => {
    if (!filters.courseName) {
      return {
        level: "course",
        title: "Courses",
        description: "Open a course to see uploaded branches and notes inside it.",
        items: courses
      };
    }

    if (!filters.branchName) {
      return {
        level: "branch",
        title: `${filters.courseName} Branches`,
        description: "Choose a branch to open its specialization and subject structure.",
        items: branches
      };
    }

    if (specializations.length > 0 && !filters.specializationName) {
      return {
        level: "specialization",
        title: `${filters.branchName} Specializations`,
        description: "Open a specialization if notes were uploaded under one.",
        items: specializations
      };
    }

    if (!filters.subject) {
      return {
        level: "subject",
        title: `${filters.specializationName || filters.branchName} Subjects`,
        description: "Open a subject to reach its notes, units, and topics.",
        items: subjects
      };
    }

    if (units.length > 0 && !filters.unitName) {
      return {
        level: "unit",
        title: `${filters.subject} Units`,
        description: "Open a unit or module to see the notes uploaded inside it.",
        items: units
      };
    }

    return {
      level: "notes",
      title: `${filters.unitName || filters.subject} Notes`,
      description: "These notes match the current academic path.",
      items: []
    };
  }, [branches, courses, filters, specializations, subjects, units]);

  const breadcrumbItems = useMemo(
    () =>
      [
        { key: "courseName", label: filters.courseName },
        { key: "branchName", label: filters.branchName },
        { key: "specializationName", label: filters.specializationName },
        { key: "subject", label: filters.subject },
        { key: "unitName", label: filters.unitName }
      ].filter((item) => item.label),
    [filters]
  );

  const groupedNotes = useMemo(() => {
    const groups = new Map();

    for (const note of notes) {
      const groupKey = note.unitPath || note.academicPath || note.subject || "General";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey).push(note);
    }

    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [notes]);

  const topSectionNotes = useMemo(() => {
    if (searchQuery.trim()) {
      return notes.slice(0, 4);
    }

    return topNotes.slice(0, 4);
  }, [notes, searchQuery, topNotes]);

  useReveal([notes.length, hierarchyState.level, filters.courseName, filters.subject, isLoading]);

  useEffect(() => {
    loadCourses();
    loadTopNotes();
  }, []);

  useEffect(() => {
    if (!routedCourseName) {
      return;
    }

    setFilters((current) => {
      if (current.courseName === routedCourseName) {
        return current;
      }

      return {
        ...current,
        courseName: routedCourseName,
        branchName: "",
        specializationName: "",
        subject: "",
        unitName: ""
      };
    });
    setCurrentPage(1);
  }, [routedCourseName]);

  useEffect(() => {
    if (!filters.courseName) {
      setBranches([]);
      setSpecializations([]);
      setSubjects([]);
      setUnits([]);
      return;
    }

    loadBranches(filters.courseName);
  }, [filters.courseName]);

  useEffect(() => {
    if (!filters.courseName || !filters.branchName) {
      setSpecializations([]);
      setSubjects([]);
      setUnits([]);
      return;
    }

    loadSpecializations(filters.courseName, filters.branchName);
  }, [filters.courseName, filters.branchName]);

  useEffect(() => {
    if (!filters.courseName || !filters.branchName) {
      setSubjects([]);
      setUnits([]);
      return;
    }

    loadSubjects(filters.courseName, filters.branchName, filters.specializationName);
  }, [filters.courseName, filters.branchName, filters.specializationName]);

  useEffect(() => {
    if (!filters.courseName || !filters.branchName || !filters.subject) {
      setUnits([]);
      return;
    }

    loadUnits(filters.courseName, filters.branchName, filters.specializationName, filters.subject);
  }, [filters.courseName, filters.branchName, filters.specializationName, filters.subject]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotes();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [currentPage, filters, searchQuery]);

  async function loadCourses() {
    try {
      const response = await api.get("/notes/courses");
      setCourses(response.data.courses || []);
    } catch (error) {
      setCourses([]);
      showToast(getErrorMessage(error, "Unable to load note courses."), "error");
    }
  }

  async function loadTopNotes() {
    try {
      const response = await api.get("/notes/trending");
      setTopNotes(response.data.notes || []);
    } catch (error) {
      setTopNotes([]);
      showToast(getErrorMessage(error, "Unable to load top notes."), "error");
    }
  }

  async function loadBranches(courseName) {
    try {
      const response = await api.get("/notes/branches", {
        params: { courseName }
      });
      setBranches(response.data.branches || []);
    } catch (error) {
      setBranches([]);
      showToast(getErrorMessage(error, "Unable to load branches."), "error");
    }
  }

  async function loadSpecializations(courseName, branchName) {
    try {
      const response = await api.get("/notes/specializations", {
        params: { courseName, branchName }
      });
      setSpecializations(response.data.specializations || []);
    } catch (error) {
      setSpecializations([]);
      showToast(getErrorMessage(error, "Unable to load specializations."), "error");
    }
  }

  async function loadSubjects(courseName, branchName, specializationName) {
    try {
      const response = await api.get("/notes/subjects", {
        params: {
          courseName,
          branchName,
          ...(specializationName ? { specializationName } : {})
        }
      });
      setSubjects(response.data.subjects || []);
    } catch (error) {
      setSubjects([]);
      showToast(getErrorMessage(error, "Unable to load subjects."), "error");
    }
  }

  async function loadUnits(courseName, branchName, specializationName, subject) {
    try {
      const response = await api.get("/notes/units", {
        params: {
          courseName,
          branchName,
          subject,
          ...(specializationName ? { specializationName } : {})
        }
      });
      setUnits(response.data.units || []);
    } catch (error) {
      setUnits([]);
      showToast(getErrorMessage(error, "Unable to load units."), "error");
    }
  }

  async function loadNotes() {
    try {
      setIsLoading(true);
      const response = await api.get("/notes", {
        params: {
          ...(searchQuery ? { q: searchQuery } : {}),
          ...(filters.courseName ? { courseName: filters.courseName } : {}),
          ...(filters.branchName ? { branchName: filters.branchName } : {}),
          ...(filters.specializationName ? { specializationName: filters.specializationName } : {}),
          ...(filters.subject ? { subject: filters.subject } : {}),
          ...(filters.unitName ? { unitName: filters.unitName } : {}),
          page: currentPage,
          limit: initialPagination.limit
        }
      });

      setNotes(response.data.notes || []);
      setPagination(response.data.pagination || initialPagination);
      setLoadError("");
      setSearchParams(buildSearchParams(searchQuery, filters, currentPage, !isDedicatedCoursePage));

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
  }

  function updateFilter(name, value) {
    setCurrentPage(1);
    setFilters((current) => {
      const nextFilters = { ...current, [name]: value };

      if (name === "courseName") {
        if (isDedicatedCoursePage && current.courseName === value) {
          return current;
        }

        nextFilters.branchName = "";
        nextFilters.specializationName = "";
        nextFilters.subject = "";
        nextFilters.unitName = "";
      }

      if (name === "branchName") {
        nextFilters.specializationName = "";
        nextFilters.subject = "";
        nextFilters.unitName = "";
      }

      if (name === "specializationName") {
        nextFilters.subject = "";
        nextFilters.unitName = "";
      }

      if (name === "subject") {
        nextFilters.unitName = "";
      }

      return nextFilters;
    });
  }

  function handleHierarchyCardClick(value) {
    const fieldMap = {
      course: "courseName",
      branch: "branchName",
      specialization: "specializationName",
      subject: "subject",
      unit: "unitName"
    };

    const fieldName = fieldMap[hierarchyState.level];

    if (fieldName) {
      updateFilter(fieldName, value);
    }
  }

  function openCoursePage(course) {
    navigate(`/notes/${slugifyCourse(course)}`);
  }

  function handleBreadcrumbClick(index) {
    setCurrentPage(1);
    setFilters((current) => {
      const nextFilters = { ...current };

      for (let i = index + 1; i < breadcrumbItems.length; i += 1) {
        nextFilters[breadcrumbItems[i].key] = "";
      }

      return nextFilters;
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setFilters((current) => ({
      ...initialFilters,
      ...(isDedicatedCoursePage && current.courseName ? { courseName: current.courseName } : {})
    }));
    setCurrentPage(1);
  }

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
      navigate(`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
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

  const shouldShowNotes = hierarchyState.level === "notes" || Boolean(searchQuery.trim());

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading reveal">
          <span className="eyebrow">Explore Notes</span>
          <h2>{isDedicatedCoursePage && filters.courseName ? `${filters.courseName} Notes` : "Open notes step by step"}</h2>
        </div>

        <div className="question-bank-toolbar glass-card reveal">
          <div className="search-field">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by title, topic, subject, branch, or course"
              aria-label="Search notes"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="explore-toolbar__actions">
            <button type="button" className="btn btn--secondary" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </div>

        {breadcrumbItems.length > 0 ? (
          <div className="hierarchy-breadcrumb glass-card reveal is-visible">
            <span className="hierarchy-breadcrumb__label">Path</span>
            <div className="hierarchy-breadcrumb__items">
              {breadcrumbItems.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  className="hierarchy-breadcrumb__item"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {visibleCourses.length > 0 ? (
          <section className="section section--compact">
            <div className="course-rail glass-card reveal is-visible">
              <div className="course-rail__header">
                <span className="eyebrow">Courses</span>
                <h2>Open By Course</h2>
              </div>

              <div className="course-rail__list">
                {visibleCourses.map((course) => (
                  <button
                    key={`course-${course}`}
                    type="button"
                    className={`course-rail__item${filters.courseName === course ? " is-selected" : ""}`}
                    onClick={() => openCoursePage(course)}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {topSectionNotes.length > 0 ? (
          <section className="section section--compact">
            <div className="section-heading reveal">
              <span className="eyebrow">{searchQuery.trim() ? "Search" : "Top Notes"}</span>
              <h2>{searchQuery.trim() ? "Relevant Notes" : "Popular Notes"}</h2>
            </div>

            <div className="notes-grid notes-grid--subject">
              {topSectionNotes.map((note) => (
                <article key={`top-${note.id}`} className="note-card glass-card reveal is-visible">
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
                  <p>{note.topicName || note.description || note.subject}</p>
                  <div className="note-card__actions">
                    <span className="note-card__downloads">{note.downloads} downloads</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hierarchyState.level !== "course" && hierarchyState.items.length > 0 ? (
          <section className="section section--compact">
            <div className="section-heading reveal">
              <span className="eyebrow">Browse</span>
              <h2>{hierarchyState.title}</h2>
            </div>

            <div className="hierarchy-grid">
              {hierarchyState.items.map((item) => (
                <button
                  key={`${hierarchyState.level}-${item}`}
                  type="button"
                  className="hierarchy-card glass-card reveal is-visible"
                  onClick={() => handleHierarchyCardClick(item)}
                >
                  <span className="hierarchy-card__eyebrow">{formatHierarchyLevel(hierarchyState.level)}</span>
                  <strong>{item}</strong>
                  <span className="hierarchy-card__hint">Open</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {isLoading ? <div className="page-status glass-card">Loading notes...</div> : null}
        {!isLoading && loadError ? <div className="page-status glass-card">{loadError}</div> : null}

        {!isLoading && !loadError && shouldShowNotes ? (
          <>
            {groupedNotes.map(([groupLabel, groupNotes]) => (
              <section key={groupLabel} className="subject-section reveal is-visible">
                <div className="subject-section__header">
                  <div>
                    <span className="eyebrow eyebrow--subject">Notes</span>
                    <h3>{groupLabel}</h3>
                  </div>
                  <span className="subject-section__count">{groupNotes.length} notes</span>
                </div>

                <div className="notes-grid notes-grid--subject">
                  {groupNotes.map((note) => (
                    <article key={note.id} className="note-card glass-card reveal is-visible">
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
                      <p>{note.topicName || note.description || "Structured class notes"}</p>
                      <div className="note-card__meta">
                        <span><i className="fa-solid fa-layer-group"></i> {note.unitName || "General unit"}</span>
                        <span><i className="fa-solid fa-book-open"></i> {note.topicName || note.subject}</span>
                      </div>
                      <div className="note-card__actions">
                        <span className="note-card__downloads">{note.downloads} downloads</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {notes.length === 0 ? (
              <p className="empty-state glass-card">
                No notes match the current path or search.
              </p>
            ) : null}

            {notes.length > 0 ? (
              <PaginationControls pagination={pagination} onPageChange={setCurrentPage} itemLabel="notes" />
            ) : null}
          </>
        ) : null}

        <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} showToast={showToast} />
      </div>
    </section>
  );
}

function getPageFromQuery(pageValue) {
  const parsedValue = Number.parseInt(pageValue || "1", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function buildSearchParams(searchQuery, filters, currentPage, includeCourse = true) {
  return searchQuery || currentPage > 1 || Object.values(filters).some(Boolean)
    ? {
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(includeCourse && filters.courseName ? { course: filters.courseName } : {}),
        ...(filters.branchName ? { branch: filters.branchName } : {}),
        ...(filters.specializationName ? { specialization: filters.specializationName } : {}),
        ...(filters.subject ? { subject: filters.subject } : {}),
        ...(filters.unitName ? { unit: filters.unitName } : {}),
        ...(currentPage > 1 ? { page: String(currentPage) } : {})
      }
    : {};
}

function formatHierarchyLevel(level) {
  const labels = {
    course: "Course",
    branch: "Branch",
    specialization: "Specialization",
    subject: "Subject",
    unit: "Unit"
  };

  return labels[level] || "Item";
}

function slugifyCourse(course) {
  return course
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCourseNameFromSlug(courseSlug, courses) {
  if (!courseSlug) {
    return "";
  }

  const matchedCourse = courses.find((course) => slugifyCourse(course) === courseSlug);

  if (matchedCourse) {
    return matchedCourse;
  }

  if (courseSlug === "b-tech" || courseSlug === "btech") {
    return "B.Tech";
  }

  if (courseSlug === "mba") {
    return "MBA";
  }

  if (courseSlug === "diploma") {
    return "Diploma";
  }

  return "";
}
