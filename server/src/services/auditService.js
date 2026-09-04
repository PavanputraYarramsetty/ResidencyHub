/**
 * Audit Logging Service
 * Records actions: who changed what, when, entity type, and old/new snapshots.
 */
const { auditLogs, generateUuid } = require('./datastore');

function logAction({ userId, userRole = 'owner', action, entityType, entityId, oldData = null, newData = null }) {
  const logEntry = {
    id: generateUuid(),
    user_id: userId || '00000000-0000-0000-0000-000000000002',
    user_role: userRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    created_at: new Date().toISOString(),
  };

  auditLogs.unshift(logEntry);
  return logEntry;
}

function getAuditLogs({ limit = 50, entityType = null } = {}) {
  let logs = [...auditLogs];
  if (entityType) {
    logs = logs.filter((l) => l.entity_type === entityType);
  }
  return logs.slice(0, limit);
}

module.exports = { logAction, getAuditLogs };
