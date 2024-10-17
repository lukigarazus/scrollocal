export const getMediaSourceURL = (url: string) => {
  const mediaSource = new MediaSource();
  mediaSource.addEventListener("sourceopen", onSourceOpen);

  async function onSourceOpen() {
    const sourceBuffer = mediaSource.addSourceBuffer("video/mp4"); // Change codec as necessary

    // Function to fetch a byte range and append it to the source buffer
    async function fetchChunk(start: number, end: number) {
      const response = await fetch(url, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
      });

      if (response.status === 206) {
        const data = await response.arrayBuffer();
        sourceBuffer.appendBuffer(data);
      } else {
        console.error("Failed to fetch data:", response.status);
      }
    }

    // Example: Fetch and append chunks in a loop (you can customize this logic)
    let start = 0;
    const chunkSize = 8;
    let isAppending = false;

    function fetchNextChunk() {
      console.log("Fetching chunk", isAppending, start);
      if (isAppending) return; // Prevent multiple fetches

      isAppending = true;
      fetchChunk(start, start + chunkSize - 1).then(() => {
        start += chunkSize; // Move to the next chunk
        isAppending = false;

        // Check if we need to fetch more data
        if (mediaSource.readyState === "open") {
          fetchNextChunk();
        }
      });
    }

    // Start fetching the first chunk
    fetchNextChunk();

    sourceBuffer.addEventListener("updateend", () => {
      console.log("Buffer updated", sourceBuffer.updating);
      if (!sourceBuffer.updating) {
        fetchNextChunk(); // Fetch the next chunk if the buffer is not updating
      }
    });
  }

  return URL.createObjectURL(mediaSource);
};
