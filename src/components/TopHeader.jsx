const navItems = [
  ["notes", "Notes"],
  ["topics", "Topics"],
  ["mindMap", "Mind Map"],
];

export default function TopHeader({
  searchQuery,
  onSearchChange,
  onNewQuestion,
  activeView = "notes",
  onViewChange,
}) {
  return (
    <header className="top-header">
      <div className="brand-block">
        <div className="brand-mark">
          <i className="bi bi-journal-bookmark-fill" />
        </div>
        <div>
          <h1>INote</h1>
          <p>Interview Handbook</p>
        </div>
      </div>

      <label className="global-search">
        <span className="search-leading">
          <i className="bi bi-search" />
        </span>
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search questions, topics, or keywords..."
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            title="Clear search"
            onClick={() => onSearchChange("")}
          >
            <i className="bi bi-x-lg" />
          </button>
        )}
        <kbd>⌘K</kbd>
      </label>

      <div className="header-actions">
        {onViewChange && (
          <nav className="header-tabs" aria-label="Main sections">
            {navItems.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={activeView === value ? "active" : ""}
                onClick={() => onViewChange(value)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        <button type="button" className="icon-button" title="Theme">
          <i className="bi bi-sun" />
        </button>
        <button type="button" className="icon-button" title="Language">
          <i className="bi bi-globe2" />
        </button>
        <button type="button" className="language-button">
          EN
          <i className="bi bi-chevron-down" />
        </button>
        <button type="button" className="primary-button" onClick={onNewQuestion}>
          <i className="bi bi-plus-lg" />
          New note
        </button>
      </div>
    </header>
  );
}
