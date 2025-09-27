// Utility functions for handling profile picture uploads
export function handleImageUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      reject(new Error('Image size must be less than 5MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (jpg, png, gif, etc.)';
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  
  return null;
}