import express from 'express';
import Allocation from '../models/Allocation.js';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all allocations (populated)
router.get('/', protect, async (req, res) => {
  try {
    const allocations = await Allocation.find({})
      .populate('faculty')
      .populate('subject')
      .populate('class');
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving allocations.', error: error.message });
  }
});

// Create allocation (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { faculty, subject, class: classId, weeklyHours } = req.body;

  try {
    const exists = await Allocation.findOne({ faculty, subject, class: classId });
    if (exists) {
      return res.status(400).json({ message: 'This Faculty-Subject-Class allocation already exists.' });
    }

    const allocation = new Allocation({
      faculty,
      subject,
      class: classId,
      weeklyHours
    });

    const savedAllocation = await allocation.save();

    // Populate for response
    const populated = await Allocation.findById(savedAllocation._id)
      .populate('faculty')
      .populate('subject')
      .populate('class');

    await AuditLog.create({
      action: 'ALLOCATION_CREATE',
      details: `Created allocation: ${populated.faculty?.name} -> ${populated.subject?.name} in ${populated.class?.name} (${weeklyHours} hrs)`,
      user: req.user.name
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error creating allocation.', error: error.message });
  }
});

// Update allocation (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { faculty, subject, class: classId, weeklyHours } = req.body;

  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    allocation.faculty = faculty ?? allocation.faculty;
    allocation.subject = subject ?? allocation.subject;
    allocation.class = classId ?? allocation.class;
    allocation.weeklyHours = weeklyHours ?? allocation.weeklyHours;

    const savedAllocation = await allocation.save();
    
    const populated = await Allocation.findById(savedAllocation._id)
      .populate('faculty')
      .populate('subject')
      .populate('class');

    await AuditLog.create({
      action: 'ALLOCATION_UPDATE',
      details: `Updated allocation: ${populated.faculty?.name} -> ${populated.subject?.name} in ${populated.class?.name} (${weeklyHours} hrs)`,
      user: req.user.name
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating allocation.', error: error.message });
  }
});

// Delete allocation (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('faculty')
      .populate('subject')
      .populate('class');
      
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    await Allocation.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'ALLOCATION_DELETE',
      details: `Deleted allocation: ${allocation.faculty?.name} -> ${allocation.subject?.name} in ${allocation.class?.name}`,
      user: req.user.name
    });

    res.json({ message: 'Allocation deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting allocation.', error: error.message });
  }
});

export default router;
