const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Room = sequelize.define("Room", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: "" },
  price: { type: DataTypes.BIGINT, allowNull: false },
  area: DataTypes.FLOAT,
  address: { type: DataTypes.STRING(500), allowNull: false },
  district: DataTypes.STRING,
  province: DataTypes.STRING,
  type: {
    type: DataTypes.ENUM("Phòng trọ", "Studio", "Mini Apartment", "Căn hộ", "KTX"),
    defaultValue: "Phòng trọ",
  },
  status: {
    type: DataTypes.ENUM("Còn trống", "Đang thuê", "Bảo trì"),
    defaultValue: "Còn trống",
  },
  postStatus: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  electricPrice: { type: DataTypes.BIGINT, defaultValue: 3500 },
  waterPrice: { type: DataTypes.BIGINT, defaultValue: 15000 },
  internetPrice: { type: DataTypes.BIGINT, defaultValue: 0 },
  amenities: { type: DataTypes.JSON, defaultValue: [] },
  images: { type: DataTypes.JSON, defaultValue: [] },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectReason: DataTypes.TEXT,
}, { tableName: "rooms", underscored: true });

module.exports = Room;
