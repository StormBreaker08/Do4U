import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import StatsSection from "../components/StatsSection";
import TipsSection from "../components/TipsSection";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import ButtonSpinner from "../components/ButtonSpinner";

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {sub && <p className="stat-card__sub">{sub}</p>}
    </div>
  );
}

export default function Wallet() {
  const { user, role } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [txAction, setTxAction] = useState("add"); // 'add' | 'withdraw'
  const [txLoading, setTxLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadWallet = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/v1/wallet/");
      setWallet(data);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast("Enter a valid amount.");
      return;
    }
    setTxLoading(true);
    try {
      const endpoint =
        txAction === "add"
          ? "/api/v1/wallet/add-funds"
          : "/api/v1/wallet/withdraw";
      const result = await api.post(endpoint, {
        amount: parseFloat(amount),
        description: desc || undefined,
      });
      showToast(result.message || "Transaction successful!");
      setAmount("");
      setDesc("");
      loadWallet();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="page__content page__content--narrow">
        <div className="page__header">
          <div>
            <h1 className="page__title">Wallet</h1>
            <p className="page__subtitle">Manage your Do4U balance</p>
          </div>
        </div>

        {loading ? (
          <Loader fullScreen />
        ) : (
          <>
            {/* Balance cards */}
            <div className="stats-grid">
              <StatCard
                label="Available Balance"
                value={`₹${Number(wallet?.balance ?? 0).toFixed(2)}`}
                sub="Ready to spend"
              />
              <StatCard
                label="Escrow Balance"
                value={`₹${Number(wallet?.escrow_balance ?? 0).toFixed(2)}`}
                sub="Locked in active jobs"
              />
              <StatCard
                label="Total"
                value={`₹${(Number(wallet?.balance ?? 0) + Number(wallet?.escrow_balance ?? 0)).toFixed(2)}`}
                sub="Combined"
              />
              {user?.reward_points !== undefined && (
                <StatCard
                  label="Reward Points"
                  value={`✨ ${user.reward_points}`}
                  sub="Used for discounts"
                />
              )}
            </div>

            {/* Transaction form */}
            <div className="form-card">
              <h2 className="form-card__title">Make a Transaction</h2>

              {/* Toggle */}
              <div className="toggle-group">
                <button
                  className={`toggle-btn${txAction === "add" ? " toggle-btn--active" : ""}`}
                  onClick={() => setTxAction("add")}
                  type="button"
                >
                  ➕ Add Funds
                </button>
                <button
                  className={`toggle-btn${txAction === "withdraw" ? " toggle-btn--active" : ""}`}
                  onClick={() => setTxAction("withdraw")}
                  type="button"
                >
                  💸 Withdraw
                </button>
              </div>

              <form onSubmit={handleTransaction} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="wallet-amount">
                    Amount (₹) *
                  </label>
                  <input
                    id="wallet-amount"
                    className="form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={txLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="wallet-desc">
                    Description (optional)
                  </label>
                  <input
                    id="wallet-desc"
                    className="form-input"
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="e.g. Top up"
                    disabled={txLoading}
                  />
                </div>

                <div className="form-actions">
                  <button
                    id="wallet-submit"
                    type="submit"
                    className="btn btn--primary btn--full"
                    disabled={txLoading}
                  >
                    {txLoading ? (
                      <>
                        <ButtonSpinner />
                        Processing...
                      </>
                    ) : txAction === "add" ? (
                      "Add Funds"
                    ) : (
                      "Withdraw"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        <TipsSection
          title="💡 Tips for Managing Your Wallet"
          tips={[
            {
              icon: "🏦",
              title: "Keep Funds Available",
              description:
                "Maintain a balance for quick job opportunities without waiting for deposits",
            },
            {
              icon: "⏱️",
              title: "Check Escrow Balance",
              description:
                "Funds in escrow are locked until jobs complete — plan your spending accordingly",
            },
            {
              icon: "💰",
              title: "Withdrawal Timing",
              description:
                "Process withdrawals early in the week for faster processing and availability",
            },
            {
              icon: "🎁",
              title: "Use Reward Points",
              description:
                "Accumulate and redeem reward points for discounts on future transactions",
            },
          ]}
        />

        <Footer />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
