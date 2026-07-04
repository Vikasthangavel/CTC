const fs = require('fs');

const content = fs.readFileSync('src/services/firestore.js', 'utf8');

const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;

let newContent = content.replace(regex, (match, fnName, args) => {
  return `export const ${fnName} = withTryCatch('${fnName}', async (${args}) => {`;
});

// Close the braces for wrapped functions
// This is tricky because we just have `}` at the end of functions.
// We need to replace the last `}` of the function with `});`
// Actually, it's safer to just do a simple string replacement since we have the code.
