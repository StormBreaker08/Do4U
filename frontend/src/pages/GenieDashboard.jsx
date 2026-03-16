import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import RatingModal from "../components/RatingModal";
import StatsSection from "../components/StatsSection";
import TipsSection from "../components/TipsSection";
import Footer from "../components/Footer";
import ButtonSpinner from "../components/ButtonSpinner";
import logo from "../assets/your-logo.png";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--text" />
      <div className="skeleton skeleton--text skeleton--short" />
    </div>
  );
}

const TABS = [
  { key: "available", label: "🔍 Available Jobs" },
  { key: "my-jobs", label: "📋 My Assignments" },
  { key: "verification", label: "✅ Verification" },
];

export default function GenieDashboard() {
  const { user, fetchMe } = useAuth();
  const [tab, setTab] = useState("available");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rateUserJob, setRateUserJob] = useState(null);
  const [isRating, setIsRating] = useState(false);
  const [toast, setToast] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [skillProofFiles, setSkillProofFiles] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadJobs = useCallback(async () => {
    if (tab === "verification") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        tab === "available" ? "/api/v1/jobs/available" : "/api/v1/jobs/my-jobs";
      const data = await api.get(endpoint);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleAccept = async (job) => {
    setActionId(job.id);
    try {
      // Use PATCH method for job acceptance with wallet validation
      const result = await api.patch(`/api/v1/jobs/${job.id}/accept`, {});
      showToast(`Job accepted! ₹${result.escrow_amount} moved to escrow.`);
      loadJobs();
    } catch (err) {
      // Handle specific error cases
      if (err.status === 400 && err.message?.includes("Insufficient")) {
        showToast(
          `Cannot accept: User has insufficient wallet balance for this job.`,
        );
      } else if (err.status === 409) {
        showToast(`Job already assigned to another genie.`);
      } else {
        showToast(`Error: ${err.message}`);
      }
    } finally {
      setActionId(null);
    }
  };

  const handleStart = async (job) => {
    setActionId(job.id);
    try {
      await api.post(`/api/v1/jobs/${job.id}/start`, {});
      showToast(
        <>
          Job started! Good luck
          <img
            src={logo}
            alt="Do4U"
            style={{
              width: "16px",
              height: "16px",
              verticalAlign: "middle",
              marginLeft: "4px",
            }}
          />
        </>,
      );
      loadJobs();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  const handleComplete = async (job) => {
    setActionId(job.id);
    try {
      await api.post(`/api/v1/jobs/${job.id}/complete`, {});
      showToast("Job marked as complete! 🎉");
      loadJobs();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  const handleRateUser = async ({ rating, comment }) => {
    setIsRating(true);
    try {
      const res = await api.post(`/api/v1/jobs/${rateUserJob.id}/rate-user`, {
        rating,
        comment,
      });
      showToast(
        `Rated successfully! User earned ${res.points_awarded} points.`,
      );
      setRateUserJob(null);
      loadJobs();
      // Refresh AuthContext to update points in Navbar
      fetchMe();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRating(false);
    }
  };

  const getAction = (job) => {
    if (tab === "available")
      return { label: "Accept Job", handler: handleAccept };
    if (job.status === "ACCEPTED")
      return { label: "Start Job", handler: handleStart };
    if (job.status === "IN_PROGRESS")
      return { label: "Mark Complete", handler: handleComplete };
    if (job.status === "COMPLETED" && !job.genie_rating) {
      return { label: "Rate User", handler: () => setRateUserJob(job) };
    }
    return null;
  };

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    if (!documentFile) {
      showToast("Please upload a verification document.");
      return;
    }

    const skills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      showToast("Please add at least one skill.");
      return;
    }

    setVerificationLoading(true);
    try {
      const formData = new FormData();
      formData.append("document", documentFile);
      formData.append("skills", JSON.stringify(skills));

      if (skillProofFiles.length > 0) {
        skillProofFiles.forEach((file) => {
          formData.append("skill_proof_docs", file);
        });
      }

      await api.postForm("/api/v1/users/verification/apply", formData);
      showToast("Verification submitted and sent for review.");
      setDocumentFile(null);
      setSkillsInput("");
      setSkillProofFiles([]);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <div className="page__header">
          <div>
            <h1 className="page__title">Genie Dashboard</h1>
            <p className="page__subtitle">
              Hello, {user?.name || "Genie"} 🧞‍♂️ (Do4U{" "}
              <img
                src={logo}
                alt="Do4U"
                style={{
                  width: "20px",
                  height: "20px",
                  verticalAlign: "middle",
                  marginLeft: "4px",
                }}
              />
              )
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`filter-tab${tab === t.key ? " filter-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <StatsSection
          stats={[
            {
              label: "Available Jobs",
              value: jobs.filter((j) => j.status !== "IN_PROGRESS").length,
              sub: "Ready to accept",
            },
            {
              label: "Active Assignments",
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
        {tab === "verification" ? (
          <section className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Genie Verification</h2>
            <form onSubmit={handleVerificationSubmit} className="form-grid">
              <div className="form-group">
                <label className="form-label">Document</label>
                <input
                  className="form-input"
                  type="file"
                  onChange={(event) =>
                    setDocumentFile(event.target.files?.[0] || null)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Plumbing, Electrician"
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Skill Proof Documents (optional)
                </label>
                <input
                  className="form-input"
                  type="file"
                  multiple
                  onChange={(event) =>
                    setSkillProofFiles(Array.from(event.target.files || []))
                  }
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={verificationLoading}
              >
                {verificationLoading ? (
                  <>
                    <ButtonSpinner />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            </form>
          </section>
        ) : (
          <div className="job-grid" style={{ marginTop: 16 }}>
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : jobs.length > 0 ? (
              jobs.map((job) => {
                const action = getAction(job);
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    onAction={action?.handler}
                    actionLabel={action?.label}
                    loading={actionId === job.id}
                    currentUserId={user?.id}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={tab === "available" ? "🔍" : "📋"}
                title={
                  tab === "available"
                    ? "No available jobs"
                    : tab === "my-jobs"
                      ? "No assignments yet"
                      : "No verification data"
                }
                message={
                  tab === "available"
                    ? "Check back soon — new jobs are posted regularly."
                    : tab === "my-jobs"
                      ? "Accept a job to see it here."
                      : "Complete your verification to start earning"
                }
              />
            )}
          </div>
        )}

        <TipsSection
          title="💡 Tips for Success as a Genie"
          tips={[
            {
              icon: "⚡",
              title: "Complete Profile",
              description:
                "A complete profile with skills and verification increases your chances of getting hired",
            },
            {
              icon: "⏱️",
              title: "Quick Response",
              description:
                "Respond to job offers quickly — acceptances within 2 hours have higher success rates",
            },
            {
              icon: "⭐",
              title: "Quality Work",
              description:
                "Deliver excellent work and maintain high ratings to attract better job opportunities",
            },
            {
              icon: "💬",
              title: "Professional Communication",
              description:
                "Clear communication with job posters leads to better ratings and repeat business",
            },
          ]}
        />

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav">
          <div className="mobile-nav__inner">
            <a
              href="#available"
              className={`mobile-nav__item ${tab === "available" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setTab("available");
              }}
            >
              <span className="mobile-nav__icon">🔍</span>
              <span className="mobile-nav__label">Browse</span>
            </a>
            <a
              href="#my-jobs"
              className={`mobile-nav__item ${tab === "my-jobs" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setTab("my-jobs");
              }}
            >
              <span className="mobile-nav__icon">📋</span>
              <span className="mobile-nav__label">My Jobs</span>
            </a>
            <a
              href="#verification"
              className={`mobile-nav__item ${tab === "verification" ? "mobile-nav__item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setTab("verification");
              }}
            >
              <span className="mobile-nav__icon">✅</span>
              <span className="mobile-nav__label">Verify</span>
            </a>
          </div>
        </nav>
        <Footer />
      </main>

      {rateUserJob && (
        <RatingModal
          job={rateUserJob}
          loading={isRating}
          onClose={() => setRateUserJob(null)}
          onSubmit={handleRateUser}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
