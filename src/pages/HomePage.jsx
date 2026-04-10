import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useReveal } from "../components/useReveal";
import { useAuth } from "../context/AuthContext";

const topSubjects = [
  { icon: "fa-code", label: "Computer Science" },
  { icon: "fa-building-columns", label: "Civil Engineering" },
  { icon: "fa-bolt", label: "Electrical Engineering" },
  { icon: "fa-gears", label: "Mechanical Engineering" },
  { icon: "fa-microchip", label: "Electronics Engineering" },
  { icon: "fa-pen-ruler", label: "Design" }
];

const faqItems = [
  {
    question: "How do I upload my notes on NoteSphere?",
    answer:
      "Sign in, open the Upload Notes page, add your title, subject, description, and file, then submit it for review."
  },
  {
    question: "Can I preview notes before downloading them?",
    answer:
      "Yes. Approved notes can be previewed directly inside the platform so users can quickly check the content before downloading."
  },
  {
    question: "How are uploaded notes approved?",
    answer:
      "Each upload goes through an admin review process to help keep the library clean, relevant, and safe for students."
  },
  {
    question: "Will my profile show my uploads and activity?",
    answer:
      "Yes. Your profile displays your uploaded notes, profile picture, upload stats, and your note download activity."
  },
  {
    question: "What file types can I share?",
    answer:
      "You can upload common document formats supported by the platform, such as PDFs and study documents, as long as they follow the upload rules."
  }
];

export default function HomePage({ reloadKey, showToast }) {
  const [homeStats, setHomeStats] = useState({
    totalApprovedNotes: 0,
    totalFeaturedNotes: 0,
    totalSubjects: 0,
    totalDownloads: 0
  });
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [heroSearch, setHeroSearch] = useState("");
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    type: "query",
    message: ""
  });
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useReveal([trendingNotes.length, reloadKey]);

  useEffect(() => {
    async function loadHomeData() {
      const [statsResponse, trendingResponse] = await Promise.all([
        api.get("/notes/stats"),
        api.get("/notes/trending")
      ]);

      setHomeStats(statsResponse.data.summary);
      setTrendingNotes(trendingResponse.data.notes);
    }

    loadHomeData().catch((error) => {
      setHomeStats({
        totalApprovedNotes: 0,
        totalFeaturedNotes: 0,
        totalSubjects: 0,
        totalDownloads: 0
      });
      setTrendingNotes([]);
      showToast?.(getErrorMessage(error, "Unable to load the latest notes right now."), "error");
    });
  }, [reloadKey, showToast]);

  useEffect(() => {
    setFeedbackForm((current) => ({
      ...current,
      name: user?.name || "",
      email: user?.email || ""
    }));
  }, [user?.name, user?.email]);

  function openExplore(search = "") {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    navigate(`/notes${query}`);
  }

  function buildTrendingExploreLink(note) {
    const params = new URLSearchParams();
    const searchTerm = note.title?.trim() || note.subject?.trim() || "";

    if (searchTerm) {
      params.set("search", searchTerm);
    }

    if (note.id) {
      params.set("focus", note.id);
    }

    return `/notes?${params.toString()}`;
  }

  function handleFeedbackFieldChange(event) {
    const { name, value } = event.target;
    setFeedbackForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    try {
      setIsSendingFeedback(true);
      await api.post("/feedback", feedbackForm);
      setFeedbackForm((current) => ({
        ...current,
        type: "query",
        message: "",
        name: user?.name || "",
        email: user?.email || ""
      }));
      showToast("Your query has been sent successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to send your message right now."), "error");
    } finally {
      setIsSendingFeedback(false);
    }
  }

  return (
    <>
      <section className="hero container">
        <div className="hero__content reveal">
          <span className="eyebrow">Where sharp notes meet smarter learning</span>
          <h1>Smarter notes, better study experience.</h1>
          <p>Sign up, upload notes, and explore useful study material in one place.</p>

          <div className="hero__actions">
            <Link to="/upload" className="btn btn--primary">Upload Notes</Link>
            <Link to="/notes" className="btn btn--secondary">Browse Notes</Link>
            <Link to="/question-bank" className="btn btn--secondary">Question Bank</Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--secondary">Dashboard</Link>
            ) : null}
          </div>

          <div className="hero__search glass-card">
            <label htmlFor="heroSearch" className="sr-only">Search notes</label>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="heroSearch"
              placeholder="Search notes by title or subject..."
              value={heroSearch}
              onChange={(event) => setHeroSearch(event.target.value)}
            />
            <button type="button" className="btn btn--ghost" onClick={() => openExplore(heroSearch)}>
              Find Notes
            </button>
          </div>

          <div className="hero__stats">
            <article className="stat-card glass-card">
              <strong>{String(homeStats.totalApprovedNotes).padStart(2, "0")}</strong>
              <span>Notes Shared</span>
            </article>
            <article className="stat-card glass-card">
              <strong>{String(homeStats.totalSubjects).padStart(2, "0")}</strong>
              <span>Subjects Covered</span>
            </article>
            <article className="stat-card glass-card">
              <strong>{homeStats.totalDownloads}</strong>
              <span>Total Downloads</span>
            </article>
          </div>
        </div>

        <div className="hero__visual reveal">
          <div className="floating-card glass-card floating-card--main">
            <span className="floating-card__tag">Trending</span>
            <h3>{trendingNotes[0]?.title || "Real Notes From Your Database"}</h3>
            <p>{trendingNotes[0]?.description || "Once notes are added, trending content appears here automatically."}</p>
            <div className="floating-card__meta">
              <span><i className="fa-solid fa-book-open"></i> {trendingNotes[0]?.subject || "Study"}</span>
              <span><i className="fa-solid fa-download"></i> {trendingNotes[0]?.downloads || 0}</span>
            </div>
          </div>

          <div className="floating-card glass-card floating-card--small">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <div>
              <h4>Study smarter</h4>
              <p>Preview notes online, save time, and jump into the topics that matter most.</p>
            </div>
          </div>

          <div className="hero__glow hero__glow--one"></div>
          <div className="hero__glow hero__glow--two"></div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="container">
          <div className="section-heading reveal">
            <span className="eyebrow">Study Modules</span>
            <h2>Use the library the way you need</h2>
            <p>Open notes for study material or switch to the question bank for structured exam papers.</p>
          </div>

          <div className="module-grid">
            <article className="info-card glass-card reveal is-visible">
              <i className="fa-regular fa-note-sticky"></i>
              <div>
                <h3>Notes</h3>
                <p>Browse shared study material by subject and title.</p>
                <Link to="/notes" className="btn btn--secondary">Open Notes</Link>
              </div>
            </article>
            <article className="info-card glass-card reveal is-visible">
              <i className="fa-solid fa-folder-tree"></i>
              <div>
                <h3>Question Bank</h3>
                <p>Find papers by university, course, semester, subject, and exam type.</p>
                <Link to="/question-bank" className="btn btn--secondary">Open Question Bank</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--subjects">
        <div className="container">
          <div className="section-heading reveal">
            <span className="eyebrow">Top Subjects</span>
            <h2>Discover categories students search for most</h2>
            <p>Choose a subject and jump straight into the Explore page.</p>
          </div>

          <div className="subjects-grid">
            {topSubjects.map((subject) => (
              <button
                key={subject.label}
                type="button"
                className="subject-pill glass-card reveal"
                onClick={() => openExplore(subject.label)}
              >
                <i className={`fa-solid ${subject.icon}`}></i>
                <span>{subject.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--trending">
        <div className="container">
          <div className="section-heading reveal">
            <span className="eyebrow">Trending Notes</span>
            <h2>What learners are downloading right now</h2>
          </div>
          <div className="trending-grid">
            {trendingNotes.map((note) => (
              <Link
                key={note.id}
                to={buildTrendingExploreLink(note)}
                className="trending-card trending-card--link glass-card reveal is-visible"
              >
                <span className="note-card__chip">{note.subject}</span>
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <div className="trending-card__meta">
                  <span><i className="fa-solid fa-fire"></i> Trending</span>
                  <span><i className="fa-solid fa-download"></i> {note.downloads}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--faq">
        <div className="container">
          <div className="section-heading reveal">
            <span className="eyebrow">FAQ</span>
            <h2>Common questions, answered clearly</h2>
            <p>Everything new users usually want to know before they start uploading and exploring notes.</p>
          </div>

          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question} className="faq-item glass-card reveal">
                <summary className="faq-item__summary">
                  <span>{item.question}</span>
                  <i className="fa-solid fa-plus"></i>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--feedback">
        <div className="container split-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Feedback & Queries</span>
            <h2>Need help or want to suggest something better?</h2>
            <p>
              Send your questions, bug reports, or feature ideas directly from here.
              We will have your message saved properly so it can be reviewed.
            </p>

            <div className="info-stack">
              <article className="info-card glass-card reveal is-visible">
                <i className="fa-regular fa-comments"></i>
                <div>
                  <h3>Ask anything</h3>
                  <p>Share doubts about uploads, downloads, approvals, or your account.</p>
                </div>
              </article>
              <article className="info-card glass-card reveal is-visible">
                <i className="fa-regular fa-lightbulb"></i>
                <div>
                  <h3>Suggest improvements</h3>
                  <p>Feature ideas and UX feedback help make NoteSphere better for everyone.</p>
                </div>
              </article>
            </div>
          </div>

          <form className="feedback-form glass-card reveal is-visible" onSubmit={handleFeedbackSubmit}>
            <div className="form-group">
              <label htmlFor="feedbackName">Your name</label>
              <input
                id="feedbackName"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={feedbackForm.name}
                onChange={handleFeedbackFieldChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="feedbackEmail">Email address</label>
              <input
                id="feedbackEmail"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={feedbackForm.email}
                onChange={handleFeedbackFieldChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="feedbackType">Message type</label>
              <select
                id="feedbackType"
                name="type"
                value={feedbackForm.type}
                onChange={handleFeedbackFieldChange}
              >
                <option value="query">Query</option>
                <option value="feedback">Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="feedbackMessage">Your message</label>
              <textarea
                id="feedbackMessage"
                name="message"
                rows="6"
                placeholder="Write your query or feedback here..."
                value={feedbackForm.message}
                onChange={handleFeedbackFieldChange}
                required
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={isSendingFeedback}>
              {isSendingFeedback ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
