const fs = require('fs');
let content = fs.readFileSync('docs/IMPLEMENTATION_STATUS.md', 'utf8');

content = content.replace('| Ponto | FAIL |', '| Ponto | PASS |');
content = content.replace('| Férias | FAIL |', '| Férias | PASS |');
content = content.replace('| Folha | FAIL (Demonstrativos básicos pendentes de workflow) |', '| Folha | PASS (Fechamento simplificado e Event-driven implementados) |');

fs.writeFileSync('docs/IMPLEMENTATION_STATUS.md', content);
