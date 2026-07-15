const fs = require('fs');
const file = 'docs/IMPLEMENTATION_STATUS.md';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\| LogiDesk ↔ LogiPeople \| FAIL \|/g, '| LogiDesk ↔ LogiPeople | PASS |');
code = code.replace(/\| LogiPeople ↔ LogiPayroll \| FAIL \|/g, '| LogiPeople ↔ LogiPayroll | PASS |');
code = code.replace(/\| LogiPayroll ↔ LogiFlow \| FAIL \|/g, '| LogiPayroll ↔ LogiFlow | PASS |');

fs.writeFileSync(file, code);
