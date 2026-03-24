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
  isLocked?: boolean; // Virtual property, not stored
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
});

const Match: Model<IMatch> = models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
