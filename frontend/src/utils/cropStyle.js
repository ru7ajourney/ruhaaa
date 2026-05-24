// Compute inline CSS for an <img> so that only the cropped area is visible
// within an overflow-hidden parent of any size. cropArea is { x, y, width, height }
// in percentages (0–100) of the original image, as produced by react-easy-crop.
export function getCropImgStyle(cropArea) {
  const c = cropArea && cropArea.width ? cropArea : { x: 0, y: 0, width: 100, height: 100 };
  return {
    position: "absolute",
    display:  "block",
    width:    `${10000 / c.width}%`,
    height:   `${10000 / c.height}%`,
    left:     `${-c.x * 100 / c.width}%`,
    top:      `${-c.y * 100 / c.height}%`,
    objectFit:"cover",
    maxWidth: "none",
    pointerEvents: "none",
  };
}
