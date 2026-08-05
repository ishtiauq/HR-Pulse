const fs = require('fs');
const content = fs.readFileSync('temp_grid.txt', 'utf8');

const markers = [
  '{/* Widget 1 — Employee Directory */}',
  '{/* Widget 2 — Today\'s Attendance (Span 4) */}',
  '{/* Widget 3 — Drive Connection (Span 4) */}',
  '{/* Widget 4 — Daily Checklist */}',
  '{/* Attendance Details Dropdown (Full Width) */}',
  '{/* Widget 4 — Announcements (Span 6) */}',
  '{/* Widget 5 — Payroll Summary (Span 6) */}',
  '{/* Widget 6 — Upcoming Events (Span 4) */}',
  '{/* Widget 7 — Drive Sync Logs (Span 4) */}',
  '{/* Widget 8 — Upcoming Milestones (Span 4) */}',
  '{/* 8. TASKS WIDGET */}',
  '{/* 9. DOCUMENTS WIDGET */}',
  '{/* 10. ASSETS WIDGET */}',
];

const parsedWidgets = {};
let remaining = content.substring(content.indexOf(markers[0]));
const header = content.substring(0, content.indexOf(markers[0]));

for (let i = 0; i < markers.length; i++) {
  const currentMarker = markers[i];
  let nextMarkerIndex = -1;

  for (let j = 0; j < markers.length; j++) {
    if (i === j) continue;
    const idx = remaining.indexOf(markers[j]);
    if (idx > 0 && (nextMarkerIndex === -1 || idx < nextMarkerIndex)) {
      nextMarkerIndex = idx;
    }
  }

  if (nextMarkerIndex !== -1) {
    parsedWidgets[currentMarker] = remaining.substring(0, nextMarkerIndex);
    remaining = remaining.substring(nextMarkerIndex);
  } else {
    parsedWidgets[currentMarker] = remaining;
    remaining = '';
  }
}

// Modify Announcements
parsedWidgets['{/* Widget 4 — Announcements (Span 6) */}'] = parsedWidgets['{/* Widget 4 — Announcements (Span 6) */}']
  .replace('cardClass="xl:col-span-6"', 'cardClass="col-span-full"');

// Modify Drive Sync Logs
parsedWidgets['{/* Widget 7 — Drive Sync Logs (Span 4) */}'] = parsedWidgets['{/* Widget 7 — Drive Sync Logs (Span 4) */}']
  .replace('{...wProps}', 'cardClass="col-span-full"\n            {...wProps}')
  .replace('syncLogs.map', '(syncLogs || []).slice(0, 5).map');

// Assemble in new order
const newOrder = [
  '{/* Widget 4 — Announcements (Span 6) */}', // Row 1
  '{/* Widget 2 — Today\'s Attendance (Span 4) */}', // Row 2, Col 1
  '{/* Widget 4 — Daily Checklist */}', // Row 2, Col 2
  '{/* 8. TASKS WIDGET */}', // Row 2, Col 3
  '{/* Attendance Details Dropdown (Full Width) */}', // Follows row 2
  '{/* Widget 5 — Payroll Summary (Span 6) */}', // Row 3, Col 1
  '{/* 9. DOCUMENTS WIDGET */}', // Row 3, Col 2
  '{/* Widget 6 — Upcoming Events (Span 4) */}', // Row 3, Col 3
  '{/* Widget 1 — Employee Directory */}', // Row 4, Col 1
  '{/* 10. ASSETS WIDGET */}', // Row 4, Col 2
  '{/* Widget 3 — Drive Connection (Span 4) */}', // Row 4, Col 3
  '{/* Widget 8 — Upcoming Milestones (Span 4) */}', // Row 5, Col 1
  '{/* Widget 7 — Drive Sync Logs (Span 4) */}', // Row 6 (Full width)
];

let finalStr = header;
newOrder.forEach(m => finalStr += parsedWidgets[m]);

// Write back to Dashboard.jsx
const code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
const gridStartStr = '{/* Unified Responsive & Adaptive Dashboard Grid */}';
const gridStartIndex = code.indexOf(gridStartStr);
const gridEndStr = '      {/* SPACER for bottom padding */}';
const gridEndIndex = code.indexOf(gridEndStr);

const beforeGrid = code.substring(0, gridStartIndex + gridStartStr.length);
const afterGrid = code.substring(gridEndIndex);

const newCode = beforeGrid + finalStr + afterGrid;
fs.writeFileSync('src/components/Dashboard.jsx', newCode);
console.log('Reordered and modified widgets successfully!');
