export default function TipsSection({ title, tips }) {
  return (
    <div className="tips-section">
      <h3 className="tips-section__title">{title}</h3>
      <div className="tips-section__list">
        {tips.map((tip, index) => (
          <div key={index} className="tip-item">
            <span className="tip-item__icon">{tip.icon}</span>
            <div>
              <p className="tip-item__title">{tip.title}</p>
              <p className="tip-item__desc">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
