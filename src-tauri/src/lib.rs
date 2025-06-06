// 在 src-tauri/src/main.rs 或对应模块顶部添加：
use serde::Deserialize;
use std::process::Command;

#[derive(Deserialize)]
struct RunScriptParams {
    data: serde_json::Value, // 动态 JSON 对象
    templatePath: String,
}
#[tauri::command]
fn run_python(params: RunScriptParams) -> Result<String, String> {
    // 将对象序列化为 JSON 字符串传给 Python
    let json_string = serde_json::to_string(&params.data).unwrap();

    let output = Command::new("python3")
        .arg("src-tauri/py/merge_email.py")
        .arg(json_string)
        .arg(&params.templatePath)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Tauri应用程序的主要入口点，不可删除！！！
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
