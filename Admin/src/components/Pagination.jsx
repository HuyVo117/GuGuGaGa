export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="item-row" style={{ justifyContent: "flex-end" }}>
      <button className="btn" disabled={!canPrev} onClick={() => onChange?.(page - 1)}>
        Prev
      </button>
      <span className="muted">
        Page {page} / {totalPages}
      </span>
      <button className="btn" disabled={!canNext} onClick={() => onChange?.(page + 1)}>
        Next
      </button>
    </div>
  );
}
