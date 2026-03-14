import mongoose, { Schema, Model, models } from 'mongoose';

export interface IParticipant {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  phoneVerified: boolean;
  authProvider: string;
  hasSpun: boolean;
  termsAgreed: boolean;
  ipAddress: string;
  loginHistory: Array<{ ip: string; timestamp: Date }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    authProvider: { type: String, default: 'phone' },
    hasSpun: { type: Boolean, default: false },
    termsAgreed: { type: Boolean, default: false },
    ipAddress: { type: String, default: 'unknown' },
    loginHistory: [
      {
        ip: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Prevent model recompilation in Next.js hot reload
const Participant: Model<IParticipant> = models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema);

export default Participant;
