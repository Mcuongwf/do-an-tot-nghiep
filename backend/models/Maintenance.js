const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Maintenance = sequelize.define("Maintenance", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  images: { type: DataTypes.JSON, defaultValue: [] },
  status: {
    type: DataTypes.ENUM("Chờ xử lý", "Đang xử lý", "Hoàn thành"),
    defaultValue: "Chờ xử lý",
  },
  cost: { type: DataTypes.BIGINT, defaultValue: 0 },
  resolvedAt: DataTypes.DATE,
  note: DataTypes.TEXT,
}, { tableName: "maintenance", underscored: true });

module.exports = Maintenance;
