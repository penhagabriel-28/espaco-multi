import { execSync } from 'child_process';
import fs from 'fs';

function check() {
  try {
    const commits = execSync('git log --format=%H -- backup_data.json', { encoding: 'utf-8' })
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean);
    
    console.log(`Found ${commits.length} commits modifying backup_data.json`);

    commits.forEach(commit => {
      try {
        const content = execSync(`git show ${commit}:backup_data.json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
        const data = JSON.parse(content);
        if (data.agendamentos) {
          const signed = data.agendamentos.filter(a => a.assinatura_responsavel);
          console.log(`Commit ${commit}: total ${data.agendamentos.length} appointments, signed: ${signed.length}`);
        } else {
          console.log(`Commit ${commit}: no agendamentos table`);
        }
      } catch (e) {
        console.error(`Failed to read commit ${commit}:`, e.message);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

check();
