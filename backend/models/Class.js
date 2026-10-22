import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    default: 'Mathematics'
  },
  program: {
    type: String,
    default: 'B.Sc Mathematics' // B.Sc Mathematics, M.Sc Mathematics, Allied, BCA, MCA, M.Sc CS, etc.
  },
  year: {
    type: String, // I, II, III or Allied/Other
    required: true
  },
  medium: {
    type: String,
    enum: ['English', 'Tamil', 'Other'],
    default: 'English'
  },
  type: {
    type: String,
    enum: ['Primary', 'Allied', 'Cross-department', 'Course-specific'],
    default: 'Primary'
  },
  roomNumber: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
export default Class;
