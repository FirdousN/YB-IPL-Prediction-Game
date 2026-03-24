import mongoose, { Schema, Model, models } from 'mongoose';

export interface ITeam {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  logoUrl?: string;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, unique: true },
  shortName: { type: String, required: true, uppercase: true },
  logoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Team: Model<ITeam> = models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
