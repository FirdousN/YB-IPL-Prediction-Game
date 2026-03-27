import mongoose, { Schema, Model, models } from 'mongoose';

export interface IMatchQuestion {
  _id?: mongoose.Types.ObjectId;
  text: string;
  type: 'OPTIONS' | 'TEXT';
  options?: string[]; // Used if type is OPTIONS
  result?: string; // Correct answer
  points?: number;
  ruleType?: 'EXACT' | 'NEAREST';
  maxRange?: number;
  unit?: 'RUNS' | 'PLAYER' | 'TEAM' | 'WICKETS' | 'BOUNDARIES' | 'OVERS' | 'NONE';
}

export interface IMatch {
  _id: mongoose.Types.ObjectId;
  teamA: mongoose.Types.ObjectId;
  teamB: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  questions: IMatchQuestion[];
  venue?: string;
  group?: string;
  result?: string;
  winner?: mongoose.Types.ObjectId;
  teamAScore?: { r?: number; w?: number; o?: string };
  teamBScore?: { r?: number; w?: number; o?: string };
  players?: string[]; // Array of player names for dropdowns
  createdAt: Date;
  isArchived: boolean;
}

const MatchQuestionSchema = new Schema<IMatchQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: ['OPTIONS', 'TEXT'], default: 'TEXT' },
  options: { type: [String] },
  result: { type: String },
  points: { type: Number, default: 20 },
  ruleType: { type: String, enum: ['EXACT', 'NEAREST'], default: 'EXACT' },
  maxRange: { type: Number, default: 30 },
  unit: { type: String, enum: ['RUNS', 'PLAYER', 'TEAM', 'WICKETS', 'BOUNDARIES', 'OVERS', 'NONE'], default: 'NONE' },
});

const MatchSchema = new Schema<IMatch>({
  teamA: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  teamB: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
    default: 'UPCOMING'
  },
  questions: { type: [MatchQuestionSchema], default: [] },
  venue: { type: String },
  group: { type: String },
  result: { type: String }, // e.g., "RCB won by 5 runs"
  winner: { type: Schema.Types.ObjectId, ref: 'Team' },
  teamAScore: {
    r: { type: Number }, // runs
    w: { type: Number }, // wickets
    o: { type: String }, // overs
  },
  teamBScore: {
    r: { type: Number },
    w: { type: Number },
    o: { type: String },
  },
  players: { type: [String], default: [] },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Optimize query performance for high traffic
MatchSchema.index({ startTime: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ isArchived: 1 });

const Match: Model<IMatch> = models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
