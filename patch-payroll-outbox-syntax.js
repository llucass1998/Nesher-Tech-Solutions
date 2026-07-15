const fs = require('fs');
const file = 'apps/logipayroll-worker/src/outbox-dispatcher.ts';
let code = fs.readFileSync(file, 'utf8');

// Fix syntax error in outbox-dispatcher.ts:
code = code.replace(/    return logipayrollContractCreatedDataSchema\.parse\(event\.payload\);\n  \}\n/, '');

fs.writeFileSync(file, code);
