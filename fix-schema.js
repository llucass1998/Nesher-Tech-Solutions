const fs = require('fs');

let content = fs.readFileSync('databases/logipeople/prisma/schema.prisma', 'utf8');

// Replace duplicate lines
const lines = content.split(/\r?\n/);
const seen = new Set();
let inEmployee = false;
const newLines = [];

for (const line of lines) {
  if (line.startsWith('model Employee {')) {
    inEmployee = true;
  }
  if (inEmployee && line.startsWith('}')) {
    inEmployee = false;
  }

  if (inEmployee) {
    const trimmed = line.trim();
    if (trimmed.startsWith('performanceReviews') || 
        trimmed.startsWith('trainingSessions') || 
        trimmed.startsWith('trainingEnrollments') ||
        trimmed.startsWith('performanceReviewsAsReviewer')) {
      if (seen.has(trimmed)) {
        continue; // skip duplicate
      }
      seen.add(trimmed);
    }
  }
  newLines.push(line);
}

fs.writeFileSync('databases/logipeople/prisma/schema.prisma', newLines.join('\n'), 'utf8');
