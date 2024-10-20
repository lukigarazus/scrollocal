import pixelmatch from "pixelmatch";
const getVideoLength = (videoElement: HTMLVideoElement) => {
  return videoElement.duration;
};

function calculateImageDifference(
  image1: HTMLCanvasElement,
  image2: HTMLCanvasElement,
) {
  const data1 = image1
    .getContext("2d")
    ?.getImageData(0, 0, image1.width, image1.height).data;
  const data2 = image2
    .getContext("2d")
    ?.getImageData(0, 0, image2.width, image2.height).data;

  if (!data1 || !data2) {
    return null;
  }

  // let diffCount = 0;
  const totalPixels = image1.width * image2.height;
  //
  // for (let i = 0; i < data1.length; i += 4) {
  //   const rDiff = Math.abs(data1[i] - data2[i]);
  //   const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
  //   const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
  //
  //   // Calculate the difference
  //   if (rDiff > 0 || gDiff > 0 || bDiff > 0) {
  //     diffCount++;
  //   }
  // }
  //
  // // Calculate percentage difference
  // const percentageDifference = (diffCount / totalPixels) * 100;
  // return percentageDifference;

  const diffPixels = pixelmatch(
    data1,
    data2,
    null,
    image1.width,
    image1.height,
    {
      threshold: 0.2,
    },
  );

  return (diffPixels / totalPixels) * 100;
}

export const bruteForceSceneCuts = (
  video: HTMLVideoElement,
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  step = 1,
  accumulator = [] as number[],
  currentTime = 0,
): Promise<number[]> => {
  if (currentTime >= video.duration) {
    return Promise.resolve(accumulator);
  }

  const ctx1 = canvas1.getContext("2d");
  const ctx2 = canvas2.getContext("2d");

  if (!ctx1 || !ctx2) {
    return Promise.reject("Could not get canvas context");
  }

  ctx1.drawImage(video, 0, 0, canvas1.width, canvas1.height);

  const promise = new Promise<number[]>((res) => {
    video.addEventListener(
      "seeked",
      () => {
        ctx2.drawImage(video, 0, 0, canvas2.width, canvas2.height);

        const percentageDifference = calculateImageDifference(canvas1, canvas2);
        console.log(currentTime, percentageDifference);
        if (percentageDifference && percentageDifference > 50) {
          accumulator.push(currentTime);
        }
        res(
          bruteForceSceneCuts(
            video,
            canvas1,
            canvas2,
            step,
            accumulator,
            currentTime + step,
          ),
        );
      },
      { once: true },
    );
  });

  video.currentTime = currentTime + step;

  return promise;
};

export const drawVideoOverviewToCanvas = (
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  partitions = 10,
  x = 0,
  i = 0,
) => {
  if (i >= partitions) {
    videoElement.currentTime = 0;
    return;
  }
  const partition = getVideoLength(videoElement) / partitions;
  videoElement.addEventListener(
    "seeked",
    () => {
      context.drawImage(
        videoElement,
        x,
        0,
        canvas.width / partitions,
        canvas.height,
      );
      setTimeout(() => {
        drawVideoOverviewToCanvas(
          videoElement,
          canvas,
          context,
          partitions,
          x + canvas.width / partitions,
          i + 1,
        );
      }, partition);
    },
    { once: true },
  );
  videoElement.currentTime = Math.max(1, i * partition);
};
