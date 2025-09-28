import mongoose from 'mongoose';

// ...existing code...
const UserSchema = new mongoose.Schema(
  {},
  { strict: false, collection: 'users', timestamps: false }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Helpers expected by routes (schema-less, safe defaults)
async function createUser(data) {
  const doc = new User(data || {});
  return await doc.save();
}

async function updateUser(id, update) {
  return await User.findByIdAndUpdate(id, update || {}, { new: true, lean: true });
}

async function upsertUserByUsername(username, data = {}) {
  if (!username) throw new Error('username is required for upsertUserByUsername');
  return await User.findOneAndUpdate(
    { username },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true, lean: true }
  );
}

async function findUserById(id) {
  return await User.findById(id).lean();
}

async function listUsers(filter = {}, { limit = 50, skip = 0 } = {}) {
  return await User.find(filter).skip(skip).limit(Math.max(1, Math.min(200, limit))).lean();
}

export default User;
export { createUser, updateUser, upsertUserByUsername, findUserById, listUsers };
