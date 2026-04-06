const API = process.env.REACT_APP_API_URL || "";

export function getImgUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path; // Cloudinary URL đầy đủ
  return `${API}${path}`; // Local path cũ
}
