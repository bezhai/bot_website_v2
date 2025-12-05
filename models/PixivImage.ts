import mongoose, { Schema, Document } from 'mongoose';

export interface MultiTag {
  name: string;
  translation?: string;
  visible?: boolean;
}

export interface IPixivImage extends Document {
  pixiv_addr: string;
  visible: boolean;
  author?: string;
  create_time: Date;
  update_time: Date;
  tos_file_name: string;
  illust_id: number;
  title?: string;
  del_flag: boolean;
  author_id?: string;
  image_key?: string;
  width?: number;
  height?: number;
  multi_tags: MultiTag[];
}

const MultiTagSchema = new Schema<MultiTag>({
  name: { type: String, required: true },
  translation: String,
  visible: Boolean,
});

const PixivImageSchema = new Schema<IPixivImage>(
  {
    pixiv_addr: { type: String, required: true, unique: true },
    visible: { type: Boolean, required: true, default: false },
    author: String,
    create_time: { type: Date, required: true, default: Date.now, immutable: true },
    update_time: { type: Date, required: true, default: Date.now },
    tos_file_name: { type: String, required: true },
    illust_id: { type: Number, required: true },
    title: String,
    del_flag: { type: Boolean, required: true, default: false },
    author_id: String,
    image_key: String,
    width: Number,
    height: Number,
    multi_tags: { type: [MultiTagSchema], default: [] },
  },
  { collection: 'img_map' }
);

PixivImageSchema.pre('save', function (next: any) {
  this.update_time = new Date();
  next();
});

export default mongoose.models.PixivImage || mongoose.model<IPixivImage>('PixivImage', PixivImageSchema);
