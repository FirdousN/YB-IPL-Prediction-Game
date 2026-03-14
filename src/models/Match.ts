import mongoose, { Schema, Model, models } from 'mongoose';

export interface IMatch {
  _id: mongoose.Types.ObjectId;
  teamA: string;
  teamB: string;
  startTime: Date;
  endTime: Date;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  question: string;
  options: string[];
  result?: string;
  venue?: string;
  group?: string;
  isLocked?: boolean; // Virtual property, not stored
}

const MatchSchema = new Schema < IMatch > ({
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
    default: 'UPCOMING'
  },
  question: { type: String, required: true, default: "Who will win?" },
  options: { type: [String], required: true }, // e.g., ["India", "Australia"]
  result: { type: String }, // Stores the winning option exact string
  venue: { type: String },
  group: { type: String },
});

const Match: Model<IMatch> = models.Match || mongoose.model < IMatch > ('Match', MatchSchema);

export default Match;
