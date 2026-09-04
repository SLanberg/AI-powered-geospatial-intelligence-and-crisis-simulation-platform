const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const platform = os.platform();
const isWin = platform === 'win32';
const isMac = platform === 'darwin';

// Self-relaunch in a new terminal window if running headless or double-clicked without standard terminal spawn environment
if (process.env.LAUNCHED_IN_NEW_WINDOW !== 'true') {
  const scriptPath = __filename;
  if (isMac) {
    // Launch a fresh Terminal window on macOS
    const command = `osascript -e 'tell application "Terminal" to do script "LAUNCHED_IN_NEW_WINDOW=true node \\"${scriptPath}\\""'`;
    exec(command, () => process.exit(0));
    return;
  } else if (isWin) {
    // Launch a fresh Command Prompt window on Windows
    const command = `cmd /c start cmd /k "set LAUNCHED_IN_NEW_WINDOW=true && node \\"${scriptPath}\\""`;
    exec(command, () => process.exit(0));
    return;
  }
}

// Clear terminal screen
console.clear();

// ANSI Escape Codes for Colors
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ASCII Art
console.log(GREEN + `
                                                                               
 ▄▄▄▄▄▄▄                  ▄▄▄▄▄▄▄                   ▄▄                         
███▀▀▀▀▀ ▀▀  ██           ███▀▀███▄             ▀▀  ██                         
███      ██ ▀██▀▀ ██ ██   ███▄▄███▀ ▄█▀█▄ ▄█▀▀▀ ██  ██ ▄█▀█▄ ████▄ ▄████ ▄█▀█▄ 
███      ██  ██   ██▄██   ███▀▀██▄  ██▄█▀ ▀███▄ ██  ██ ██▄█▀ ██ ██ ██    ██▄█▀ 
▀███████ ██▄ ██    ▀██▀   ███  ▀███ ▀█▄▄▄ ▄▄▄█▀ ██▄ ██ ▀█▄▄▄ ██ ██ ▀████ ▀█▄▄▄ 
                    ██                                                         
                  ▀▀▀                                                                                                                          
` + RESET);

// Terminal Progress Bar helper
function renderProgressBar(percent, statusMessage) {
  const barWidth = 30;
  const completed = Math.round((barWidth * percent) / 100);
  const remaining = barWidth - completed;
  const progressBar = '█'.repeat(completed) + '░'.repeat(remaining);

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`Progress: [${GREEN}${progressBar}${RESET}] ${BOLD}${percent}%${RESET} | ${statusMessage}`);
}

const appDir = path.join(__dirname, 'app');

console.log('Initializing application components...\n');
renderProgressBar(10, 'Starting Next.js Dev Server...');

// Spawn Next.js server
const devServer = spawn('npm', ['run', 'dev'], {
  cwd: appDir,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

let isReady = false;
let currentProgress = 20;

// Update progress bar as server logs show up
devServer.stdout.on('data', (data) => {
  const output = data.toString();
  if (!isReady) {
    if (output.includes('compiling') || output.includes('Starting')) {
      currentProgress = Math.min(currentProgress + 15, 75);
      renderProgressBar(currentProgress, 'Compiling application...');
    }
  } else {
    // Once ready, pipe server output cleanly below progress bar
    process.stdout.write(data);
  }
});

devServer.stderr.on('data', (data) => {
  if (isReady) {
    process.stderr.write(data);
  }
});

// Function to open Google Chrome
function openChrome(url) {
  if (isMac) {
    exec(`open -a "Google Chrome" "${url}" || open "${url}"`);
  } else if (isWin) {
    exec(`start chrome "${url}" || start "${url}"`);
  } else {
    exec(`google-chrome "${url}" || xdg-open "${url}"`);
  }
}

// Poll localhost:3000 until responsive
function checkServer() {
  http.get('http://localhost:3000', (res) => {
    isReady = true;
    renderProgressBar(100, 'Server Ready! Opening Chrome...\n');
    console.log('\n\n✔ Next.js server is live at http://localhost:3000');
    console.log('✔ Google Chrome launched successfully.\n');
    openChrome('http://localhost:3000');
  }).on('error', () => {
    if (!isReady) {
      currentProgress = Math.min(currentProgress + 5, 90);
      renderProgressBar(currentProgress, 'Waiting for port 3000...');
      setTimeout(checkServer, 800);
    }
  });
}

setTimeout(checkServer, 1000);
