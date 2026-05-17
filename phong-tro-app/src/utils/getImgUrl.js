const API = process.env.REACT_APP_API_URL || "";

export function getImgUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path; 
  return `${API}${path}`; 
}
