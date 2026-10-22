import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  shortName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    default: 'Mathematics'
  },
  designation: {
    type: String,
    default: 'Assistant Professor'
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Staff'],
    default: 'Staff'
  },
  isHOD: {
    type: Boolean,
    default: false
  },
  teachingEligibility: {
    type: [String],
    default: ['UG', 'PG'] // can contain: 'UG only', 'PG only', 'UG + PG', 'Statistics', 'Physics', etc.
  },
  // weekly availability: mapping of day to available periods (e.g. Monday: [1, 2, 3, 4, 5])
  availability: {
    type: Map,
    of: [Number],
    default: {
      'Monday': [1, 2, 3, 4, 5],
      'Tuesday': [1, 2, 3, 4, 5],
      'Wednesday': [1, 2, 3, 4, 5],
      'Thursday': [1, 2, 3, 4, 5],
      'Friday': [1, 2, 3, 4, 5],
      'Saturday': [1, 2, 3, 4, 5]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
