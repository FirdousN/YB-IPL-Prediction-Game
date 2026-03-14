import mongoose, { Schema, Model, models } from 'mongoose';

export interface IPrediction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  selectedOption: string;
  predictedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  selectedOption: { type: String, required: true },
  predictedAt: { type: Date, default: Date.now },
});

// Compound index to ensure one prediction per user per match
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

const Prediction: Model<IPrediction> = models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);

export default Prediction;
