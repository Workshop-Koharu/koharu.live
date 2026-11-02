/**
 * Fast client-side image compression utility.
 * Downscales images to max dimensions and compresses via canvas to prevent:
 * 1. 413 Payload Too Large on Vercel (4.5MB limit)
 * 2. QuotaExceededError in localStorage (5MB limit)
 * 3. Network lag and UI post vanishing bugs
 */
export function compressImageFile(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve("");
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => resolve(src);
      img.src = src;
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

