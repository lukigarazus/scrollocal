// ==UserScript==
// @name         Download Videos
// @namespace    http://tampermonkey.net/
// @version      2024-10-18
// @description  try to take over the world!
// @author       You
// @match        https://**/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=freeporn8.com
// @grant        none
// ==/UserScript==

const overrideMediaSourcePrototype = () => {
  // console.log("overriding MediaSource");
  //
  // const _endOfStream = window.MediaSource.prototype.endOfStream;
  // window.MediaSource.prototype.endOfStream = function () {
  //   console.log("endOfStream", arguments);
  //   _endOfStream.apply(this, arguments);
  // };
  //
  // const _addSourceBuffer = window.MediaSource.prototype.addSourceBuffer;
  // window.MediaSource.prototype.addSourceBuffer = function () {
  //   console.log("addSourceBuffer", arguments);
  //   _addSourceBuffer.apply(this, arguments);
  // };
};

const recordVideo = (videoElement) => {
  console.log("recordVideo", videoElement);
  const stream = videoElement.captureStream();
  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/mp4",
  });
  recorder.ondataavailable = (event) => {
    console.log("dataavailable", event.data);
    if (event.data.size) {
      chunks.push(event.data);
    }
  };
  recorder.onstop = () => {
    // Create a Blob from the recorded chunks
    const blob = new Blob(chunks, { type: "video/mp4" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "recording.mp4";
    downloadLink.style.display = "block";
    downloadLink.innerText = "Download Recording";

    window.downloadLink = downloadLink;

    delete window.recorder;

    mountUI();
  };
  window.recorder = recorder;
  recorder.start(1000);
  mountUI();
};

const attachToVideo = (videoElement) => {
  videoElement.addEventListener("loadeddata", () => {
    console.log("loadeddata", videoElement.duration);
  });
};

const iterateVideo = (videoElement, step = 1, currentTime = 0) => {
  console.log("iterateVideo", videoElement.duration);

  videoElement.addEventListener(
    "seeked",
    () => {
      console.log("seeked", videoElement.currentTime);
      iterateVideo(videoElement, step, currentTime + step);
    },
    { once: true },
  );
  videoElement.currentTime = currentTime + step;
};

const findAndAttachToVideo = () => {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    console.log("found video", videoElement.duration);
    // attachToVideo(videoElement);
    window.foundVideo = videoElement;
    mountUI();
  } else {
    console.log("no video found");
  }
};

const mountUI = () => {
  console.log("mounting UI");
  let ui;
  if (document.getElementById("ui")) {
    ui = document.getElementById("ui");
    ui.innerHTML = "";
  } else {
    ui = document.createElement("div");
    ui.className = "ui";
    ui.id = "ui";
  }
  const body = document.querySelector("body");

  const style = document.createElement("style");
  style.innerHTML = `
    .ui {
      position: fixed;
      bottom: 25px;
      left: 25px;
      text-align: center;
    }
  `;

  body.appendChild(style);

  const button = document.createElement("button");
  button.innerHTML = "Find Video";
  button.addEventListener("click", () => {
    findAndAttachToVideo();
  });
  ui.appendChild(button);

  if (window.foundVideo) {
    const iterateVideoButton = document.createElement("button");
    iterateVideoButton.innerHTML = "Iterate Video";
    iterateVideoButton.addEventListener("click", () => {
      window.foundVideo.currentTime = 0;
      iterateVideo(window.foundVideo, 10, 0);
    });
    ui.appendChild(iterateVideoButton);

    const recordVideoButton = document.createElement("button");
    recordVideoButton.innerHTML = "Record Video";
    recordVideoButton.addEventListener("click", () => {
      recordVideo(window.foundVideo);
    });
    ui.appendChild(recordVideoButton);
  }

  if (window.recorder) {
    const stopRecordingButton = document.createElement("button");
    stopRecordingButton.innerHTML = "Stop Recording";
    stopRecordingButton.addEventListener("click", () => {
      window.recorder.stop();
    });
    ui.appendChild(stopRecordingButton);
  }

  if (window.downloadLink) {
    ui.appendChild(window.downloadLink);
  }

  body.appendChild(ui);
  console.log("mounted UI");
};

(function () {
  "use strict";

  overrideMediaSourcePrototype();
  mountUI();

  // Your code here...
})();
