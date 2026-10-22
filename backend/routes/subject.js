import express from 'express';
import Subject from '../models/Subject.js';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all subjects
router.get('/', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving subjects.', error: error.message });
  }
});

// Create subject (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { courseCode, name, weeklyHours, medium, category, department } = req.body;

  try {
    const exists = await Subject.findOne({ courseCode, name, medium });
    if (exists) {
      return res.status(400).json({ message: 'Subject with this code, name and medium already exists.' });
    }

    const subject = new Subject({
      courseCode,
      name,
      weeklyHours,
      medium,
      category,
      department
    });

    const savedSubject = await subject.save();

    await AuditLog.create({
      action: 'SUBJECT_CREATE',
      details: `Created subject: ${name} (${courseCode})`,
      user: req.user.name
    });

    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subject.', error: error.message });
  }
});

// Update subject (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { courseCode, name, weeklyHours, medium, category, department } = req.body;

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    subject.courseCode = courseCode ?? subject.courseCode;
    subject.name = name ?? subject.name;
    subject.weeklyHours = weeklyHours ?? subject.weeklyHours;
    subject.medium = medium ?? subject.medium;
    subject.category = category ?? subject.category;
    subject.department = department ?? subject.department;

    const updatedSubject = await subject.save();

    await AuditLog.create({
      action: 'SUBJECT_UPDATE',
      details: `Updated subject: ${updatedSubject.name} (${updatedSubject.courseCode})`,
      user: req.user.name
    });

    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subject.', error: error.message });
  }
});

// Delete/deactivate subject (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    await Subject.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'SUBJECT_DELETE',
      details: `Deleted subject: ${subject.name} (${subject.courseCode})`,
      user: req.user.name
    });

    res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject.', error: error.message });
  }
});

export default router;
