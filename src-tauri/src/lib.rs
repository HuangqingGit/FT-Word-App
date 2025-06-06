// 在 src-tauri/src/main.rs 或对应模块顶部添加：
use serde_json::Value;
use std::process::Command;

#[tauri::command]
fn greet(data: &str) -> String {
    // let path = std::path::Path::new("src-tauri/py/index.py");
    format!("{}", data)
}

#[tauri::command]
fn run_python(args: String) -> Result<(), String> {
    let args: Value = serde_json::from_str(&args).map_err(|e| format!("JSON 解析失败: {}", e))?;
    let template = args
        .get("template")
        .and_then(|v| v.as_str())
        .ok_or("缺少 template 参数")?;
    let data = args
        .get("data")
        .and_then(|v| v.as_str())
        .ok_or("缺少 data 参数")?;
    let output = args
        .get("output")
        .and_then(|v| v.as_str())
        .ok_or("缺少 output 参数")?;

    let py_path = if cfg!(windows) {
        "python.exe"
    } else {
        "python3"
    };
    let output = Command::new(py_path)
        .arg("mail_merge.py")
        .arg(template)
        .arg(data)
        .arg(output)
        .output()
        .map_err(|e| format!("执行 Python 失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python 执行错误: {}", stderr));
    }

    Ok(())
}

// Tauri应用程序的主要入口点，不可删除！！！
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, run_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
