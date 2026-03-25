import mongoose, { Schema, Model, models } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation in Next.js hot reload
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
