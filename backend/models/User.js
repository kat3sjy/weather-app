import mongoose from "mongoose";

const AvatarSchema = new mongoose.Schema(
  {
    base: { type: String, default: "" },
    hair: { type: String, default: "" },
    clothes: { type: String, default: "" }
  },
  { _id: false }
);

const SafetySchema = new mongoose.Schema(
  {
    womenOnly: { type: Boolean, default: false }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, index: true, sparse: true },
    location: { type: String, trim: true },
    tags: { type: [String], default: [] }, // interests
    bio: { type: String, default: "" },
    avatar: { type: AvatarSchema, default: () => ({}) },
    vibeTags: { type: [String], default: [] },
    safety: { type: SafetySchema, default: () => ({}) }
  },
  { timestamps: true }
);

UserSchema.index({ tags: 1 });
UserSchema.index({ vibeTags: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Helpers

export async function createUser(data) {
  const user = new User(data);
  return await user.save();
}

export async function updateUser(id, data) {
  return await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).lean();
}

export async function upsertUserByUsername(username, data) {
  return await User.findOneAndUpdate(
    { username },
    { $set: data, $setOnInsert: { username } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
}

export async function findUserById(id) {
  return await User.findById(id).lean();
}

export async function listUsers(limit = 50) {
  return await User.find({})
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 50)
    .lean();
}

function jaccard(a = [], b = []) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const v of A) if (B.has(v)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/**
 * Simple on-the-fly matching:
 * - Candidates share at least 1 interest tag with user
 * - Score = 70% tag Jaccard + 30% vibeTag Jaccard
 * - Returns [{ user, score, reasons }]
 */
export async function findMatches(userId, limit = 10) {
  const me = await User.findById(userId).lean();
  if (!me) throw new Error("User not found");

  const candidates = await User.find({
    _id: { $ne: me._id },
    tags: { $in: me.tags?.length ? me.tags : [null] }
  })
    .limit(200)
    .lean();

  const results = candidates
    .map((u) => {
      const tagScore = jaccard(me.tags, u.tags);
      const vibeScore = jaccard(me.vibeTags, u.vibeTags);
      const score = Math.round((0.7 * tagScore + 0.3 * vibeScore) * 100);

      const sharedTags = (me.tags || []).filter((t) => (u.tags || []).includes(t));
      const sharedVibes = (me.vibeTags || []).filter((t) => (u.vibeTags || []).includes(t));
      const reasons = [
        sharedTags.length ? `Both like ${sharedTags.join(", ")}` : null,
        sharedVibes.length ? `Similar vibes: ${sharedVibes.join(", ")}` : null
      ].filter(Boolean);

      return { user: u, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

export default User;
