const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '../src-tauri/bin');
const src = path.join(basePath, 'email.exe');
const target = path.join(basePath, 'email-x86_64-pc-windows-msvc.exe');

if (!fs.existsSync(target)) {
    fs.copyFileSync(src, target);
    console.log('✅ Sidecar exe copied for Tauri:', path.basename(target));
}
