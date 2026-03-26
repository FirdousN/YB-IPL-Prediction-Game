import mongoose, { Schema, Model, models } from 'mongoose';

export interface IPredictionAnswer {
  questionId: mongoose.Types.ObjectId;
  value: string;
  points?: number;
}

export interface IPrediction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  answers: IPredictionAnswer[];
  predictedAt: Date;
  totalPoints?: number;
  isWinner?: boolean;
  rank?: number;
}

const PredictionAnswerSchema = new Schema<IPredictionAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  value: { type: String, required: true },
  points: { type: Number, default: 0 },
});

const PredictionSchema = new Schema<IPrediction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  answers: { type: [PredictionAnswerSchema], required: true },
  predictedAt: { type: Date, default: Date.now },
  totalPoints: { type: Number, default: 0 },
  isWinner: { type: Boolean, default: false },
  rank: { type: Number },
}, { timestamps: true });

// Compound index to ensure one prediction per user per match
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
PredictionSchema.index({ matchId: 1, totalPoints: -1 });

const Prediction: Model<IPrediction> = models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);

export default Prediction;
