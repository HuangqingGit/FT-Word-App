const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '../src-tauri/bin');

// 检查文件名是否符合三元组标准 (*-架构-厂商-平台.*)
function isTripleNamed(filename) {
    // 匹配模式：name-arch-vendor-platform.ext
    // 例如：email-x86_64-pc-windows-msvc.exe
    const triplePattern = /^(.+)-([^-]+)-([^-]+)-([^-]+)\.[^.]+$/;
    return triplePattern.test(filename);
}

// 获取不带三元组部分的基础文件名
function getBaseFilename(filename) {
    const ext = path.extname(filename);
    return filename.replace(/-[^-]+-[^-]+-[^-]+$/, '').replace(ext, '') + ext;
}

// 遍历目录并处理文件
fs.readdirSync(basePath).forEach(file => {
    const srcPath = path.join(basePath, file);

    // 只处理文件，忽略目录
    if (fs.statSync(srcPath).isFile()) {
        if (!isTripleNamed(file)) {
            const baseName = getBaseFilename(file);
            const ext = path.extname(file);
            const nameWithoutExt = baseName.replace(ext, '');

            // 构建目标文件名 (假设标准是 x86_64-pc-windows-msvc)
            const targetName = `${nameWithoutExt}-x86_64-pc-windows-msvc${ext}`;
            const targetPath = path.join(basePath, targetName);

            if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(srcPath, targetPath);
                console.log(`✅ Copied ${file} to ${targetName}`);
            }
        } else {
            console.log(`⏩ Skipped (already triple-named): ${file}`);
        }
    }
});

console.log('✅ All files processed');