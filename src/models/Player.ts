import mongoose, { Schema, Model, models } from 'mongoose';

export interface IPlayer {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: string; // 'Batsman', 'Bowler', 'All-rounder', 'WK-Batsman', etc.
  team: mongoose.Types.ObjectId; // Reference to Team
  apiId?: string; // External API ID (e.g., from cricketdata.org)
  battingStyle?: string;
  bowlingStyle?: string;
  country?: string;
  imgUrl?: string;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  name: { type: String, required: true },
  role: { type: String, required: true, default: 'Batsman' },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  apiId: { type: String, unique: true, sparse: true },
  battingStyle: { type: String },
  bowlingStyle: { type: String },
  country: { type: String },
  imgUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Index for quick search by team
PlayerSchema.index({ team: 1 });
PlayerSchema.index({ name: 'text' });

const Player: Model<IPlayer> = models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
