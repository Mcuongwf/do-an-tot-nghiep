// Tỉnh/thành phố
export const PROVINCES = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bắc Ninh"];

// Quận/huyện theo tỉnh
export const DISTRICTS_BY_PROVINCE = {
  "TP. Hồ Chí Minh": [
    "Quận 1","Quận 2","Quận 3","Quận 4","Quận 5","Quận 6","Quận 7","Quận 8",
    "Quận 9","Quận 10","Quận 11","Quận 12","Bình Thạnh","Gò Vấp","Tân Bình",
    "Tân Phú","Thủ Đức","Bình Chánh","Hóc Môn","Nhà Bè",
  ],
  "Hà Nội": [
    "Ba Đình","Hoàn Kiếm","Đống Đa","Hai Bà Trưng","Hoàng Mai","Thanh Xuân",
    "Cầu Giấy","Nam Từ Liêm","Bắc Từ Liêm","Tây Hồ","Long Biên","Hà Đông",
  ],
  "Đà Nẵng": ["Hải Châu","Thanh Khê","Sơn Trà","Ngũ Hành Sơn","Liên Chiểu","Cẩm Lệ","Hòa Vang"],
  "Bắc Ninh": ["Thành phố Bắc Ninh","Từ Sơn","Tiên Du","Yên Phong","Quế Võ","Lương Tài","Gia Bình"],
};

// Danh sách tất cả quận (flat list, dùng trong Dashboard edit)
export const ALL_DISTRICTS = Object.values(DISTRICTS_BY_PROVINCE).flat();

// Loại phòng
export const ROOM_TYPES = ["Phòng trọ", "Studio", "Mini Apartment", "Căn hộ", "KTX"];

// Tiện ích
export const AMENITIES_LIST = [
  "WiFi", "Điều hòa", "WC riêng", "Bếp", "Máy giặt", "Tủ lạnh",
  "Bảo vệ 24/7", "Chỗ để xe", "Thang máy", "Hồ bơi", "Ban công", "Canteen",
];

// Options kèm "Tất cả" cho filter
export const PROVINCES_FILTER = ["Tất cả", ...PROVINCES];
export const ROOM_TYPES_FILTER = ["Tất cả", ...ROOM_TYPES];