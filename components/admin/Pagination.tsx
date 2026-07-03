"use client";

import { useState } from "react";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 50, 100];

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  const btnStyle: React.CSSProperties = {
    padding: "6px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    lineHeight: 1.4,
  };

  const activeBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
    fontWeight: 600,
  };

  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
      flexWrap: "wrap",
      gap: 12,
    }}>
      {/* Left: page size selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
        <span>Show</span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            style={{
              ...btnStyle,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {pageSize}
            <span style={{ fontSize: 10 }}>▼</span>
          </button>
          {showSizeMenu && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: 4,
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {PAGE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    onPageSizeChange(size);
                    setShowSizeMenu(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 16px",
                    border: "none",
                    background: size === pageSize ? "#eff6ff" : "#fff",
                    color: size === pageSize ? "#2563eb" : "#374151",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = size === pageSize ? "#eff6ff" : "#fff"; }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <span>per page</span>
      </div>

      {/* Right: pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            style={{ ...btnStyle, padding: "6px 8px", opacity: page <= 1 ? 0.4 : 1 }}
            title="First page"
          >
            ◀◀
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{ ...btnStyle, opacity: page <= 1 ? 0.4 : 1 }}
          >
            ◀
          </button>

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} style={{ padding: "6px 4px", fontSize: 13, color: "#9ca3af" }}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={p === page ? activeBtnStyle : btnStyle}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            style={{ ...btnStyle, opacity: page >= totalPages ? 0.4 : 1 }}
          >
            ▶
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            style={{ ...btnStyle, padding: "6px 8px", opacity: page >= totalPages ? 0.4 : 1 }}
            title="Last page"
          >
            ▶▶
          </button>

          <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 8, whiteSpace: "nowrap" }}>
            {from}-{to} / {total}
          </span>
        </div>
      )}

      {/* Show summary even with 1 page */}
      {totalPages <= 1 && (
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {total} {total === 1 ? "item" : "items"}
        </span>
      )}
    </div>
  );
}
