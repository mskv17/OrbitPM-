/**
 * Resizes and center-crops an image file to fit target square dimensions (default 500x500)
 * using HTML5 Canvas with quality compression (default 0.9).
 *
 * @param {File|Blob} file - The raw image file to resize.
 * @param {object} [options] - Options for resizing.
 * @param {number} [options.width=500] - Target width in pixels.
 * @param {number} [options.height=500] - Target height in pixels.
 * @param {number} [options.quality=0.9] - Canvas compression quality (0.0 to 1.0).
 * @param {string} [options.outputType="image/jpeg"] - Output MIME type.
 * @returns {Promise<{ file: File, blob: Blob, dataUrl: string }>} Resized file, blob, and dataUrl preview.
 */
export function resizeImage(file, options = {}) {
  const {
    width = 500,
    height = 500,
    quality = 0.9,
    outputType = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      return reject(new Error("A valid image file is required for resizing."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("Failed to get 2D canvas context."));
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Calculate aspect ratio center-crop (cover fit)
        const imgAspect = img.width / img.height;
        const targetAspect = width / height;

        let renderWidth = img.width;
        let renderHeight = img.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > targetAspect) {
          // Source is wider -> crop sides
          renderWidth = img.height * targetAspect;
          offsetX = (img.width - renderWidth) / 2;
        } else {
          // Source is taller -> crop top and bottom
          renderHeight = img.width / targetAspect;
          offsetY = (img.height - renderHeight) / 2;
        }

        // Draw cropped region scaled onto 500x500 canvas
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          renderWidth,
          renderHeight,
          0,
          0,
          width,
          height
        );

        // Convert canvas content to compressed Blob & File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas to Blob conversion failed."));
            }

            const rawName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "avatar";
            const newFileName = `${rawName}-500x500.jpg`;

            const resizedFile = new File([blob], newFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL(outputType, quality);

            resolve({
              file: resizedFile,
              blob,
              dataUrl,
            });
          },
          outputType,
          quality
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

export default resizeImage;
