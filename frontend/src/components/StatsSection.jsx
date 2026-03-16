export default function StatsSection({ stats }) {
  return (
    <div className="stats-section">
      <h3 className="stats-section__title">📊 Quick Stats</h3>
      <div className="stats-section__grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <p className="stat-item__label">{stat.label}</p>
            <p className="stat-item__value">{stat.value}</p>
            {stat.sub && <p className="stat-item__sub">{stat.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
