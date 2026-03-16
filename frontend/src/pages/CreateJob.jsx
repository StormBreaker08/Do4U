import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TipsSection from "../components/TipsSection";
import ButtonSpinner from "../components/ButtonSpinner";

export default function CreateJob() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    duration: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [priceHint, setPriceHint] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (form.price && isNaN(Number(form.price)))
      e.price = "Price must be a number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEstimate = async () => {
    if (!form.title || !form.description) {
      showToast("Fill in title and description first to get an estimate.");
      return;
    }
    setEstimating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location || null,
        duration: form.duration || null,
        price: form.price ? parseFloat(form.price) : null,
      };
      const data = await api.post("/api/v1/jobs/price-estimate", payload);
      setPriceHint(data);
    } catch (err) {
      showToast(`Could not get estimate: ${err.message}`);
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        duration: form.duration.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
      };
      await api.post("/api/v1/jobs", payload);
      showToast("Job posted successfully! 🎉");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page__content page__content--narrow">
        <div className="page__header">
          <div>
            <h1 className="page__title">Post a New Job</h1>
            <p className="page__subtitle">
              Describe what you need done and a Genie will help
            </p>
          </div>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-title">
                Job Title *
              </label>
              <input
                id="job-title"
                className={`form-input${errors.title ? " form-input--error" : ""}`}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Fix my kitchen sink"
                disabled={loading}
                maxLength={200}
              />
              {errors.title && (
                <span className="form-error">{errors.title}</span>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-description">
                Description *
              </label>
              <textarea
                id="job-description"
                className={`form-input form-textarea${errors.description ? " form-input--error" : ""}`}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the job in detail…"
                rows={4}
                disabled={loading}
                maxLength={2000}
              />
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>

            {/* Location + Duration row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="job-location">
                  Location
                </label>
                <input
                  id="job-location"
                  className="form-input"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Andheri West, Mumbai"
                  disabled={loading}
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="job-duration">
                  Duration
                </label>
                <input
                  id="job-duration"
                  className="form-input"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="e.g. 2 hours"
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label" htmlFor="job-price">
                Budget (₹)
              </label>
              <div className="form-price-row">
                <input
                  id="job-price"
                  className={`form-input${errors.price ? " form-input--error" : ""}`}
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Leave blank to negotiate"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={handleEstimate}
                  disabled={estimating || loading}
                >
                  {estimating ? (
                    <>
                      <ButtonSpinner />
                      Estimating...
                    </>
                  ) : (
                    "✨ AI Estimate"
                  )}
                </button>
              </div>
              {errors.price && (
                <span className="form-error">{errors.price}</span>
              )}

              {/* Price estimate hint */}
              {priceHint && (
                <div className="price-hint">
                  <strong>AI Estimate:</strong> ₹{priceHint.min_price ?? "?"} –
                  ₹{priceHint.max_price ?? "?"}
                  {priceHint.reasoning && (
                    <span className="price-hint__reason">
                      {" "}
                      — {priceHint.reasoning}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="post-job-submit"
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Posting...
                  </>
                ) : (
                  "Post Job"
                )}
              </button>
            </div>
          </form>
        </div>

        <TipsSection
          title="💡 Tips for Getting Great Responses"
          tips={[
            {
              icon: "📝",
              title: "Be Clear & Specific",
              description:
                "Include details about what needs to be done, not just general descriptions",
            },
            {
              icon: "💰",
              title: "Set Fair Budget",
              description:
                "Research similar jobs to set competitive pricing and attract quality Genies",
            },
            {
              icon: "📍",
              title: "Mention Location",
              description:
                "Specify location for on-site work, or mark as remote/online for flexibility",
            },
            {
              icon: "🎯",
              title: "Define Timeline",
              description:
                "Mention when you need it done to help Genies assess if they can commit",
            },
          ]}
        />

        <Footer />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
