const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Conversation = sequelize.define("Conversation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user1Id: { type: DataTypes.INTEGER, allowNull: false },
  user2Id: { type: DataTypes.INTEGER, allowNull: false },
  lastMessage: { type: DataTypes.TEXT, defaultValue: "" },
  lastMessageAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: "conversations", underscored: true, timestamps: false });

module.exports = Conversation;
