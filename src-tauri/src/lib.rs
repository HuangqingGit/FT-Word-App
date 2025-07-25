// 在 src-tauri/src/main.rs 或对应模块顶部添加：
use serde::Deserialize;
use std::process::Command;

#[derive(Debug, Deserialize)]
struct RunScriptParams {
    data: serde_json::Value, // 动态 JSON 对象
    template_path: String,
}
#[tauri::command]
fn run_python(params: RunScriptParams) -> Result<String, String> {
    // 将对象序列化为 JSON 字符串传给 Python
    let json_string = serde_json::to_string(&params.data).unwrap();
    // 调用 Python 脚本并传递 JSON 字符串和模板路径
    let output = Command::new("python")
        .arg("resources/py/merge_email.py")
        .arg(json_string)
        .arg(&params.template_path)
        .output()
        .map_err(|e| e.to_string())?;

    // 检查命令是否成功执行 处理输出结果
    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout).into_owned();
        if output_str.trim().is_empty() {
            Err("Python脚本未返回有效数据".to_string())
        } else {
            Ok(output_str)
        }
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Python脚本执行错误: {}", error_msg))
    }
}

// Tauri应用程序的主要入口点，不可删除！！！
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
