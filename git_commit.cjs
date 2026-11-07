const { execSync } = require('child_process');

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "feat: JCL Office native UI overhaul, brand logo, responsive navbar and role tabs"', { stdio: 'inherit' });
  console.log('Committed successfully');
} catch (e) {
  console.error('Commit failed:', e.message);
  process.exit(1);
}
