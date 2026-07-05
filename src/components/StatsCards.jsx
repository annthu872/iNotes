const cards = [
  ["totalCategories", "Categories", "Total categories", "bi-folder2-open", "blue"],
  ["totalQuestions", "Visible questions", "Total questions", "bi-journal-text", "green"],
  ["totalFavorites", "Favorites", "Saved questions", "bi-star-fill", "amber"],
  ["totalNeedReview", "Need Review", "Questions to review", "bi-clock-history", "orange"],
];

export default function StatsCards({ stats }) {
  return (
    <section className="stats-grid">
      {cards.map(([key, label, subtitle, iconClass, color]) => (
        <article key={key} className="stat-card">
          <div className={`stat-icon ${color}`}>
            <i className={`bi ${iconClass}`} />
          </div>
          <div>
            <p>{label}</p>
            <strong>{stats[key]?.toLocaleString() || 0}</strong>
            <span>{subtitle}</span>
          </div>
        </article>
      ))}
      <article className="stat-card countdown-card">
        <iframe
          title="Interview countdown"
          src="https://logwork.com/countdown-bmy5"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <a
          href="https://logwork.com/countdown-bmy5"
          target="_blank"
          rel="noreferrer"
          className="countdown-fallback"
        >
          Open countdown
        </a>
      </article>
    </section>
  );
}
