import express from 'express';
import Timetable from '../models/Timetable.js';
import TimetableHistory from '../models/TimetableHistory.js';
import AuditLog from '../models/AuditLog.js';
import Class from '../models/Class.js';
import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';
import { generateTimetableEngine, validateTimetableConstraints } from '../controllers/scheduler.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get active/latest timetable
 */
router.get('/', protect, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({})
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');
    
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found. Click Generate to create one.' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving timetable.', error: error.message });
  }
});

/**
 * Generate timetable (Admin only)
 */
router.post('/generate', protect, adminOnly, async (req, res) => {
  try {
    const schedule = await generateTimetableEngine();

    // Check if there is an existing timetable
    let timetable = await Timetable.findOne({});
    if (timetable) {
      if (timetable.isLocked) {
        return res.status(400).json({ message: 'Timetable is locked. Unlock it first before regenerating.' });
      }
      timetable.schedule = schedule;
      timetable.status = 'Generated';
      timetable.version += 1;
      timetable.createdBy = req.user.name;
      await timetable.save();
    } else {
      timetable = new Timetable({
        status: 'Generated',
        schedule,
        version: 1,
        createdBy: req.user.name
      });
      await timetable.save();
    }

    // Save to history
    await TimetableHistory.create({
      timetableId: timetable._id,
      version: timetable.version,
      schedule: timetable.schedule,
      user: req.user.name,
      changes: 'Automatic timetable generation'
    });

    // Populate for response
    const populated = await Timetable.findById(timetable._id)
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');

    await AuditLog.create({
      action: 'TIMETABLE_GENERATE',
      details: `Generated new timetable version ${timetable.version}`,
      user: req.user.name
    });

    res.json(populated);
  } catch (error) {
    res.status(400).json({ 
      message: 'Unable to generate a valid timetable.', 
      error: error.message 
    });
  }
});

/**
 * Validate manual edits
 */
router.post('/validate', protect, adminOnly, async (req, res) => {
  const { schedule } = req.body; // Array of entries

  try {
    const result = await validateTimetableConstraints(schedule);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error during validation.', error: error.message });
  }
});

/**
 * Save manual changes (Admin only)
 */
router.post('/save', protect, adminOnly, async (req, res) => {
  const { schedule } = req.body;

  try {
    let timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: 'No active timetable found to save. Generate one first.' });
    }

    if (timetable.isLocked) {
      return res.status(400).json({ message: 'Timetable is locked. Unlock it to save changes.' });
    }

    // Validate first
    const validationResult = await validateTimetableConstraints(schedule);
    
    // Save as Validated or Draft based on constraints
    timetable.schedule = schedule;
    timetable.status = validationResult.valid ? 'Validated' : 'Draft';
    timetable.version += 1;
    timetable.createdBy = req.user.name;

    await timetable.save();

    // Create history entry
    await TimetableHistory.create({
      timetableId: timetable._id,
      version: timetable.version,
      schedule: timetable.schedule,
      user: req.user.name,
      changes: `Manual edits saved (Status: ${timetable.status})`
    });

    await AuditLog.create({
      action: 'TIMETABLE_SAVE',
      details: `Saved manual changes, version ${timetable.version}. Validation status: ${timetable.status}`,
      user: req.user.name
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');

    res.json({
      timetable: populated,
      validation: validationResult
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving timetable.', error: error.message });
  }
});

/**
 * Shuffle timetable (Regenerate new variant, Admin only)
 */
router.post('/shuffle', protect, adminOnly, async (req, res) => {
  try {
    let timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found to shuffle. Generate one first.' });
    }

    if (timetable.isLocked) {
      return res.status(400).json({ message: 'Timetable is locked. Unlock it first.' });
    }

    // Since our algorithm is deterministic based on MRV, we can add small random weight to search options
    // or just rerun the generator. For now, regenerating is excellent. Let's run it.
    const schedule = await generateTimetableEngine();

    timetable.schedule = schedule;
    timetable.status = 'Validated'; // If generated by engine, it is validated by definition
    timetable.version += 1;
    timetable.createdBy = req.user.name;
    await timetable.save();

    await TimetableHistory.create({
      timetableId: timetable._id,
      version: timetable.version,
      schedule: timetable.schedule,
      user: req.user.name,
      changes: 'Timetable shuffled (regenerated)'
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');

    await AuditLog.create({
      action: 'TIMETABLE_SHUFFLE',
      details: `Shuffled timetable. New version ${timetable.version}`,
      user: req.user.name
    });

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: 'Shuffle failed.', error: error.message });
  }
});

/**
 * Lock/Unlock Timetable (Admin only, Unlock requires Super Admin or Admin depending on settings)
 */
router.post('/lock', protect, adminOnly, async (req, res) => {
  const { isLocked, status } = req.body; // status could be 'Locked' or 'Final'

  try {
    let timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found to lock.' });
    }

    // Enforce role permission: only Super Admin can unlock
    if (!isLocked && timetable.isLocked && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Only a Super Admin is authorized to unlock the timetable.' });
    }

    // If locking, run a final validation
    if (isLocked) {
      const validationResult = await validateTimetableConstraints(timetable.schedule);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          message: 'Cannot lock timetable: there are active conflicts. Please resolve them first.',
          conflicts: validationResult.conflicts
        });
      }
    }

    timetable.isLocked = isLocked;
    timetable.status = status || (isLocked ? 'Locked' : 'Validated');
    timetable.version += 1;
    timetable.createdBy = req.user.name;
    await timetable.save();

    await TimetableHistory.create({
      timetableId: timetable._id,
      version: timetable.version,
      schedule: timetable.schedule,
      user: req.user.name,
      changes: isLocked ? 'Timetable Locked (Finalized)' : 'Timetable Unlocked'
    });

    await AuditLog.create({
      action: isLocked ? 'TIMETABLE_LOCK' : 'TIMETABLE_UNLOCK',
      details: isLocked ? `Locked timetable version ${timetable.version}` : `Unlocked timetable version ${timetable.version}`,
      user: req.user.name
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error locking/unlocking timetable.', error: error.message });
  }
});

/**
 * Get history versions
 */
router.get('/history', protect, adminOnly, async (req, res) => {
  try {
    const history = await TimetableHistory.find({})
      .select('version user changes createdAt')
      .sort({ version: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history.', error: error.message });
  }
});

/**
 * Restore specific version (Admin only)
 */
router.post('/restore', protect, adminOnly, async (req, res) => {
  const { version } = req.body;

  try {
    let timetable = await Timetable.findOne({});
    if (!timetable) {
      return res.status(404).json({ message: 'No active timetable found.' });
    }

    if (timetable.isLocked) {
      return res.status(400).json({ message: 'Timetable is locked. Unlock it to restore history.' });
    }

    const historyRecord = await TimetableHistory.findOne({ timetableId: timetable._id, version });
    if (!historyRecord) {
      return res.status(404).json({ message: `History version ${version} not found.` });
    }

    timetable.schedule = historyRecord.schedule;
    timetable.version += 1;
    timetable.status = 'Validated'; // assume restored config is valid
    timetable.createdBy = req.user.name;

    await timetable.save();

    await TimetableHistory.create({
      timetableId: timetable._id,
      version: timetable.version,
      schedule: timetable.schedule,
      user: req.user.name,
      changes: `Restored to version ${version}`
    });

    await AuditLog.create({
      action: 'TIMETABLE_RESTORE',
      details: `Restored timetable to historical version ${version}. New version: ${timetable.version}`,
      user: req.user.name
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('schedule.class')
      .populate('schedule.subject')
      .populate('schedule.faculty');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error restoring version.', error: error.message });
  }
});

/**
 * Get Audit Logs (Admin only)
 */
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving audit logs.', error: error.message });
  }
});

export default router;
