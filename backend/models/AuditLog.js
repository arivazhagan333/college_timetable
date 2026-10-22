import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true,
    default: 'System'
  }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
