"use client";

import { useEditMode } from "@/lib/edit-mode";
import Link from "next/link";

interface EditButtonProps {
  href: string;
  label: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const POSITION_MAP: Record<string, React.CSSProperties> = {
  "top-right": { top: 4, right: 4 },
  "top-left": { top: 4, left: 4 },
  "bottom-right": { bottom: 4, right: 4 },
  "bottom-left": { bottom: 4, left: 4 },
};

export default function EditButton({ href, label, position = "top-right" }: EditButtonProps) {
  const { isEditing, isChecking } = useEditMode();

  if (isChecking || !isEditing) return null;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Edit: ${label}`}
      style={{
        ...POSITION_MAP[position],
        position: "absolute",
        zIndex: 999,
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "rgba(37, 99, 235, 0.85)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        cursor: "pointer",
        textDecoration: "none",
        opacity: 0.3,
        transition: "opacity 0.2s, transform 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = "0.3";
        e.currentTarget.style.transform = "scale(1)";
      }}
      onClick={e => e.stopPropagation()}
    >
      ✏️
    </Link>
  );
}
