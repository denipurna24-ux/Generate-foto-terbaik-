
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // result is "data:mime/type;base64,the-real-base64-string"
        // We only need the part after the comma
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
