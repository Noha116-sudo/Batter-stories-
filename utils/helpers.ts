
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Strip the data URL prefix (e.g., "data:image/png;base64,")
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });

const sanitizeForFilename = (text: string): string => {
  return text
    .replace(/^Scene\s*\d*:\s*/i, '') // Remove "Scene X: "
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
};

export const formatDateForFilename = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

export const generateFilename = (index: number, prompt: string, date: Date, timestamp: string = "00-00"): string => {
  const paddedIndex = String(index + 1).padStart(3, '0');
  const themeTag = sanitizeForFilename(prompt) || 'Untitled';
  const dateTag = formatDateForFilename(date);
  const timeTag = timestamp.replace(':', '-');
  return `${paddedIndex}_${themeTag}_${timeTag}.png`;
};
