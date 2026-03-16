import { useState, useEffect } from "react";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import StatsSection from "../components/StatsSection";
import TipsSection from "../components/TipsSection";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}

function UserRow({ user, onRoleChange, updating }) {
  const [newRole, setNewRole] = useState(user.role);

  const handleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleSave = () => {
    if (newRole !== user.role) onRoleChange(user.id, newRole);
  };

  return (
    <tr className="admin-table__row">
      <td className="admin-table__cell">{user.name}</td>
      <td className="admin-table__cell">
        <span className="badge badge--default">{user.role}</span>
      </td>
      <td className="admin-table__cell">
        {new Date(user.created_at).toLocaleDateString("en-IN")}
      </td>
      <td className="admin-table__cell">
        <div className="admin-table__actions">
          <select
            className="form-input form-input--sm"
            value={newRole}
            onChange={handleChange}
            disabled={updating}
          >
            <option value="user">user</option>
            <option value="genie">genie</option>
            <option value="admin">admin</option>
          </select>
          <button
            className="btn btn--sm btn--primary"
            onClick={handleSave}
            disabled={updating || newRole === user.role}
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verificationUpdatingId, setVerificationUpdatingId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const normalizeUsers = (payload) => {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.users)
        ? payload.users
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return list.map((user) => ({
      ...user,
      name: user?.name || "Unnamed User",
      role: ["user", "genie", "admin"].includes(
        String(user?.role || "").toLowerCase(),
      )
        ? String(user.role).toLowerCase()
        : "user",
      created_at: user?.created_at || new Date().toISOString(),
    }));
  };

  const buildFileUrl = (path) => {
    if (!path || typeof path !== "string") return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  };

  const extractProofLinks = (proofs) => {
    if (!proofs) return [];
    if (typeof proofs === "string") return [proofs];

    if (Array.isArray(proofs)) {
      return proofs.filter((item) => typeof item === "string");
    }

    if (typeof proofs === "object") {
      if (Array.isArray(proofs.documents)) {
        return proofs.documents.filter((item) => typeof item === "string");
      }
      return Object.values(proofs).filter((item) => typeof item === "string");
    }

    return [];
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [dashResult, usersResult, jobsResult] = await Promise.allSettled([
          api.get("/api/v1/admin/dashboard"),
          api.get("/api/v1/admin/users"),
          api.get("/api/v1/admin/jobs"),
        ]);
        if (dashResult.status === "fulfilled") {
          setDashboard(dashResult.value);
        } else {
          setDashboard(null);
          showToast(
            `Dashboard load failed: ${dashResult.reason?.message || "Unknown error"}`,
          );
        }

        if (usersResult.status === "fulfilled") {
          setUsers(normalizeUsers(usersResult.value));
        } else {
          setUsers([]);
          showToast(
            `Users load failed: ${usersResult.reason?.message || "Unknown error"}`,
          );
        }

        if (jobsResult.status === "fulfilled") {
          setJobs(Array.isArray(jobsResult.value) ? jobsResult.value : []);
        } else {
          setJobs([]);
          showToast(
            `Jobs load failed: ${jobsResult.reason?.message || "Unknown error"}`,
          );
        }

        try {
          const verificationData = await api.get(
            "/api/v1/admin/verifications/pending",
          );
          setPendingVerifications(
            Array.isArray(verificationData) ? verificationData : [],
          );
        } catch (verificationError) {
          setPendingVerifications([]);
          showToast(`Verification load failed: ${verificationError.message}`);
        }
      } catch (err) {
        showToast(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(true);
    try {
      await api.put(
        `/api/v1/admin/users/${userId}/role?new_role=${newRole}`,
        {},
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showToast(`Role updated to "${newRole}".`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerificationAction = async (userId, action) => {
    setVerificationUpdatingId(userId);
    try {
      await api.post(`/api/v1/admin/verifications/${userId}/${action}`, {});
      setPendingVerifications((prev) =>
        prev.filter((item) => item.user_id !== userId),
      );
      showToast(`Verification ${action}d successfully.`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setVerificationUpdatingId(null);
    }
  };

  useEffect(() => {
    const loadPendingVerifications = async () => {
      if (activeTab !== "verifications") return;
      try {
        const verificationData = await api.get(
          "/api/v1/admin/verifications/pending",
        );
        setPendingVerifications(
          Array.isArray(verificationData) ? verificationData : [],
        );
      } catch (err) {
        showToast(`Verification load failed: ${err.message}`);
      }
    };

    loadPendingVerifications();
  }, [activeTab]);

  const jobsByStatus = dashboard?.jobs_by_status || {};
  const usersByRole = dashboard?.users_by_role || {};

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <div className="page__header">
          <div>
            <h1 className="page__title">Admin Panel</h1>
            <p className="page__subtitle">Platform overview and controls</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          {["overview", "users", "jobs", "verifications"].map((t) => (
            <button
              key={t}
              className={`filter-tab${activeTab === t ? " filter-tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader fullScreen />
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <>
                <h2 className="section-title">Users by Role</h2>
                <div className="stats-grid">
                  {Object.entries(usersByRole).map(([r, count]) => (
                    <StatCard key={r} label={r.toUpperCase()} value={count} />
                  ))}
                </div>

                <h2 className="section-title">Jobs by Status</h2>
                <div className="stats-grid">
                  {Object.entries(jobsByStatus).map(([s, count]) => (
                    <StatCard key={s} label={s} value={count} />
                  ))}
                </div>

                <h2 className="section-title">Recent Jobs</h2>
                {dashboard?.recent_jobs?.length > 0 ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>User</th>
                          <th>Genie</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recent_jobs.map((j) => (
                          <tr key={j.id} className="admin-table__row">
                            <td className="admin-table__cell">{j.title}</td>
                            <td className="admin-table__cell">
                              <StatusBadge status={j.status} />
                            </td>
                            <td className="admin-table__cell">
                              {j.user || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {j.genie || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {new Date(j.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState icon="📋" title="No jobs yet" />
                )}
              </>
            )}

            {/* ── USERS ── */}
            {activeTab === "users" && (
              <>
                <h2 className="section-title">All Users ({users.length})</h2>
                {users.length === 0 ? (
                  <EmptyState icon="👤" title="No users found" />
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Change Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <UserRow
                            key={u.id}
                            user={u}
                            onRoleChange={handleRoleChange}
                            updating={updating}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── JOBS ── */}
            {activeTab === "jobs" && (
              <>
                <h2 className="section-title">All Jobs ({jobs.length})</h2>
                {jobs.length === 0 ? (
                  <EmptyState icon="📋" title="No jobs found" />
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Price</th>
                          <th>Location</th>
                          <th>Posted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((j) => (
                          <tr key={j.id} className="admin-table__row">
                            <td className="admin-table__cell">{j.title}</td>
                            <td className="admin-table__cell">
                              <StatusBadge status={j.status} />
                            </td>
                            <td className="admin-table__cell">
                              {j.price != null
                                ? `₹${Number(j.price).toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="admin-table__cell">
                              {j.location || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {new Date(j.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === "verifications" && (
              <>
                <h2 className="section-title">
                  Pending Genie Verifications ({pendingVerifications.length})
                </h2>
                {pendingVerifications.length === 0 ? (
                  <EmptyState
                    icon="✅"
                    title="No pending verification requests"
                  />
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Document</th>
                          <th>Skills</th>
                          <th>Skill Proofs</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingVerifications.map((item) => (
                          <tr key={item.user_id} className="admin-table__row">
                            <td className="admin-table__cell">
                              {item.name || "—"}
                            </td>
                            <td className="admin-table__cell">
                              {item.document_path ? (
                                <a
                                  href={`${import.meta.env.VITE_BACKEND_URL}${item.document_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View Document
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="admin-table__cell">
                              {Array.isArray(item.skills) &&
                              item.skills.length > 0
                                ? item.skills.join(", ")
                                : "—"}
                            </td>
                            <td className="admin-table__cell">
                              {(() => {
                                const proofLinks = extractProofLinks(
                                  item.skill_proofs,
                                );
                                if (proofLinks.length === 0) return "—";

                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    {proofLinks.map((proofPath, index) => {
                                      const proofUrl = buildFileUrl(proofPath);
                                      if (!proofUrl) return null;

                                      return (
                                        <a
                                          key={`${item.user_id}-${index}`}
                                          href={proofUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          View Proof {index + 1}
                                        </a>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="admin-table__cell">
                              <div className="admin-table__actions">
                                <button
                                  className="btn btn--sm btn--primary"
                                  onClick={() =>
                                    handleVerificationAction(
                                      item.user_id,
                                      "approve",
                                    )
                                  }
                                  disabled={
                                    verificationUpdatingId === item.user_id
                                  }
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn--sm"
                                  onClick={() =>
                                    handleVerificationAction(
                                      item.user_id,
                                      "reject",
                                    )
                                  }
                                  disabled={
                                    verificationUpdatingId === item.user_id
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <StatsSection
          stats={[
            {
              label: "Total Users",
              value: dashboard?.total_users || 0,
              sub: "All roles",
            },
            {
              label: "Total Jobs",
              value: dashboard?.total_jobs || 0,
              sub: "All statuses",
            },
            {
              label: "Pending Verifications",
              value: dashboard?.pending_verifications_count || 0,
              sub: "Awaiting review",
            },
          ]}
        />

        <TipsSection
          title="💡 Admin Best Practices"
          tips={[
            {
              icon: "🔍",
              title: "Regular Audits",
              description:
                "Periodically review user reports and verify genie credentials to maintain platform trust",
            },
            {
              icon: "⚡",
              title: "Monitor Platform Health",
              description:
                "Check job completion rates, user ratings, and system performance to identify issues early",
            },
            {
              icon: "🛡️",
              title: "Enforce Safe Practices",
              description:
                "Ensure all transactions meet safety requirements and user data privacy is protected",
            },
            {
              icon: "📊",
              title: "Review Analytics",
              description:
                "Use the overview tab to track platform growth, user distribution, and job trends",
            },
          ]}
        />

        <Footer />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
