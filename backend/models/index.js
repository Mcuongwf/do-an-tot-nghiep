const sequelize = require("../config/db");

const User = require("./User");
const Room = require("./Room");
const Booking = require("./Booking");
const Contract = require("./Contract");
const Conversation = require("./Conversation");
const Message = require("./Message");
const Maintenance = require("./Maintenance");
const Notification = require("./Notification");
const Review = require("./Review");

// Junction: Wishlist (User <-> Room)
const Wishlist = sequelize.define("Wishlist", {}, { tableName: "wishlists", underscored: true, timestamps: false });


// ── Room ──────────────────────────────────────────────
Room.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
User.hasMany(Room, { foreignKey: "owner_id", as: "rooms" });

// Wishlist
User.belongsToMany(Room, { through: Wishlist, foreignKey: "user_id", as: "wishlist" });
Room.belongsToMany(User, { through: Wishlist, foreignKey: "room_id", as: "wishedBy" });

// ── Booking ───────────────────────────────────────────
Booking.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Booking.belongsTo(User, { foreignKey: "tenant_id", as: "tenant" });
Room.hasMany(Booking, { foreignKey: "room_id" });
User.hasMany(Booking, { foreignKey: "tenant_id" });

// ── Contract ──────────────────────────────────────────
Contract.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Contract.belongsTo(User, { foreignKey: "tenant_id", as: "tenant" });
Contract.belongsTo(User, { foreignKey: "landlord_id", as: "landlord" });

// ── Conversation ──────────────────────────────────────
Conversation.belongsTo(User, { foreignKey: "user1_id", as: "user1" });
Conversation.belongsTo(User, { foreignKey: "user2_id", as: "user2" });
Conversation.belongsTo(Room, { foreignKey: "room_id", as: "room" });

// ── Message ───────────────────────────────────────────
Message.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
Conversation.hasMany(Message, { foreignKey: "conversation_id" });

// ── Maintenance ───────────────────────────────────────
Maintenance.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Maintenance.belongsTo(User, { foreignKey: "reported_by_id", as: "reportedBy" });

// ── Notification ──────────────────────────────────────
Notification.belongsTo(User, { foreignKey: "recipient_id", as: "recipient" });

// ── Review ────────────────────────────────────────────
Review.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Review.belongsTo(User, { foreignKey: "user_id", as: "user" });
Room.hasMany(Review, { foreignKey: "room_id" });

// Thêm _id vào toJSON output cho tất cả models (tương thích frontend)
[User, Room, Booking, Contract, Conversation, Message, Maintenance, Notification, Review].forEach(Model => {
  const orig = Model.prototype.toJSON;
  Model.prototype.toJSON = function () {
    const val = orig ? orig.call(this) : Object.assign({}, this.get());
    val._id = val.id;
    return val;
  };
});

module.exports = {
  sequelize,
  User, Room, Booking, Contract,
  Conversation, Message,
  Maintenance, Notification, Review, Wishlist,
};
