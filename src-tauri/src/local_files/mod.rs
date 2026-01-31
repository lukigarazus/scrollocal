use crate::types::{Dimensions, KindWrapper, LocalFile};

pub fn try_fixing_file(source_path_string: &str) -> Result<String, String> {
    let source_path = std::path::Path::new(source_path_string);

    if source_path.is_file() {
        //ffmpeg -i pelicula.mp4 -vcodec h264 pelicula_264.mp4

        let file_stem = source_path.file_stem().unwrap();
        let new_file_name = format!(
            "{}_fixed.{}",
            file_stem.to_string_lossy(),
            source_path
                .extension()
                .unwrap_or_default()
                .to_string_lossy()
        );
        let dest_path = source_path.with_file_name(new_file_name);
        let status = std::process::Command::new("ffmpeg")
            .arg("-i")
            .arg(&source_path)
            .arg("-c:v")
            .arg("libx264")
            .arg("-c:a")
            .arg("aac")
            .arg("-b:a")
            .arg("192k")
            .arg("-movflags")
            .arg("+faststart")
            .arg("-strict")
            .arg("experimental")
            .arg(&dest_path)
            .status();

        match status {
            Ok(status) => {
                if status.success() {
                    Ok(dest_path.to_string_lossy().to_string())
                } else {
                    Err("Failed to execute FFmpeg".to_string())
                }
            }
            Err(err) => Err(err.to_string()),
        }
    } else {
        Err("File not found".to_string())
    }
}

pub fn snip_file_to_base_dir(
    source_path_string: &str,
    base_dir: &std::path::PathBuf,
    from: &str,
    to: &str,
    clip_name: &str,
    extension: &str,
) -> Result<String, String> {
    let source_path = std::path::Path::new(source_path_string);
    // ffmpeg -ss from -i input -c copy -to to output

    if source_path.is_file() {
        let source_extension = source_path.extension().unwrap();
        let dest_path = base_dir.join(clip_name).with_extension(&source_extension);
        let status = std::process::Command::new("ffmpeg")
            .arg("-ss")
            .arg(from)
            .arg("-i")
            .arg(&source_path)
            .arg("-c")
            .arg("copy")
            .arg("-t")
            .arg(to)
            .arg(&dest_path)
            .status()
            .expect("Failed to execute FFmpeg");

        let status = if status.success() {
            Ok(dest_path.to_str().unwrap().to_string())
        } else {
            Err("Failed to execute FFmpeg".to_string())
        };

        if (status.is_ok()) {
            if (source_extension == extension) {
                Ok(dest_path.to_str().unwrap().to_string())
            } else {
                // ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus output.webm
                let status = std::process::Command::new("ffmpeg")
                    .arg("-i")
                    .arg(&dest_path)
                    .arg("-c:v")
                    .arg("libvpx-vp9")
                    .arg("-crf")
                    .arg("30")
                    .arg("-b:v")
                    .arg("0")
                    .arg("-b:a")
                    .arg("128k")
                    .arg("-c:a")
                    .arg("libopus")
                    .arg(&dest_path.with_extension(extension))
                    .status();

                if status.unwrap().success() {
                    std::fs::remove_file(&dest_path);
                    Ok(dest_path
                        .with_extension(extension)
                        .to_str()
                        .unwrap()
                        .to_string())
                } else {
                    Err("could not convert".to_string())
                }
            }
        } else {
            Err(status.unwrap_err())
        }
    } else {
        Err("Source path is not a file".to_string())
    }
}

pub fn hard_link_file_to_base_dir(
    source_path_string: &str,
    base_dir: &std::path::PathBuf,
) -> Result<String, String> {
    let source_path = std::path::Path::new(source_path_string);

    if source_path.is_file() {
        let dest_path = base_dir.join(source_path.file_name().unwrap());
        let dest_path_string = dest_path
            .to_str()
            .map(|s| s.to_string())
            .ok_or("".to_string());

        if dest_path.exists() {
            return dest_path_string;
        }
        match std::fs::hard_link(source_path, &dest_path) {
            Ok(_) => dest_path_string,
            Err(e) => Err(e.to_string()),
        }
    } else {
        Err("Source path is not a file".to_string())
    }
}

pub fn clean_dir<F>(dir: &std::path::PathBuf, filter: F) -> Result<String, String>
where
    F: Fn(&std::fs::DirEntry) -> bool,
{
    if dir.is_dir() {
        let dir = std::fs::read_dir(dir);
        if let Ok(dir) = dir {
            for entry in dir {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    let should_not_remove = filter(&entry);

                    if path.is_file() && !should_not_remove {
                        std::fs::remove_file(&path);
                    }
                } else {
                    return Err("Invalid entry".to_string());
                }
            }

            Ok("success".to_string())
        } else {
            Err("data dir is a dir but can't be read".to_string())
        }
    } else {
        Err("data dir is not a dir".to_string())
    }
}

pub fn get_media_dimensions_from_path(
    media_path: &str,
    base_dir: &std::path::PathBuf,
) -> Option<Dimensions> {
    let store = get_local_file_metadata_store(base_dir);
    let cached_dimensions =
        store
            .as_ref()
            .and_then(|store| match store.get::<Dimensions>(&media_path) {
                Ok(dims) => Some(dims),
                Err(_) => None,
            });

    if let Some(dims) = cached_dimensions {
        return Some(dims);
    }

    let probe = ffprobe::ffprobe(&media_path);
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
        store.map(|store| store.save_with_id(dims, &media_path));
    });
    dims
}

pub fn get_file_path_strings_from_dir(dir: &std::path::Path) -> Option<Vec<String>> {
    if dir.is_file() {
        let dir_string = dir.to_str().unwrap();
        Some(vec![dir_string.to_string()])
    } else if dir.is_dir() {
        let dir = std::fs::read_dir(dir);
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
        None
    }
}

pub fn get_local_file_metadata_store(base_dir: &std::path::Path) -> Option<jfs::Store> {
    match jfs::Store::new_with_cfg(
        base_dir.join("metadata"),
        jfs::Config {
            single: true,
            indent: 2,
            pretty: false,
        },
    ) {
        Ok(store) => Some(store),
        Err(_) => None,
    }
}

pub fn load_local_files_from_base_dir(base_dir: Option<std::path::PathBuf>) -> Vec<LocalFile> {
    if let Some(base_dir) = base_dir {
        let paths = get_file_path_strings_from_dir(&base_dir).unwrap_or(vec![]);

        let mut files = vec![];
        for path in paths {
            let is_json = path.ends_with(".json");

            if is_json {
                continue;
            }

            let fmt = file_format::FileFormat::from_file(&path);
            let dims = get_media_dimensions_from_path(&path, &base_dir);

            // Extract file extension for fallback detection
            let file_extension = std::path::Path::new(&path)
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("")
                .to_lowercase();

            // Determine file kind with MP4 fallback logic
            let file_kind = match fmt {
                Ok(format) => format.kind(),
                Err(_) => {
                    // Fallback for when file-format crate fails
                    match file_extension.as_str() {
                        "mp4" | "m4v" | "mov" | "avi" | "mkv" | "webm" | "flv" => file_format::Kind::Video,
                        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "svg" => file_format::Kind::Image,
                        "mp3" | "wav" | "flac" | "aac" | "ogg" => file_format::Kind::Audio,
                        _ => file_format::Kind::Other,
                    }
                }
            };

            // Determine extension with MP4 handling
            let extension = match fmt {
                Ok(format) => {
                    let detected_ext = format.extension().to_string();
                    // Handle special cases where file-format might return incorrect extensions
                    if detected_ext.is_empty() || detected_ext == "bin" {
                        file_extension
                    } else {
                        detected_ext
                    }
                },
                Err(_) => file_extension,
            };

            let file = LocalFile {
                name: path,
                lazy: true,
                data: None,
                dimensions: dims,
                kind: KindWrapper(file_kind),
                extension,
            };
            files.push(file);
            //} else {
            //    println!("path: {}, file not ok", path);
            //}
        }

        files
    } else {
        vec![]
    }
}
