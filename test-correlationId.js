const fs = require('fs');
const file = 'apps/logidesk-api/src/modules/tickets/tickets.service.ts';
const code = fs.readFileSync(file, 'utf8');

const match = code.match(/updateTicketStatusFromHrCase/);
if (match) {
  const index = match.index;
  const start = index;
  let end = start;
  let braceCount = 0;
  let started = false;
  
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      started = true;
    } else if (code[i] === '}') {
      braceCount--;
    }
    
    if (started && braceCount === 0) {
      end = i + 1;
      break;
    }
  }
  
  console.log(code.substring(start, end));
} else {
  console.log("Method not found");
}
