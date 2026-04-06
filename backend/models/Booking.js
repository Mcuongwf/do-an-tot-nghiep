const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Booking = sequelize.define("Booking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: DataTypes.STRING,
  time: { type: DataTypes.STRING, defaultValue: "09:00" },
  note: { type: DataTypes.TEXT, defaultValue: "" },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
    defaultValue: "pending",
  },
}, { tableName: "bookings", underscored: true });

module.exports = Booking;
