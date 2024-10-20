import { useBoundingClientRect } from "../useBoundingClientRef";
import { Container } from "./Container";
import { Box } from "./Box";
import { useEffect } from "react";

export const VideoFullSize = ({
  videoElement,
}: {
  videoElement: HTMLVideoElement;
}) => {
  const { rect, setRef } = useBoundingClientRect();

  useEffect(() => {
    if (rect?.height && rect?.width) {
      videoElement.width = rect.width;
      videoElement.height = rect.height;
    }
  }, [rect?.height, rect?.width]);
  return (
    <Box setRef={setRef}>
      <Container child={videoElement} />
    </Box>
  );
};
