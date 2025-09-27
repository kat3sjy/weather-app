import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

export async function saveMessage({ roomId, senderId, text }) {
  const msg = new Message({ roomId, senderId, text });
  return await msg.save();
}

export async function getMessages(roomId, limit = 10) {
  const docs = await Message.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 10)
    .lean();
  return docs.reverse(); // chronological for UI
}

export default Message;
