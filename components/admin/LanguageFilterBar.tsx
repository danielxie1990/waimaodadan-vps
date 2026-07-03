"use client";

import { useEffect, useState } from "react";
import { LOCALE_NAMES } from "@/lib/locale";

interface LangStat {
  code: string;
  count: number;
}

interface Props {
  current: string;
  onChange: (code: string) => void;
  stats?: LangStat[];
  total: number;
  label?: string;
}

export default function LanguageFilterBar({ current, onChange, stats, total, label = "Items" }: Props) {
  const [enabledLangs, setEnabledLangs] = useState<{ code: string; name: string; flag: string }[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.enabled_languages) {
          try {
            const codes: string[] = JSON.parse(data.enabled_languages);
            if (codes.length > 0) {
              setEnabledLangs(
                codes.map(c => ({
                  code: c,
                  name: LOCALE_NAMES[c]?.name || c,
                  flag: LOCALE_NAMES[c]?.flag || "🌐",
                }))
              );
              return;
            }
          } catch {}
        }
        // Default: only show English if no multi-language setup
        setEnabledLangs([{ code: "en", name: "English", flag: "🇬🇧" }]);
      })
      .catch(() => setEnabledLangs([{ code: "en", name: "English", flag: "🇬🇧" }]));
  }, []);

  // Only show languages that have data, or the current language
  const hasData = (code: string) => stats?.some(s => s.code === code && s.count > 0);
  const langsToShow = enabledLangs.filter(l => l.code === current || hasData(l.code));

  // If only one language, no need to show the bar
  if (langsToShow.length <= 1) {
    // Still show the total count
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 16, padding: "12px 16px", background: "#fff",
        borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>
          {label}: <strong style={{ color: "#374151" }}>{total}</strong>
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      marginBottom: 16, padding: "12px 16px", background: "#fff",
      borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginRight: 4 }}>
        🌐 Language:
      </span>

      {langsToShow.map(lang => {
        const stat = stats?.find(s => s.code === lang.code);
        const isActive = lang.code === current;
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 6,
              border: isActive ? "2px solid #3b82f6" : "1px solid #e5e7eb",
              background: isActive ? "#eff6ff" : "#fff",
              color: isActive ? "#2563eb" : "#374151",
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {stat !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: isActive ? "#2563eb" : "#e5e7eb",
                color: isActive ? "#fff" : "#6b7280",
                borderRadius: 8, padding: "0 6px", lineHeight: "16px",
                marginLeft: 2,
              }}>
                {stat.count}
              </span>
            )}
          </button>
        );
      })}

      <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>
        {label}: <strong style={{ color: "#374151" }}>{total}</strong>
      </span>
    </div>
  );
}
