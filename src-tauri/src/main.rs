// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{self, Engine};
use file_format::{self, Kind};
use serde::ser::SerializeStruct;
use serde::{Deserialize, Serialize, Serializer};

use rand::seq::SliceRandom;
use rand::thread_rng;

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
    dimensions: Option<Dimensions>,
    extension: String,
}

#[derive(Serialize, Deserialize)]
struct Dimensions {
    width: i64,
    height: i64,
    aspect_ratio: String,
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
        state.serialize_field("dimensions", &self.dimensions)?;

        state.end()
    }
}

fn get_dimensions_from_path(path: &str, store: Option<jfs::Store>) -> Option<Dimensions> {
    let cached_dimensions = store
        .as_ref()
        .and_then(|store| match store.get::<Dimensions>(&path) {
            Ok(dims) => Some(dims),
            Err(_) => None,
        });

    if let Some(dims) = cached_dimensions {
        return Some(dims);
    }

    let probe = ffprobe::ffprobe(&path);
    let stream = match probe {
        Ok(ref probe) => probe.streams.first(),
        Err(_) => None,
    };
    let dims = match stream {
        Some(stream) => stream.width.and_then(|w| {
            stream
                .display_aspect_ratio
                .to_owned()
                .and_then(|aspect_ratio| {
                    stream.height.map(|h| Dimensions {
                        width: w,
                        height: h,
                        aspect_ratio,
                    })
                })
        }),
        None => None,
    };

    dims.as_ref().map(|dims| {
        store.map(|store| store.save_with_id(dims, &path));
    });
    dims
}

#[tauri::command(async)]
fn load_file(path: &str) -> Result<LocalFile, String> {
    let start = std::time::Instant::now();
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
                    dimensions: None,
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

    println!("load_file took {:?}", start.elapsed());
    if let Some(file) = file {
        Ok(file)
    } else {
        Err("file not found".to_string())
    }
}

#[tauri::command(async)]
fn load_file_batch(paths: Vec<&str>) -> Result<Vec<LocalFile>, String> {
    let start = std::time::Instant::now();
    let dir = tauri::api::path::download_dir();

    let files = dir.and_then(|dir| {
        paths
            .iter()
            .map(|path| {
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
                            dimensions: None,
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
            })
            .collect()
    });

    println!("load_file_batch took {:?}", start.elapsed());
    if let Some(files) = files {
        Ok(files)
    } else {
        Err("file not found".to_string())
    }
}

fn scramble_vec<T>(data: &mut Vec<T>) {
    data.shuffle(&mut thread_rng());
}

fn get_data_dir() -> Option<std::path::PathBuf> {
    tauri::api::path::data_dir().map(|data_dir| data_dir.join("local-browser"))
}

#[tauri::command(async)]
fn move_files_to_data_dir(path: &str) -> Result<String, String> {
    let home = tauri::api::path::home_dir();
    let data_dir = get_data_dir();

    let source_path = home.map(|home| home.join(path));

    let res = match (source_path, data_dir) {
        (Some(source_path), Some(data_dir)) => {
            if source_path.is_dir() && data_dir.is_dir() {
                let source_dir = std::fs::read_dir(source_path);
                if let Ok(source_dir) = source_dir {
                    for entry in source_dir {
                        if let Ok(entry) = entry {
                            let path = entry.path();
                            let destination_path = data_dir.join(entry.file_name());

                            if path.is_file() && !destination_path.exists() {
                                //std::fs::copy(&path, &destination_path);
                                // symlink
                                std::fs::hard_link(&path, &destination_path);
                            }
                        } else {
                            return Err("source path not found".to_string());
                        }
                    }

                    Ok("success".to_string())
                } else {
                    Err("source path not found".to_string())
                }
            } else {
                Err("source path or data dir not found".to_string())
            }
        }
        _ => Err("source path or data dir not found".to_string()),
    };

    println!("move_files_to_data_dir res: {:?}", res);

    res
}

#[tauri::command(async)]
fn clean_data_dir() -> Result<String, String> {
    let data_dir = get_data_dir();

    match data_dir {
        Some(data_path) => {
            if data_path.is_dir() {
                let data_dir = std::fs::read_dir(data_path);
                if let Ok(data_dir) = data_dir {
                    for entry in data_dir {
                        if let Ok(entry) = entry {
                            let path = entry.path();
                            let is_json = entry.file_name().to_str().unwrap().ends_with(".json");

                            if path.is_file() && !is_json {
                                std::fs::remove_file(&path);
                            }
                        } else {
                            return Err("data path not found".to_string());
                        }
                    }

                    Ok("success".to_string())
                } else {
                    Err("data path not found".to_string())
                }
            } else {
                Err("data dir not found".to_string())
            }
        }
        _ => Err("data dir not found".to_string()),
    }
}

fn load_files_base() -> Vec<LocalFile> {
    let start = std::time::Instant::now();
    // Tauri read all files in Downloads

    let data_dir = get_data_dir();
    //let main_path = dir.map(|dir| dir.join(path));

    let main_path = data_dir;

    let paths = main_path
        .as_ref()
        .and_then(|path| {
            if path.is_file() {
                let path_string = path.to_str().unwrap();
                Some(vec![path_string.to_string()])
            } else if path.is_dir() {
                let dir = std::fs::read_dir(path);
                let mut files = vec![];
                if let Ok(dir) = dir {
                    for entry in dir {
                        if let Ok(entry) = entry {
                            let path = entry.path().to_str().unwrap().to_string();
                            files.push(path);
                        }
                    }
                }

                Some(files)
            } else {
                std::fs::create_dir(path);
                None
            }
        })
        .unwrap_or(vec![]);

    let mut files = vec![];
    for path in paths {
        let is_json = path.ends_with(".json");

        if is_json {
            continue;
        }

        let store = main_path.as_ref().and_then(|path| {
            match jfs::Store::new_with_cfg(
                path.join("metadata"),
                jfs::Config {
                    single: true,
                    indent: 2,
                    pretty: false,
                },
            ) {
                Ok(store) => Some(store),
                Err(_) => None,
            }
        });
        let fmt = file_format::FileFormat::from_file(&path);
        let dims = get_dimensions_from_path(&path, store);

        //let file = tauri::api::file::read_binary(&path);

        //if let Ok(file) = file {
        //let encoded = base64::engine::general_purpose::STANDARD.encode(&file);
        let file = LocalFile {
            name: path,
            lazy: true,
            data: None,
            dimensions: dims,
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

    println!("loaded {} files in {:?}", files.len(), start.elapsed());

    files
}

#[tauri::command(async)]
fn load_files() -> Vec<LocalFile> {
    load_files_base()
}

#[tauri::command(async)]
fn load_files_random() -> Vec<LocalFile> {
    let mut result = load_files_base();
    scramble_vec(&mut result);
    result
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_files,
            load_files_random,
            load_file,
            load_file_batch,
            move_files_to_data_dir,
            clean_data_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
