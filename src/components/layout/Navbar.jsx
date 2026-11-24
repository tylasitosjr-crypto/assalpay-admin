import GlobalSearchBar from "./GlobalSearchBar.jsx";

export default function Navbar({ title, onOpenMenu }) {
  return (
    <header
      className="admin-navbar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.85rem 1rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <button
        type="button"
        className="btn ghost admin-menu-btn"
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        ☰
      </button>
      <div style={{ fontWeight: 650, fontSize: "1.05rem", flex: "0 0 auto" }}>
        {title}
      </div>
      <GlobalSearchBar />
      <style>{`
        .admin-menu-btn { display: none; }
        @media (max-width: 900px) {
          .admin-menu-btn { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
