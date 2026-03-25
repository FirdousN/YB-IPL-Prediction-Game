import mongoose, { Schema, Model, models } from 'mongoose';

export interface IMatchQuestion {
  _id?: mongoose.Types.ObjectId;
  text: string;
  type: 'OPTIONS' | 'TEXT';
  options?: string[]; // Used if type is OPTIONS
  result?: string; // Correct answer
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
  createdAt: Date;
}

const MatchQuestionSchema = new Schema<IMatchQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: ['OPTIONS', 'TEXT'], default: 'TEXT' },
  options: { type: [String] },
  result: { type: String },
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
});

const Match: Model<IMatch> = models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
