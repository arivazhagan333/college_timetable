import express from 'express';
import Setting from '../models/Setting.js';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all settings
router.get('/', protect, async (req, res) => {
  try {
    const settings = await Setting.find({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving settings.', error: error.message });
  }
});

// Update setting (Admin only)
router.put('/', protect, adminOnly, async (req, res) => {
  const { key, value } = req.body;

  try {
    const setting = await Setting.findOne({ key });
    if (!setting) {
      return res.status(404).json({ message: `Setting "${key}" not found.` });
    }

    const oldValue = setting.value;
    setting.value = value;
    await setting.save();

    await AuditLog.create({
      action: 'SETTING_UPDATE',
      details: `Updated setting ${key} from ${JSON.stringify(oldValue)} to ${JSON.stringify(value)}`,
      user: req.user.name
    });

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error updating setting.', error: error.message });
  }
});

export default router;
