"use client";

/**
 * 模板选择器组件
 * 放在 Page 编辑表单中，让用户选择当前页面的模板
 */

import { getTemplateOptions } from "@/components/templates/registry";

interface TemplateSelectorProps {
  value?: string;
  onChange: (slug: string) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const options = getTemplateOptions();

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 8,
          color: "#374151",
        }}
      >
        页面模板
      </label>
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 12,
          marginTop: 0,
        }}
      >
        选择模板决定页面的整体布局结构（是否有侧边栏、内容宽度等）
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                position: "relative",
                border: selected ? "2px solid #2563eb" : "2px solid #e5e7eb",
                borderRadius: 8,
                padding: "16px",
                textAlign: "left",
                cursor: "pointer",
                background: selected ? "#eff6ff" : "#fff",
                transition: "all 0.15s ease",
                boxShadow: selected ? "0 0 0 2px rgba(37,99,235,0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {/* 选中标记 */}
              {selected && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              )}

              {/* 模板图标 + 名称 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {option.hasSidebar ? "📑" : "📄"}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {option.label}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {option.hasSidebar ? "含侧边栏" : "无侧边栏"}
                  </p>
                </div>
              </div>

              {/* 模板说明 */}
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#6b7280",
                }}
              >
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
