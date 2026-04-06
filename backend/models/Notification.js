const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: {
    type: DataTypes.ENUM("booking", "message", "review", "system"),
    defaultValue: "system",
  },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, defaultValue: "" },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  link: { type: DataTypes.STRING(500), defaultValue: "" },
}, { tableName: "notifications", underscored: true });

module.exports = Notification;
