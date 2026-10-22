import express from 'express';
import Class from '../models/Class.js';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all classes
router.get('/', protect, async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classes.', error: error.message });
  }
});

// Create class (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, department, program, year, medium, type, roomNumber } = req.body;

  try {
    const exists = await Class.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Class/batch with this name already exists.' });
    }

    const cls = new Class({
      name,
      department,
      program,
      year,
      medium,
      type,
      roomNumber
    });

    const savedClass = await cls.save();

    await AuditLog.create({
      action: 'CLASS_CREATE',
      details: `Created class: ${name}`,
      user: req.user.name
    });

    res.status(201).json(savedClass);
  } catch (error) {
    res.status(500).json({ message: 'Error creating class.', error: error.message });
  }
});

// Update class (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { name, department, program, year, medium, type, roomNumber } = req.body;

  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    cls.name = name ?? cls.name;
    cls.roomNumber = roomNumber ?? cls.roomNumber;
    cls.department = department ?? cls.department;
    cls.program = program ?? cls.program;
    cls.year = year ?? cls.year;
    cls.medium = medium ?? cls.medium;
    cls.type = type ?? cls.type;

    const updatedClass = await cls.save();

    await AuditLog.create({
      action: 'CLASS_UPDATE',
      details: `Updated class: ${updatedClass.name}`,
      user: req.user.name
    });

    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: 'Error updating class.', error: error.message });
  }
});

// Delete class (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    await Class.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'CLASS_DELETE',
      details: `Deleted class: ${cls.name}`,
      user: req.user.name
    });

    res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class.', error: error.message });
  }
});

export default router;
