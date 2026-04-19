import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  type: 'upload' | 'url';
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    url: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    thumbnail: {
      type: String,
    },
    duration: {
      type: Number,
    },
    type: {
      type: String,
      enum: ['upload', 'url'],
      default: 'url',
    },
  },
  {
    timestamps: true,
  }
);

VideoSchema.index({ storeId: 1 });
VideoSchema.index({ storeId: 1, createdAt: -1 });

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);

export default Video;
