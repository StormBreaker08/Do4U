import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import StatsSection from "../components/StatsSection";
import TipsSection from "../components/TipsSection";
import Footer from "../components/Footer";

const STATUS_FILTERS = [
  "ALL",
  "POSTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--text" />
      <div className="skeleton skeleton--text skeleton--short" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const data = await api.get(`/api/v1/jobs/my-jobs${params}`);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCancelAssignment = async (job) => {
    setActionId(job.id);
    try {
      await api.post(`/api/v1/jobs/${job.id}/cancel-assignment`, {});
      showToast("Assignment cancelled successfully.");
      loadJobs();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  const getAction = (job) => {
    if (job.status === "ACCEPTED" || job.status === "IN_PROGRESS") {
      return { label: "Cancel Assignment", handler: handleCancelAssignment };
    }
    return null;
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <div className="page__header">
          <div>
            <h1 className="page__title">My Jobs</h1>
            <p className="page__subtitle">
              Welcome back, {user?.name || "User"} 👋
            </p>
            {user?.reward_points > 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text)",
                  textTransform: "uppercase",
                  background: "var(--neo-yellow)",
                  padding: "6px 14px",
                  border: "2px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "2px 2px 0 var(--border)",
                  display: "inline-block",
                }}
              >
                ✨ {user.reward_points} Reward Points
              </div>
            )}
          </div>
          <Link to="/create-job" className="btn btn--primary">
            + Post a Job
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="filter-tabs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`filter-tab${filter === s ? " filter-tab--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Stats Section */}
        <StatsSection
          stats={[
            {
              label: "Total Posted",
              value: jobs.filter((j) => j.status === "POSTED").length,
              sub: "Awaiting genies",
            },
            {
              label: "Active Jobs",
              value: jobs.filter((j) => j.status === "IN_PROGRESS").length,
              sub: "In progress",
            },
            {
              label: "Completed",
              value: jobs.filter((j) => j.status === "COMPLETED").length,
              sub: "All finished",
            },
          ]}
        />

        {/* Content */}
        {loading ? (
          <div className="job-grid">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="job-grid">
            {jobs.map((job) => {
              const action = getAction(job);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  userType="user"
                  onAction={action?.handler}
                  actionLabel={action?.label}
                  loading={actionId === job.id}
                  currentUserId={user?.id}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title={
              filter === "ALL"
                ? "No jobs posted yet"
                : `No ${filter.replace("_", " ").toLowerCase()} jobs`
            }
            message={
              filter === "ALL"
                ? "Create your first job to get started."
                : `No jobs with status "${filter.replace("_", " ")}".`
            }
          />
        )}

        {/* Tips Section */}
        <TipsSection
          title="💡 Tips for Success"
          tips={[
            {
              icon: "📝",
              title: "Be Specific",
              description:
                "Detailed descriptions get better responses from Genies faster",
            },
            {
              icon: "💰",
              title: "Fair Pricing",
              description:
                "Set competitive budgets to attract quality Genies quickly",
            },
            {
              icon: "⏱️",
              title: "Quick Response",
              description:
                "Reply to Genie offers within 2 hours for better acceptance rates",
            },
            {
              icon: "⭐",
              title: "Leave Ratings",
              description:
                "Help the community by rating completed jobs accurately",
            },
          ]}
        />

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav">
          <div className="mobile-nav__inner">
            <a
              href="#all"
              className={`mobile-nav__item ${filter === "ALL" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setFilter("ALL");
              }}
            >
              <span className="mobile-nav__icon">📋</span>
              <span className="mobile-nav__label">All</span>
            </a>
            <a
              href="#posted"
              className={`mobile-nav__item ${filter === "POSTED" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setFilter("POSTED");
              }}
            >
              <span className="mobile-nav__icon">📝</span>
              <span className="mobile-nav__label">Posted</span>
            </a>
            <a
              href="#in-progress"
              className={`mobile-nav__item ${filter === "IN_PROGRESS" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setFilter("IN_PROGRESS");
              }}
            >
              <span className="mobile-nav__icon">⚡</span>
              <span className="mobile-nav__label">Active</span>
            </a>
            <a
              href="#completed"
              className={`mobile-nav__item ${filter === "COMPLETED" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setFilter("COMPLETED");
              }}
            >
              <span className="mobile-nav__icon">✅</span>
              <span className="mobile-nav__label">Done</span>
            </a>
            <Link to="/create-job" className="mobile-nav__item">
              <span className="mobile-nav__icon">➕</span>
              <span className="mobile-nav__label">New</span>
            </Link>
          </div>
        </nav>
        {/* Footer */}
        <Footer />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
