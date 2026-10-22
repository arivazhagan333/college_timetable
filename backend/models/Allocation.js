import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  weeklyHours: {
    type: Number,
    required: true,
    min: 1
  }
}, { timestamps: true });

// Ensure a unique mapping of faculty, subject and class
allocationSchema.index({ faculty: 1, subject: 1, class: 1 }, { unique: true });

const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
