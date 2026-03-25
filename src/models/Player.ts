import mongoose, { Schema, Model, models } from 'mongoose';

export interface IPlayer {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'WK-Batsman';
  team: mongoose.Types.ObjectId;
  imgUrl?: string;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Batsman', 'Bowler', 'All-rounder', 'WK-Batsman'], 
    default: 'Batsman' 
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  imgUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Player: Model<IPlayer> = models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
