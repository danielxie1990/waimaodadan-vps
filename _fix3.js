const fs = require("fs");

// Read each file and apply targeted fixes for remaining U+FFFD
const files = [
  {
    path: "app/admin/settings/sidebar/page.tsx",
    fix: (s) =>
      s
        // Fix the "在" at line 62
        .replace(/\ufffd\/minimal/g, "\u5728minimal")
        // Fix button labels: the content between button and >
        .replace(
          /style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === 0 \? "not-allowed" : "pointer", fontSize: 12, opacity: i === 0 \? 0.4 : 1 }}>\ufffd/g,
          'style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === 0 ? "not-allowed" : "pointer", fontSize: 12, opacity: i === 0 ? 0.4 : 1 }}>\u2191'
        )
        .replace(
          /style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === items\.length - 1 \? "not-allowed" : "pointer", fontSize: 12, opacity: i === items\.length - 1 \? 0.4 : 1 }}>\ufffd/g,
          'style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: i === items.length - 1 ? "not-allowed" : "pointer", fontSize: 12, opacity: i === items.length - 1 ? 0.4 : 1 }}>\u2193'
        )
        .replace(
          /style={{ padding: "4px 8px", border: "1px solid #ef4444", borderRadius: 4, background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>\ufffd/g,
          'style={{ padding: "4px 8px", border: "1px solid #ef4444", borderRadius: 4, background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>\u2715'
        ),
  },
  {
    path: "components/blocks/definitions.tsx",
    fix: (s) =>
      s
        // Fix block separators 
        .replace(
          /\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\ufffd/g,
          "══════════════════════════════════════════════"
        )
        // Fix email placeholder
        .replace(/邮\ufffd/g, "\u90ae\u4ef6")
        // Fix any remaining U+FFFD
        .replace(/\ufffd/g, ""),
  },
  {
    path: "components/templates/PublicSidebar.tsx",
    fix: (s) =>
      s
        // Fix icon emojis - these are the only U+FFFD left
        .replace(/icon: "\ufffd \}/g, 'icon: "\u2502" }')
        .replace(/icon: "\ufffd,/g, 'icon: "\u2502",')
        // Fix remaining
        .replace(/\ufffd/g, ""),
  },
];

for (const { path, fix } of files) {
  const content = fs.readFileSync(path, "utf8");
  const fixed = fix(content);
  fs.writeFileSync(path, fixed, "utf8");
  const remain = (fixed.match(/\uFFFD/g) || []).length;
  console.log(`${path}: ${remain} remaining U+FFFD`);
}
console.log("Done");
