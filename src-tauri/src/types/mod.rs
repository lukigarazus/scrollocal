use file_format::{self, Kind};
use serde::ser::SerializeStruct;
use serde::{Deserialize, Serialize, Serializer};

pub struct KindWrapper(pub Kind);

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

#[derive(Serialize, Deserialize)]
pub struct Dimensions {
    pub width: i64,
    pub height: i64,
    pub aspect_ratio: String,
}

pub struct LocalFile {
    pub name: String,
    pub lazy: bool,
    pub data: Option<String>,
    pub kind: KindWrapper,
    pub dimensions: Option<Dimensions>,
    pub extension: String,
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
