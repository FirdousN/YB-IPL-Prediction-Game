import mongoose, { Schema, Document } from 'mongoose';

export interface IDefaultQuestion extends Document {
  text: string;
  type: 'OPTIONS' | 'TEXT';
  options: string[];
  points: number;
  ruleType: 'EXACT' | 'NEAREST';
  unit: 'RUNS' | 'PLAYER' | 'TEAM' | 'WICKETS' | 'BOUNDARIES' | 'OVERS' | 'NONE';
  maxRange?: number;
  order: number;
  isActive: boolean;
}

const DefaultQuestionSchema: Schema = new Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['OPTIONS', 'TEXT'], required: true },
  options: { type: [String], default: [] },
  points: { type: Number, default: 20, required: true },
  ruleType: { type: String, enum: ['EXACT', 'NEAREST'], default: 'EXACT', required: true },
  unit: { type: String, enum: ['RUNS', 'PLAYER', 'TEAM', 'WICKETS', 'BOUNDARIES', 'OVERS', 'NONE'], default: 'NONE', required: true },
  maxRange: { type: Number },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

DefaultQuestionSchema.index({ order: 1 });

export default mongoose.models.DefaultQuestion ||
  mongoose.model<IDefaultQuestion>('DefaultQuestion', DefaultQuestionSchema);