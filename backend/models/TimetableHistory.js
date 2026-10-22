import mongoose from 'mongoose';

const historyEntrySchema = new mongoose.Schema({
  day: String,
  period: String,
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }
}, { _id: false });

const timetableHistorySchema = new mongoose.Schema({
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  schedule: [historyEntrySchema],
  user: {
    type: String,
    required: true
  },
  changes: {
    type: String,
    required: true
  }
}, { timestamps: true });

const TimetableHistory = mongoose.model('TimetableHistory', timetableHistorySchema);
export default TimetableHistory;
