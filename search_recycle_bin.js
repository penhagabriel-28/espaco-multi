import { exec } from "child_process";

const cmd = 'powershell -NoProfile -Command "Get-ChildItem -Path C:\\$Recycle.Bin -Recurse -ErrorAction SilentlyContinue | Select-Object Name, FullName, Length, LastWriteTime | Format-Table -AutoSize"';

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
