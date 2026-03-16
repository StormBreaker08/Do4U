import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import StatsSection from "../components/StatsSection";
import TipsSection from "../components/TipsSection";
import Footer from "../components/Footer";
import Loader from "../components/Loader";

/* ── Avatar with initials (Neo Brutalism) ──────────────────────────────── */
function Avatar({ name, size = 80 }) {
  const initials = (name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-lg)",
        background: "var(--neo-yellow)",
        border: "2.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "var(--text)",
        flexShrink: 0,
        boxShadow: "4px 4px 0 var(--border)",
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
      }}
    >
      {initials}
    </div>
  );
}

/* ── Section wrapper (Neo Brutalism) ─────────────────────────────────── */
function Section({ title, icon, children }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "2.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        boxShadow: "5px 5px 0 var(--border)",
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          paddingBottom: 12,
          borderBottom: "2.5px solid var(--border)",
        }}
      >
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Stat pill (Neo Brutalism) ───────────────────────────────────────── */
function StatPill({ label, value, accent }) {
  return (
    <div
      style={{
        flex: "1 1 120px",
        minWidth: 110,
        background: accent ? "var(--neo-yellow)" : "var(--surface)",
        border: "2.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        textAlign: "center",
        boxShadow: "4px 4px 0 var(--border)",
      }}
    >
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: 6,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default function Profile() {
  const { user, role, logout, fetchMe, token } = useAuth();
  const navigate = useNavigate();

  /* ── State ──────────────────────────────────────────────────────────── */
  const [email, setEmail] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
  const [loadingData, setLoadingData] = useState(true);

  // Password change
  const [pwSection, setPwSection] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("info"); // 'info' | 'error'

  const showToast = (msg, type = "info") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3800);
  };

  /* ── Load data on mount ──────────────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      setLoadingData(true);
      try {
        // Get email from Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setEmail(session?.user?.email || "");
        setName(user?.name || "");

        // Wallet balance
        try {
          const w = await api.get("/api/v1/wallet/");
          setWallet(w);
        } catch {
          /* wallet may not exist yet */
        }

        // Job stats
        try {
          const endpoint =
            role === "genie"
              ? "/api/v1/jobs/available"
              : "/api/v1/jobs/my-jobs";
          const jobs = await api.get(endpoint);
          if (Array.isArray(jobs)) {
            const myJobs =
              role === "genie"
                ? [
                    /* genie stats come from offers */
                  ]
                : jobs;
            setStats({
              total: myJobs.length,
              completed: myJobs.filter((j) => j.status === "COMPLETED").length,
              active: myJobs.filter((j) =>
                ["ACCEPTED", "IN_PROGRESS"].includes(j.status),
              ).length,
            });
          }
        } catch {
          /* ignore */
        }
      } finally {
        setLoadingData(false);
      }
    };
    if (user) init();
  }, [user, role]);

  /* ── Save profile name ───────────────────────────────────────────────── */
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }
    setSaving(true);
    try {
      // 1. Persist to our DB
      await api.patch("/api/v1/users/me", { name: name.trim() });

      // 2. Keep Supabase metadata in sync
      await supabase.auth.updateUser({ data: { name: name.trim() } });

      // 3. Refresh AuthContext so hero header + navbar update immediately
      if (token) await fetchMe(token);

      showToast("Name updated successfully! ✓");
    } catch (err) {
      showToast(err.message || "Failed to update name.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ─────────────────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      showToast("Password changed successfully! ✓");
      setNewPw("");
      setConfirmPw("");
      setPwSection(false);
    } catch (err) {
      showToast(err.message || "Failed to change password.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Logout ──────────────────────────────────────────────────────────── */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
      })
    : null;

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  if (loadingData)
    return (
      <div className="page">
        <Navbar />
        <Loader fullScreen />
      </div>
    );

  return (
    <div className="page">
      <Navbar />
      <main
        className="page__content page__content--narrow"
        style={{ maxWidth: 680 }}
      >
        {/* ── Hero header (Neo Brutalism) ───────────────────────────── */}
        <div
          style={{
            background: "var(--neo-yellow)",
            border: "2.5px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "36px 32px",
            marginBottom: 28,
            color: "var(--text)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "6px 6px 0 var(--border)",
          }}
        >
          {/* Decorative shapes */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              background: "var(--neo-pink)",
              border: "2.5px solid var(--border)",
              borderRadius: "50%",
              pointerEvents: "none",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 80,
              height: 80,
              background: "var(--neo-blue)",
              border: "2.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              pointerEvents: "none",
              opacity: 0.5,
              transform: "rotate(15deg)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              position: "relative",
            }}
          >
            <Avatar name={user?.name} size={80} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                {user?.name || "Your Profile"}
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 500 }}>
                {email}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    border: "2px solid var(--border)",
                  }}
                >
                  {roleLabel}
                </span>
                {memberSince && (
                  <span
                    style={{
                      background: "var(--surface)",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "2px solid var(--border)",
                    }}
                  >
                    Since {memberSince}
                  </span>
                )}
                {role === "genie" && user?.is_verified && (
                  <span
                    style={{
                      background: "var(--neo-green)",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      border: "2px solid var(--border)",
                    }}
                  >
                    ✅ Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <StatPill
            label="Wallet Balance"
            value={`₹${Number(wallet?.balance ?? 0).toFixed(2)}`}
            accent
          />
          {role === "user" && (
            <>
              <StatPill label="Jobs Posted" value={stats.total} />
              <StatPill label="In Progress" value={stats.active} />
              <StatPill label="Completed" value={stats.completed} />
            </>
          )}
          {role === "genie" && (
            <>
              <StatPill
                label="Escrow Held"
                value={`₹${Number(wallet?.escrow_balance ?? 0).toFixed(2)}`}
              />
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── Personal info ───────────────────────────────── */}
          <Section title="Personal Information" icon="👤">
            <form
              onSubmit={handleSaveName}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <label className="form-label">
                Full Name
                <input
                  id="profile-name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  placeholder="Your name"
                />
              </label>
              <label className="form-label">
                Email Address
                <input
                  id="profile-email"
                  className="form-input"
                  value={email}
                  readOnly
                  style={{ opacity: 0.65 }}
                  title="Email is managed by Supabase and cannot be changed here"
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    fontWeight: 600,
                  }}
                >
                  Email is linked to your sign-in account.
                </span>
              </label>
              <label className="form-label">
                Role
                <input
                  className="form-input"
                  value={roleLabel}
                  readOnly
                  style={{ opacity: 0.65 }}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  id="profile-save"
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                  style={{ minWidth: 140 }}
                >
                  {saving ? <Loader /> : "Save Changes"}
                </button>
              </div>
            </form>
          </Section>

          {/* ── Security ────────────────────────────────────── */}
          <Section title="Security" icon="🔒">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: pwSection ? "2.5px solid var(--border)" : "none",
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 3,
                    textTransform: "uppercase",
                    fontSize: 14,
                  }}
                >
                  Password
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  {pwSection
                    ? "Enter your new password below."
                    : "Change your account password."}
                </p>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setPwSection((v) => !v);
                  setNewPw("");
                  setConfirmPw("");
                }}
              >
                {pwSection ? "Cancel" : "Change"}
              </button>
            </div>

            {pwSection && (
              <form
                onSubmit={handleChangePassword}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  paddingTop: 18,
                }}
              >
                <label className="form-label">
                  New Password
                  <input
                    id="profile-new-pw"
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    disabled={pwSaving}
                    placeholder="Min. 6 characters"
                  />
                </label>
                <label className="form-label">
                  Confirm New Password
                  <input
                    id="profile-confirm-pw"
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    disabled={pwSaving}
                    placeholder="Repeat password"
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    id="profile-pw-save"
                    type="submit"
                    className="btn btn--primary"
                    disabled={pwSaving}
                    style={{ minWidth: 160 }}
                  >
                    {pwSaving ? <Loader /> : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </Section>

          {/* ── Account actions ─────────────────────────────── */}
          <Section title="Account" icon="⚙️">
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {/* Quick links */}
              {[
                {
                  label: "💳  Wallet",
                  desc: "View balance & transactions",
                  onClick: () => navigate("/wallet"),
                },
                {
                  label: role === "genie" ? "🧞  My Dashboard" : "📋  My Jobs",
                  desc:
                    role === "genie"
                      ? "Browse available jobs"
                      : "Manage your posted jobs",
                  onClick: () =>
                    navigate(
                      role === "genie" ? "/genie-dashboard" : "/dashboard",
                    ),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "14px 0",
                    background: "none",
                    border: "none",
                    borderBottom: "2.5px solid var(--border)",
                    textAlign: "left",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        marginBottom: 2,
                        textTransform: "uppercase",
                        fontSize: 14,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      color: "var(--text)",
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    →
                  </span>
                </button>
              ))}

              {/* Logout */}
              <div style={{ paddingTop: 16 }}>
                <button
                  id="profile-logout"
                  type="button"
                  className="btn btn--ghost btn--full"
                  onClick={handleLogout}
                  style={{
                    color: "var(--red)",
                    borderColor: "var(--red)",
                    boxShadow: "3px 3px 0 var(--red)",
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </Section>
        </div>

        <StatsSection
          stats={[
            { label: "Member Since", value: memberSince, sub: "Joined Do4U" },
            { label: "Account Status", value: "Active", sub: roleLabel },
            {
              label: "Total Rating",
              value: user?.avg_rating
                ? `⭐ ${user.avg_rating.toFixed(1)}`
                : "—",
              sub: "From jobs completed",
            },
          ]}
        />

        <TipsSection
          title="💡 Tips to Improve Your Profile"
          tips={[
            {
              icon: "📸",
              title: "Use a Clear Avatar",
              description:
                "A professional avatar helps build trust and improves response rates from other users",
            },
            {
              icon: "✍️",
              title: "Complete Your Bio",
              description:
                "Add detailed information about your skills, experience, and work style",
            },
            {
              icon: "⭐",
              title: "Maintain High Ratings",
              description:
                "Consistently delivering quality work builds your reputation on the platform",
            },
            {
              icon: "🔒",
              title: "Keep Account Secure",
              description:
                "Use a strong password and enable any available security features",
            },
          ]}
        />
      </main>

      <Footer />

      {toast && (
        <div
          className="toast"
          style={{
            background: toastType === "error" ? "var(--red)" : "var(--text)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
