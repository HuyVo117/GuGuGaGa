export default function AdminLayout({ title, subtitle, onSignOut, children }) {
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>{title || "GuGuGaGa Control Deck"}</h1>
          <p>{subtitle || "Quan ly menu, don giao va van hanh."}</p>
        </div>
        <button className="btn btn-outline" onClick={onSignOut}>
          Dang xuat
        </button>
      </header>
      {children}
    </div>
  );
}
