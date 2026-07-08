import { execSync } from "child_process";

async function check() {
  try {
    console.log("Listing all files in git history that look like backups...");
    const cmd = "git log --all --pretty=format: --name-only";
    const rawFiles = execSync(cmd, { encoding: "utf-8" })
      .split("\n")
      .map(f => f.trim())
      .filter(Boolean);
    
    const files = Array.from(new Set(rawFiles));
    
    const backupFiles = files.filter(f => 
      f.includes("backup") || 
      f.includes("seed") || 
      f.endsWith(".json") || 
      f.endsWith(".sql") || 
      f.endsWith(".csv")
    );

    console.log("Matching files found in git history:", backupFiles);

    // For any json file, let's see which commits modified it
    backupFiles.forEach(f => {
      try {
        const commits = execSync(`git log --format="%h - %an, %ar : %s" -- "${f}"`, { encoding: "utf-8" });
        console.log(`\nHistory for ${f}:`);
        console.log(commits);
      } catch (err) {
        console.error(`Failed to get log for ${f}:`, err.message);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

check();
