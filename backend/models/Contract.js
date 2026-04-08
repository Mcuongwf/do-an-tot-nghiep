const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Contract = sequelize.define("Contract", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  price: { type: DataTypes.BIGINT, allowNull: false },
  deposit: { type: DataTypes.BIGINT, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM("active", "expired", "terminated"),
    defaultValue: "active",
  },
  electricPrice: { type: DataTypes.BIGINT, defaultValue: 3500 },
  waterPrice: { type: DataTypes.BIGINT, defaultValue: 15000 },
  internetPrice: { type: DataTypes.BIGINT, defaultValue: 0 },
  note: DataTypes.TEXT,
  terminatedAt: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: "contracts", underscored: true, timestamps: false });

module.exports = Contract;
