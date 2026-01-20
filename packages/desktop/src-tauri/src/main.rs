// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, AppHandle, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;
use serde::{Deserialize, Serialize};
use std::env;

const STORE_NAME: &str = "settings.json";
const DEFAULT_SERVER_KEY: &str = "defaultServerUrl";

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub update_available: bool,
    pub version: Option<String>,
}

/// Get the current OS name
#[tauri::command]
fn get_os() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "unknown".to_string();
}

/// Get the app version
#[tauri::command]
fn get_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

/// Open a URL in the default browser
#[tauri::command]
async fn open_link(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

/// Restart the application
#[tauri::command]
async fn restart(app: AppHandle) -> Result<(), String> {
    app.restart();
    Ok(())
}

/// Send a system notification
#[tauri::command]
async fn notify(
    app: AppHandle,
    title: String,
    body: Option<String>,
    _href: Option<String>,
) -> Result<(), String> {
    let mut notification = app.notification().builder();
    notification = notification.title(&title);

    if let Some(b) = body {
        notification = notification.body(&b);
    }

    notification.show().map_err(|e| e.to_string())
}

/// Open directory picker dialog
#[tauri::command]
async fn open_directory_picker(
    app: AppHandle,
    title: Option<String>,
    multiple: Option<bool>,
) -> Result<Option<Vec<String>>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    }

    if multiple.unwrap_or(false) {
        let result = dialog.pick_folders();
        match result {
            Some(paths) => Ok(Some(paths.iter().map(|p| p.to_string_lossy().to_string()).collect())),
            None => Ok(None),
        }
    } else {
        let result = dialog.pick_folder();
        match result {
            Some(path) => Ok(Some(vec![path.to_string_lossy().to_string()])),
            None => Ok(None),
        }
    }
}

/// Open file picker dialog
#[tauri::command]
async fn open_file_picker(
    app: AppHandle,
    title: Option<String>,
    multiple: Option<bool>,
) -> Result<Option<Vec<String>>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    }

    if multiple.unwrap_or(false) {
        let result = dialog.pick_files();
        match result {
            Some(paths) => Ok(Some(paths.iter().map(|p| p.to_string_lossy().to_string()).collect())),
            None => Ok(None),
        }
    } else {
        let result = dialog.pick_file();
        match result {
            Some(path) => Ok(Some(vec![path.to_string_lossy().to_string()])),
            None => Ok(None),
        }
    }
}

/// Save file picker dialog
#[tauri::command]
async fn save_file_picker(
    app: AppHandle,
    title: Option<String>,
    default_path: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    }

    if let Some(path) = default_path {
        dialog = dialog.set_file_name(&path);
    }

    let result = dialog.save_file();
    match result {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

/// Check for updates
#[tauri::command]
async fn check_update(app: AppHandle) -> Result<UpdateInfo, String> {
    // Using tauri-plugin-updater for update checks
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => Ok(UpdateInfo {
                    update_available: true,
                    version: Some(update.version.clone()),
                }),
                Ok(None) => Ok(UpdateInfo {
                    update_available: false,
                    version: None,
                }),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Install update
#[tauri::command]
async fn install_update(app: AppHandle) -> Result<(), String> {
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    update.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())
                }
                Ok(None) => Err("No update available".to_string()),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Get the default server URL from settings
#[tauri::command]
async fn get_default_server_url(app: AppHandle) -> Result<Option<String>, String> {
    let store = app.store(STORE_NAME).map_err(|e| e.to_string())?;

    match store.get(DEFAULT_SERVER_KEY) {
        Some(value) => {
            if let Some(url) = value.as_str() {
                Ok(Some(url.to_string()))
            } else {
                Ok(None)
            }
        }
        None => Ok(None),
    }
}

/// Set the default server URL in settings
#[tauri::command]
async fn set_default_server_url(app: AppHandle, url: Option<String>) -> Result<(), String> {
    let store = app.store(STORE_NAME).map_err(|e| e.to_string())?;

    match url {
        Some(u) => {
            store.set(DEFAULT_SERVER_KEY, serde_json::json!(u));
        }
        None => {
            store.delete(DEFAULT_SERVER_KEY);
        }
    }

    store.save().map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_os,
            get_version,
            open_link,
            restart,
            notify,
            open_directory_picker,
            open_file_picker,
            save_file_picker,
            check_update,
            install_update,
            get_default_server_url,
            set_default_server_url,
        ])
        .setup(|app| {
            // Set up window decorations for macOS
            #[cfg(target_os = "macos")]
            {
                use tauri::TitleBarStyle;
                if let Some(window) = app.get_webview_window("main") {
                    // Enable transparent titlebar with custom styling
                    let _ = window.set_title_bar_style(TitleBarStyle::Overlay);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
