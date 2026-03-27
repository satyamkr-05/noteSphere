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

export default function HomePage({ reloadKey, showToast }) {
  const [homeStats, setHomeStats] = useState({
    totalApprovedNotes: 0,
    totalFeaturedNotes: 0,
    totalSubjects: 0,
    totalDownloads: 0
  });
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [heroSearch, setHeroSearch] = useState("");
  const { isAuthenticated } = useAuth();
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

  function openExplore(search = "") {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    navigate(`/explore${query}`);
  }

  return (
    <>
      <section className="hero container">
        <div className="hero__content reveal">
          <span className="eyebrow">Where sharp notes meet smarter learning</span>
          <h1>Smarter notes, better study experience.</h1>
          <p>
            Sign up, upload your notes, and explore learning resources from real users
            through a full-stack note sharing platform.
          </p>

          <div className="hero__actions">
            <Link to="/upload" className="btn btn--primary">Upload Notes</Link>
            <Link to="/explore" className="btn btn--secondary">Explore Notes</Link>
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
              <article key={note.id} className="trending-card glass-card reveal is-visible">
                <span className="note-card__chip">{note.subject}</span>
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <div className="trending-card__meta">
                  <span><i className="fa-solid fa-fire"></i> Trending</span>
                  <span><i className="fa-solid fa-download"></i> {note.downloads}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
