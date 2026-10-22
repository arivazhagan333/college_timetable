import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  period: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4', 'P5'],
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Validated', 'Locked', 'Final'],
    default: 'Draft'
  },
  schedule: [timetableEntrySchema],
  version: {
    type: Number,
    default: 1
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String, // name of admin/user or 'System'
    default: 'System'
  }
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
