import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    // Note: Course codes might not be unique if the same code is used across different mediums, but let's make it indexable
  },
  name: {
    type: String,
    required: true
  },
  weeklyHours: {
    type: Number,
    required: true,
    default: 4
  },
  medium: {
    type: String,
    enum: ['E/M', 'T/M', 'Other'],
    default: 'E/M'
  },
  category: {
    type: String,
    enum: ['UG', 'PG', 'Allied'],
    default: 'UG'
  },
  department: {
    type: String,
    default: 'Mathematics'
  }
}, { timestamps: true });

// Compound index to ensure uniqueness per subject-medium combination if desired, or courseCode + medium
subjectSchema.index({ courseCode: 1, name: 1, medium: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
