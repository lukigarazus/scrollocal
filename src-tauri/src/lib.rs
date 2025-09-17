use http::{header::*, response::Builder as ResponseBuilder, status::StatusCode};
use rand::seq::SliceRandom;
use rand::thread_rng;
use tauri::Manager;

mod http_server;
mod local_files;
mod scrolller;
mod streaming;
mod types;

struct AppData {
    port: u16,
}

#[tauri::command(async)]
async fn get_scrolller_data(iterator: Option<String>, filter: String, is_nsfw: bool) -> String {
    scrolller::fech_data(iterator, &filter, is_nsfw).await
}

fn scramble_vec<T>(data: &mut Vec<T>) {
    data.shuffle(&mut thread_rng());
}

fn get_media_dir(app_handle: tauri::AppHandle) -> Option<std::path::PathBuf> {
    get_data_dir(app_handle).map(|data_dir| data_dir.join("media"))
}

fn get_editor_dir(app_handle: tauri::AppHandle) -> Option<std::path::PathBuf> {
    get_data_dir(app_handle).map(|data_dir| data_dir.join("editor"))
}

fn get_data_dir(app_handle: tauri::AppHandle) -> Option<std::path::PathBuf> {
    let data_dir = app_handle.path().app_data_dir();
    let data_dir = match data_dir {
        Ok(data_dir) => Some(data_dir),
        Err(_) => None,
    };
    data_dir
}

#[tauri::command(async)]
fn move_files_to_data_dir(app_handle: tauri::AppHandle, path: &str) -> Result<String, String> {
    let home = app_handle.path().home_dir();
    println!("home: {:?}", home);
    let home = match home {
        Ok(home) => Some(home),
        Err(_) => None,
    };
    let data_dir = get_media_dir(app_handle);

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
fn clean_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = get_media_dir(app_handle);
    let base_dir = data_dir;

    match base_dir {
        Some(base_dir) => local_files::clean_dir(&base_dir, |entry| {
            entry.file_name().to_str().unwrap().ends_with(".json")
        }),
        _ => Err("data dir not found".to_string()),
    }
}

fn load_files_base(app_handle: tauri::AppHandle) -> Vec<types::LocalFile> {
    let start = std::time::Instant::now();

    let data_dir = get_media_dir(app_handle);
    println!("data_dir: {:?}", data_dir);

    let base_dir = data_dir;

    let files = local_files::load_local_files_from_base_dir(base_dir);

    println!("loaded {} files in {:?}", files.len(), start.elapsed());

    files
}

#[tauri::command(async)]
fn load_files(app_handle: tauri::AppHandle) -> Vec<types::LocalFile> {
    load_files_base(app_handle)
}

#[tauri::command(async)]
fn load_files_random(app_handle: tauri::AppHandle) -> Vec<types::LocalFile> {
    let mut result = load_files_base(app_handle);
    scramble_vec(&mut result);
    result
}

#[tauri::command(async)]
fn move_file_to_data_dir(app_handle: tauri::AppHandle, dir: &str) -> Result<String, String> {
    let base_dir = get_editor_dir(app_handle);

    match base_dir {
        Some(base_dir) => local_files::hard_link_file_to_base_dir(dir, &base_dir),
        None => Err("data dir not found".to_string()),
    }
}

#[tauri::command(async)]
fn snip_file(
    app_handle: tauri::AppHandle,
    source_path_string: &str,
    from: &str,
    to: &str,
    clip_name: &str,
    extension: &str,
    should_save_to_gallery: Option<bool>,
) -> Result<String, String> {
    let base_dir = if should_save_to_gallery.unwrap_or(false) {
        get_media_dir(app_handle)
    } else {
        get_editor_dir(app_handle)
    };
    if let Some(base_dir) = base_dir {
        local_files::snip_file_to_base_dir(
            source_path_string,
            &base_dir,
            from,
            to,
            clip_name,
            extension,
        )
    } else {
        Err("data dir not found".to_string())
    }
}

#[tauri::command(async)]
fn try_fixing_file(source_path_string: &str) -> Result<String, String> {
    local_files::try_fixing_file(source_path_string)
}

#[tauri::command]
fn get_http_port(app_handle: tauri::AppHandle) -> u16 {
    let state = app_handle.state::<AppData>();

    state.port
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    //let port =
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let port = http_server::get_available_port().unwrap_or(8080);

            app.manage(AppData { port });

            let data_dir = app.path().app_data_dir();

            let data_dir = match data_dir {
                Ok(data_dir) => Some(data_dir),
                Err(_) => None,
            };

            if let Some(data_dir) = data_dir {
                std::fs::create_dir_all(&data_dir);

                let media_dir = data_dir.join("media");
                let editor_dir = data_dir.join("editor");

                std::fs::create_dir_all(media_dir);
                std::fs::create_dir_all(editor_dir);
            }

            //tauri::async_runtime::spawn(
            //    actix_web::HttpServer::new(|| {
            //        actix_web::App::new()
            //            .wrap(actix_cors::Cors::permissive())
            //            .service(http_server::test_handle)
            //            .service(http_server::file_handle)
            //    })
            //    .bind(("127.0.0.1", port.clone()))?
            //    .run(),
            //);

            Ok(())
        })
        .register_asynchronous_uri_scheme_protocol("stream", move |_ctx, request, responder| {
            match streaming::get_stream_response(request) {
                Ok(http_response) => responder.respond(http_response),
                Err(e) => responder.respond(
                    ResponseBuilder::new()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .header(CONTENT_TYPE, "text/plain")
                        .body(e.to_string().as_bytes().to_vec())
                        .unwrap(),
                ),
            }
        })
        .invoke_handler(tauri::generate_handler![
            load_files,
            load_files_random,
            move_files_to_data_dir,
            clean_data_dir,
            get_scrolller_data,
            move_file_to_data_dir,
            get_http_port,
            snip_file,
            try_fixing_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
