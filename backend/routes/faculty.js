import express from 'express';
import Faculty from '../models/Faculty.js';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all faculty
router.get('/', protect, async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving faculty list.', error: error.message });
  }
});

// Create new faculty (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { staffId, name, shortName, phone, email, designation, role, isHOD, teachingEligibility, availability } = req.body;

  try {
    const exists = await Faculty.findOne({ $or: [{ staffId }, { phone }, { email }] });
    if (exists) {
      return res.status(400).json({ message: 'Faculty with this Staff ID, Phone, or Email already exists.' });
    }

    const faculty = new Faculty({
      staffId,
      name,
      shortName,
      phone,
      email,
      designation,
      role,
      isHOD,
      teachingEligibility,
      availability
    });

    const savedFaculty = await faculty.save();

    await AuditLog.create({
      action: 'FACULTY_CREATE',
      details: `Created faculty member: ${name} (${staffId})`,
      user: req.user.name
    });

    res.status(201).json(savedFaculty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating faculty.', error: error.message });
  }
});

// Update faculty (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { name, shortName, phone, email, designation, role, isHOD, teachingEligibility, availability, isActive } = req.body;

  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    // Role promotions (Only Super Admin can promote/demote to/from Admin/Super Admin)
    if (role && role !== faculty.role && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Only Super Admin can change faculty roles.' });
    }

    faculty.name = name ?? faculty.name;
    faculty.shortName = shortName ?? faculty.shortName;
    faculty.phone = phone ?? faculty.phone;
    faculty.email = email ?? faculty.email;
    faculty.designation = designation ?? faculty.designation;
    faculty.role = role ?? faculty.role;
    faculty.isHOD = isHOD ?? faculty.isHOD;
    faculty.teachingEligibility = teachingEligibility ?? faculty.teachingEligibility;
    faculty.availability = availability ?? faculty.availability;
    faculty.isActive = isActive ?? faculty.isActive;

    const updatedFaculty = await faculty.save();

    await AuditLog.create({
      action: 'FACULTY_UPDATE',
      details: `Updated faculty member: ${updatedFaculty.name} (${updatedFaculty.staffId})`,
      user: req.user.name
    });

    res.json(updatedFaculty);
  } catch (error) {
    res.status(500).json({ message: 'Error updating faculty.', error: error.message });
  }
});

// Promote to Admin (Super Admin only)
router.patch('/:id/promote', protect, superAdminOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found.' });
    }

    faculty.role = 'Admin';
    await faculty.save();

    await AuditLog.create({
      action: 'FACULTY_PROMOTE',
      details: `Promoted ${faculty.name} to Admin role`,
      user: req.user.name
    });

    res.json({ message: `Successfully promoted ${faculty.name} to Admin.`, faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error promoting faculty.', error: error.message });
  }
});

export default router;
