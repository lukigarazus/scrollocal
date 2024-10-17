use actix_files::NamedFile;
use actix_web::{get, web, HttpRequest, HttpResponse, Responder};
use serde::Deserialize;
use std::net::TcpListener;

#[get("/test")]
pub async fn test_handle() -> impl Responder {
    actix_web::HttpResponse::Ok().body("Hello world!")
}

#[derive(Debug, Deserialize)]
pub struct FileHandleParams {
    pub path: Option<String>,
}
#[get("/file")]
pub async fn file_handle(req: HttpRequest) -> actix_web::Result<NamedFile> {
    let params = web::Query::<FileHandleParams>::from_query(req.query_string()).unwrap();
    println!("{:?}", params);

    let path = params.path.as_ref().unwrap();
    println!("{:?}", path);

    Ok(NamedFile::open(path)?)
}

pub fn get_available_port() -> Option<u16> {
    (8000..9000).find(|port| port_is_available(*port))
}

pub fn port_is_available(port: u16) -> bool {
    match TcpListener::bind(("127.0.0.1", port)) {
        Ok(_) => true,
        Err(_) => false,
    }
}
