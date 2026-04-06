const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: DataTypes.STRING,
  role: { type: DataTypes.ENUM("admin", "landlord", "tenant"), defaultValue: "tenant" },
  status: { type: DataTypes.ENUM("active", "locked"), defaultValue: "active" },
  address: DataTypes.TEXT,
  avatar: DataTypes.STRING,
}, { tableName: "users", underscored: true, timestamps: false });

module.exports = User;
