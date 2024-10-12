use reqwest::header::{
    HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, CONTENT_TYPE, ORIGIN, USER_AGENT,
};
use serde_json::json;
use tauri_plugin_http::reqwest;

pub async fn fech_data(iterator: Option<String>, filter: &str, is_nsfw: bool) -> String {
    // Create a client
    let client = reqwest::Client::new();

    // Prepare the request body
    let body = json!({
        "query": "query DiscoverFilteredSubredditsQuery($filter: MediaFilter $limit: Int $iterator: String $hostsDown: [HostDisk] $includeFilters: [Int] $excludeFilters: [Int] $isNsfw: Boolean) {
            discoverFilteredSubreddits(isNsfw: $isNsfw filter: $filter limit: $limit iterator: $iterator includeFilters: $includeFilters excludeFilters: $excludeFilters) {
                iterator items {
                    __typename
                    id
                    url
                    title
                    secondaryTitle
                    description
                    createdAt
                    isNsfw
                    subscribers
                    isComplete
                    itemCount
                    videoCount
                    pictureCount
                    albumCount
                    isPaid
                    username
                    tags
                    banner {
                        url
                        width
                        height
                        isOptimized
                    }
                    isFollowing
                    children(limit: 2 iterator: null filter: VIDEO disabledHosts: $hostsDown) {
                        iterator items {
                            __typename
                            id
                            url
                            title
                            subredditId
                            subredditTitle
                            subredditUrl
                            redditPath
                            isNsfw
                            albumUrl
                            hasAudio
                            fullLengthSource
                            gfycatSource
                            redgifsSource
                            ownerAvatar
                            username
                            displayName
                            isPaid
                            tags
                            isFavorite
                            mediaSources {
                                url
                                width
                                height
                                isOptimized
                            }
                            blurredMediaSources {
                                url
                                width
                                height
                                isOptimized
                            }
                        }
                    }
                }
            }
        }",
        "variables": {
            "limit": 30,
            "iterator": iterator,
            "filter": filter,
            "hostsDown": null,
            "includeFilters": [],
            "excludeFilters": []
        },
        "authorization": null
    });

    println!("body: {:?}", body);

    // Prepare headers
    let mut headers = HeaderMap::new();
    headers.insert(ACCEPT, HeaderValue::from_static("*/*"));
    headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("en-US,en;q=0.9"));
    headers.insert(
        CONTENT_TYPE,
        HeaderValue::from_static("text/plain;charset=UTF-8"),
    );
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"),
    );
    headers.insert(
        ORIGIN,
        HeaderValue::from_static("https://www.scrolller.com"),
    );

    // Make the POST request
    let response = client
        .post("https://api.scrolller.com/api/v2/graphql")
        .headers(headers)
        .json(&body)
        .send()
        .await;
    let text = response.unwrap().text().await.unwrap();

    text
}
