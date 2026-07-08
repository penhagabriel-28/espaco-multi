import { execSync } from 'child_process';

try {
  const log = execSync('git log --oneline src/routes/_app.frequencia.tsx', { encoding: 'utf8' });
  const commits = log.split('\n').filter(line => line.trim()).map(line => line.split(' ')[0]);

  console.log(`Found ${commits.length} commits affecting _app.frequencia.tsx.`);

  for (const commit of commits) {
    console.log(`\n=================== COMMIT: ${commit} ===================`);
    const subject = execSync(`git log -1 --format=%s ${commit}`, { encoding: 'utf8' }).trim();
    console.log(`Subject: ${subject}`);
    
    const diff = execSync(`git show ${commit} -- src/routes/_app.frequencia.tsx`, { encoding: 'utf8' });
    const lines = diff.split('\n');
    // Print lines containing ".from(" or "filter" or "status" or "queryFn"
    lines.forEach(line => {
      if (line.includes('.from(') || line.includes('status') || line.includes('queryFn') || line.includes('filter(')) {
        console.log(line);
      }
    });
  }
} catch (err) {
  console.error(err);
}
