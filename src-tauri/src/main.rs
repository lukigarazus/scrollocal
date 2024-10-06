// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{self, Engine};
use file_format::{self, Kind};
use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct KindWrapper(Kind);

impl Serialize for KindWrapper {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let kind_str = match self.0 {
            Kind::Image => "image",
            Kind::Video => "video",
            Kind::Audio => "audio",

            _ => "unknown",
        };
        serializer.serialize_str(kind_str)
    }
}

struct LocalFile {
    name: String,
    lazy: bool,
    data: Option<String>,
    kind: KindWrapper,
    extension: String,
}

impl Serialize for LocalFile {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut state = serializer.serialize_struct("File", 3)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("data", &self.data)?;
        state.serialize_field("kind", &self.kind)?;
        state.serialize_field("extension", &self.extension)?;
        state.serialize_field("lazy", &self.lazy)?;

        state.end()
    }
}

#[tauri::command(async)]
fn load_file(path: &str) -> Result<LocalFile, String> {
    let dir = tauri::api::path::download_dir();

    let file = dir.and_then(|dir| {
        let path = dir.join(path);
        if path.is_file() {
            let path = path.to_str().unwrap().to_string();
            let fmt = file_format::FileFormat::from_file(&path);
            let file = tauri::api::file::read_binary(&path);
            if let Ok(file) = file {
                let encoded = base64::engine::general_purpose::STANDARD.encode(&file);
                let file = LocalFile {
                    name: path,
                    lazy: false,
                    data: Some(encoded),
                    kind: KindWrapper(
                        fmt.as_ref()
                            .map_or(file_format::Kind::Other, |fmt| fmt.kind()),
                    ),
                    extension: fmt
                        .as_ref()
                        .map_or("".to_string(), |fmt| fmt.extension().to_string()),
                };

                Some(file)
            } else {
                println!("path: {}, file not ok", path);
                None
            }
        } else {
            None
        }
    });

    if let Some(file) = file {
        Ok(file)
    } else {
        Err("file not found".to_string())
    }
}

#[tauri::command(async)]
fn load_files(path: &str) -> Vec<LocalFile> {
    // Tauri read all files in Downloads

    let dir = tauri::api::path::download_dir();
    let paths = dir
        .and_then(|dir| {
            let path = dir.join(path);
            if path.is_file() {
                let path_string = path.to_str().unwrap();
                Some(vec![path_string.to_string()])
            } else if path.is_dir() {
                println!("path: {}", path.to_str().unwrap());
                let dir = std::fs::read_dir(path);
                let mut files = vec![];
                if let Ok(dir) = dir {
                    for entry in dir {
                        if let Ok(entry) = entry {
                            let path = entry.path().to_str().unwrap().to_string();
                            println!("path: {}", path);
                            files.push(path);
                        }
                    }
                }

                Some(files)
            } else {
                None
            }
        })
        .unwrap_or(vec![]);

    let mut files = vec![];
    for path in paths {
        let fmt = file_format::FileFormat::from_file(&path);
        //let file = tauri::api::file::read_binary(&path);

        //if let Ok(file) = file {
        //let encoded = base64::engine::general_purpose::STANDARD.encode(&file);
        let file = LocalFile {
            name: path,
            lazy: true,
            data: None,
            kind: KindWrapper(
                fmt.as_ref()
                    .map_or(file_format::Kind::Other, |fmt| fmt.kind()),
            ),
            extension: fmt
                .as_ref()
                .map_or("".to_string(), |fmt| fmt.extension().to_string()),
        };
        files.push(file);
        //} else {
        //    println!("path: {}, file not ok", path);
        //}
    }

    files
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_files, load_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
