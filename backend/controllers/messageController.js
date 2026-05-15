const { Op } = require("sequelize");
const { Conversation, Message, User, Room } = require("../models/index");

const USER_ATTRS = ["id", "name", "email", "role"];

const buildParticipants = (conv) => {
  const p = [];
  if (conv.user1) p.push(conv.user1.toJSON ? conv.user1.toJSON() : conv.user1);
  if (conv.user2) p.push(conv.user2.toJSON ? conv.user2.toJSON() : conv.user2);
  return p;
};

const CONV_INCLUDE = [
  { model: User, as: "user1", attributes: USER_ATTRS },
  { model: User, as: "user2", attributes: USER_ATTRS },
  { model: Room, as: "room", attributes: ["id", "title", "images", "price"] },
];

exports.getConversations = async (req, res) => {
  try {
    const myId = req.user.id;
    const conversations = await Conversation.findAll({
      where: { [Op.or]: [{ user1Id: myId }, { user2Id: myId }] },
      include: CONV_INCLUDE,
      order: [["lastMessageAt", "DESC"]],
    });
    const result = conversations.map(c => ({
      ...c.toJSON(),
      participants: buildParticipants(c),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    const myId = req.user.id;
    const otherId = Number(userId);

    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1Id: myId, user2Id: otherId },
          { user1Id: otherId, user2Id: myId },
        ],
      },
      include: CONV_INCLUDE,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        user1Id: myId,
        user2Id: otherId,
        room_id: roomId || null,
      });
      conversation = await Conversation.findByPk(conversation.id, { include: CONV_INCLUDE });
    }

    res.json({ ...conversation.toJSON(), participants: buildParticipants(conversation) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { conversation_id: req.params.id },
      include: [{ model: User, as: "sender", attributes: ["id", "name", "role"] }],
      order: [["created_at", "ASC"]],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const myId = req.user.id; 
    
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung không được trống" });

    const message = await Message.create({
      conversation_id: req.params.id,
      sender_id: myId,
      content: content.trim(),
    });

    await Conversation.update(
      { lastMessage: content.trim(), lastMessageAt: new Date() },
      { where: { id: req.params.id } }
    );

    const populated = await Message.findByPk(message.id, {
      include: [{ model: User, as: "sender", attributes: ["id", "name", "role"] }],
    });

    const conversation = await Conversation.findByPk(req.params.id);
    if (conversation) {
      const io = req.app.get("io");
      const payload = { ...populated.toJSON(), conversationId: req.params.id };

      const receiverId = String(conversation.user1Id) === String(myId) 
                         ? conversation.user2Id 
                         : conversation.user1Id;


      io.to(`user_${receiverId}`).emit("new_message", payload);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.readConversation = async (req, res) => {
  res.json({ message: "OK" });
};
