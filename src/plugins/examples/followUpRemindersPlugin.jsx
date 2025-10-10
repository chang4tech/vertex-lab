import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../../contexts/ThemeContext';

const STORAGE_KEY = 'plugin_followUpReminders_v1';

const listeners = new Set();
let reminderState = null;

const sanitizeReminderMap = (value, knownNodeIds) => {
  if (!value || typeof value !== 'object') return {};
  const result = {};
  const allow = Array.isArray(knownNodeIds) && knownNodeIds.length > 0
    ? new Set(knownNodeIds.map((id) => String(id)))
    : null;
  Object.entries(value).forEach(([nodeKey, reminder]) => {
    if (!nodeKey || !reminder || typeof reminder !== 'object') return;
    const strKey = String(nodeKey);
    if (allow && !allow.has(strKey)) return;
    const { dueAt, note, createdAt, nodeId } = reminder;
    if (!dueAt) return;
    const ts = Date.parse(dueAt);
    if (Number.isNaN(ts)) return;
    if (allow && !allow.has(String(nodeId ?? nodeKey))) return;
    result[strKey] = {
      nodeId: strKey,
      dueAt: new Date(ts).toISOString(),
      note: typeof note === 'string' ? note : '',
      createdAt: Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : new Date(createdAt).toISOString(),
    };
  });
  return result;
};

const loadReminderState = (knownNodeIds) => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage?.getItem?.(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return sanitizeReminderMap(parsed, knownNodeIds);
  } catch (error) {
    console.warn('[followUpReminders] Failed to parse storage', error);
    return {};
  }
};

const persistReminderState = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('[followUpReminders] Failed to persist storage', error);
  }
};

const getReminderState = (knownNodeIds) => {
  if (reminderState === null) {
    reminderState = loadReminderState(knownNodeIds);
  }
  return reminderState;
};

const setReminderState = (next, knownNodeIds) => {
  reminderState = sanitizeReminderMap(next, knownNodeIds);
  persistReminderState(reminderState);
  listeners.forEach((listener) => {
    try {
      listener(reminderState);
    } catch (err) {
      console.error('[followUpReminders] Listener failed', err);
    }
  });
};

const updateReminderState = (updater, knownNodeIds) => {
  const current = getReminderState(knownNodeIds);
  const next = typeof updater === 'function' ? updater({ ...current }) : updater;
  setReminderState(next || {}, knownNodeIds);
};

const subscribeToReminders = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getNodeKey = (node) => {
  if (!node) return '';
  return node.title || node.name || node.label || `#${node.id}`;
};

const formatForInput = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

const parseDateInput = (value) => {
  if (!value) return null;
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return null;
  return new Date(asDate.getTime());
};

const filterRemindersForNodes = (reminders, nodes = []) => {
  if (!reminders || typeof reminders !== 'object') return {};
  const nodeIds = new Set(nodes.map((node) => (node?.id != null ? String(node.id) : null)).filter(Boolean));
  const filtered = {};
  Object.entries(reminders).forEach(([nodeId, reminder]) => {
    const key = String(nodeId);
    if (nodeIds.has(key)) {
      filtered[key] = { ...reminder, nodeId: key };
    }
  });
  return filtered;
};

const REMINDER_STATUS = {
  OVERDUE: 'overdue',
  UPCOMING: 'upcoming',
  FUTURE: 'future',
};

const getReminderStatus = (dueAt, now = Date.now()) => {
  if (!dueAt) return REMINDER_STATUS.FUTURE;
  const dueTime = Date.parse(dueAt);
  if (Number.isNaN(dueTime)) return REMINDER_STATUS.FUTURE;
  const diff = dueTime - now;
  if (diff <= 0) return REMINDER_STATUS.OVERDUE;
  if (diff <= 24 * 60 * 60 * 1000) return REMINDER_STATUS.UPCOMING;
  return REMINDER_STATUS.FUTURE;
};

const useReminderStore = (nodes = []) => {
  const nodeKey = React.useMemo(() => nodes.map((node) => node?.id).filter(Boolean).sort().join(','), [nodes]);
  const nodeIds = React.useMemo(() => nodes.map((node) => node?.id).filter((id) => id != null), [nodeKey, nodes]);
  const [reminders, setReminders] = React.useState(() => filterRemindersForNodes(getReminderState(nodeIds), nodes));

  React.useEffect(() => {
    return subscribeToReminders((next) => {
      setReminders(filterRemindersForNodes(next, nodes));
    });
  }, [nodeKey, nodes]);

  React.useEffect(() => {
    const current = getReminderState(nodeIds);
    const filtered = filterRemindersForNodes(current, nodes);
    if (Object.keys(filtered).length !== Object.keys(current).length) {
      setReminderState(filtered, nodeIds);
      setReminders(filtered);
    }
  }, [nodeKey, nodes, nodeIds]);

  const update = React.useCallback((updater) => {
    updateReminderState((prev) => {
      const scoped = filterRemindersForNodes(prev, nodes);
      const next = typeof updater === 'function' ? updater({ ...scoped }) : updater;
      const prepared = filterRemindersForNodes(next || {}, nodes);
      return prepared;
    }, nodeIds);
  }, [nodeKey, nodes, nodeIds]);

  return [reminders, update];
};

function ReminderPanel({ appApi }) {
  const { currentTheme } = useTheme();
  const intl = useIntl();
  const nodes = Array.isArray(appApi?.nodes) ? appApi.nodes : [];
  const selectedIds = Array.isArray(appApi?.selectedNodeIds) ? appApi.selectedNodeIds : [];
  const selectedId = selectedIds[0] ?? null;
  const selectedNode = nodes.find((node) => String(node?.id) === String(selectedId)) || null;
  const [reminders, setReminders] = useReminderStore(nodes);
  const existingReminder = selectedId != null ? reminders[String(selectedId)] : null;
  const [dueInput, setDueInput] = React.useState(() => formatForInput(existingReminder?.dueAt));
  const [noteInput, setNoteInput] = React.useState(existingReminder?.note ?? '');
  const [status, setStatus] = React.useState(null);
  const findNodeById = React.useCallback(
    (id) => nodes.find((node) => String(node?.id) === String(id)) || null,
    [nodes]
  );
  const logEvent = React.useCallback(
    (id, defaultMessage, values = {}, level = 'info') => {
      if (!appApi?.plugin?.log) return;
      const message = intl.formatMessage({ id, defaultMessage }, values);
      appApi.plugin.log(message, level);
    },
    [appApi, intl]
  );
  const showStatus = React.useCallback((type, messageId, defaultMessage, values = {}) => {
    setStatus({ type, messageId, defaultMessage, values, key: Date.now() });
  }, []);

  React.useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(null), 3200);
    return () => clearTimeout(timer);
  }, [status]);

  React.useEffect(() => {
    const reminder = selectedId != null ? reminders[String(selectedId)] : null;
    setDueInput(formatForInput(reminder?.dueAt));
    setNoteInput(reminder?.note ?? '');
  }, [selectedId, reminders]);

  const handleSave = React.useCallback(() => {
    if (!selectedId) return;
    const parsed = parseDateInput(dueInput);
    if (!parsed) {
      alert(intl.formatMessage({ id: 'plugin.followUpReminders.invalidDate', defaultMessage: 'Enter a valid follow-up date and time.' }));
      logEvent(
        'plugin.followUpReminders.log.invalid',
        'Skipped reminder save for {name}: invalid date.',
        { name: getNodeKey(findNodeById(selectedId)) },
        'warn'
      );
      showStatus(
        'error',
        'plugin.followUpReminders.statusInvalid',
        'Enter a valid follow-up date before saving.',
        { name: getNodeKey(findNodeById(selectedId)) }
      );
      return;
    }
    const iso = parsed.toISOString();
    const key = String(selectedId);
    setReminders((prev) => ({
      ...prev,
      [key]: {
        nodeId: key,
        dueAt: iso,
        note: noteInput.trim(),
        createdAt: prev[key]?.createdAt ?? new Date().toISOString(),
      },
    }));
    const node = findNodeById(selectedId);
    logEvent(
      'plugin.followUpReminders.log.saved',
      'Saved reminder for {name} due {date}.',
      {
        name: getNodeKey(node),
        date: intl.formatDate(parsed, { dateStyle: 'medium', timeStyle: 'short' }),
      }
    );
    showStatus(
      'success',
      'plugin.followUpReminders.statusSaved',
      'Reminder saved.',
      { name: getNodeKey(node) }
    );
  }, [dueInput, noteInput, selectedId, intl, setReminders, logEvent, findNodeById, showStatus]);

  const handleClear = React.useCallback((targetId) => {
    const nodeIdToRemove = targetId ?? selectedId;
    if (!nodeIdToRemove) return;
    const key = String(nodeIdToRemove);
    setReminders((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    const node = findNodeById(nodeIdToRemove);
    logEvent(
      'plugin.followUpReminders.log.cleared',
      'Cleared reminder for {name}.',
      { name: getNodeKey(node) }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusCleared',
      'Reminder cleared.',
      { name: getNodeKey(node) }
    );
  }, [selectedId, setReminders, logEvent, findNodeById, showStatus]);

  const now = Date.now();
  const sortedReminders = React.useMemo(() => {
    const entries = Object.values(reminders || {});
    return entries
      .map((reminder) => {
        const node = nodes.find((n) => n?.id === reminder.nodeId) || null;
        return {
          ...reminder,
          node,
          status: getReminderStatus(reminder.dueAt, now),
        };
      })
      .filter((entry) => entry.node)
      .sort((a, b) => {
        const aTime = Date.parse(a.dueAt);
        const bTime = Date.parse(b.dueAt);
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
        return aTime - bTime;
      });
  }, [reminders, nodes, now]);

  const dueSoonIds = sortedReminders
    .filter((entry) => entry.status === REMINDER_STATUS.OVERDUE || entry.status === REMINDER_STATUS.UPCOMING)
    .map((entry) => entry.nodeId);

  const handleBulkSelect = React.useCallback(() => {
    if (!appApi?.selectNodes || dueSoonIds.length === 0) return;
    appApi.selectNodes(dueSoonIds, { center: true });
    logEvent(
      'plugin.followUpReminders.log.selectDue',
      'Selected {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonIds.length }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusSelected',
      'Selected {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonIds.length }
    );
  }, [appApi, dueSoonIds, logEvent, showStatus]);

  const handleSelectNode = React.useCallback((nodeId) => {
    if (!nodeId || !appApi?.selectNode) return;
    appApi.selectNode(nodeId, { center: true });
    const node = findNodeById(nodeId);
    logEvent(
      'plugin.followUpReminders.log.focus',
      'Focused reminder node {name}.',
      { name: getNodeKey(node) }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusFocused',
      'Focused {name}.',
      { name: getNodeKey(node) }
    );
  }, [appApi, findNodeById, logEvent, showStatus]);

  const handleHighlightDue = React.useCallback(() => {
    if (!appApi?.onHighlightNodes) return;
    appApi.onHighlightNodes(dueSoonIds);
    logEvent(
      'plugin.followUpReminders.log.highlightDue',
      'Highlighted {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonIds.length }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusHighlighted',
      'Highlighted {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonIds.length }
    );
  }, [appApi, dueSoonIds, logEvent, showStatus]);

  const panelStyle = {
    width: 320,
    background: currentTheme.colors.panelBackground,
    color: currentTheme.colors.primaryText,
    border: `1px solid ${currentTheme.colors.panelBorder}`,
    borderRadius: 12,
    boxShadow: `0 12px 24px ${currentTheme.colors.panelShadow}`,
    padding: 16,
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const buttonStyle = {
    borderRadius: 6,
    padding: '8px 12px',
    border: `1px solid ${currentTheme.colors.inputBorder}`,
    background: currentTheme.colors.menuBackground,
    color: currentTheme.colors.primaryText,
    cursor: 'pointer',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    borderColor: currentTheme.colors.primaryButton,
    background: currentTheme.colors.primaryButton,
    color: currentTheme.colors.primaryButtonText,
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>
          <FormattedMessage id="plugin.followUpReminders.title" defaultMessage="Follow-up Reminders" />
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleHighlightDue}
            style={{
              ...buttonStyle,
              cursor: dueSoonIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: dueSoonIds.length === 0 ? 0.6 : 1,
            }}
            disabled={dueSoonIds.length === 0}
          >
            <FormattedMessage id="plugin.followUpReminders.highlightDue" defaultMessage="Highlight due" />
          </button>
          <button
            type="button"
            onClick={handleBulkSelect}
            style={{
              ...buttonStyle,
              cursor: dueSoonIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: dueSoonIds.length === 0 ? 0.6 : 1,
            }}
            disabled={dueSoonIds.length === 0}
          >
            <FormattedMessage id="plugin.followUpReminders.selectDue" defaultMessage="Select due" />
          </button>
        </div>
      </div>

      {status && (
        <div
          key={status.key}
          style={{
            borderRadius: 8,
            padding: '8px 12px',
            border: `1px solid ${status.type === 'error' ? currentTheme.colors.error : status.type === 'success' ? currentTheme.colors.success : currentTheme.colors.info}`,
            background: currentTheme.colors.menuBackground,
            color: status.type === 'error' ? currentTheme.colors.error : status.type === 'success' ? currentTheme.colors.success : currentTheme.colors.info,
            fontSize: 13,
          }}
        >
          <FormattedMessage
            id={status.messageId}
            defaultMessage={status.defaultMessage}
            values={status.values}
          />
        </div>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: currentTheme.colors.secondaryText }}>
          {selectedNode ? (
            <FormattedMessage
              id="plugin.followUpReminders.currentNode"
              defaultMessage="Reminder for: {name}"
              values={{ name: getNodeKey(selectedNode) }}
            />
          ) : (
            <FormattedMessage id="plugin.followUpReminders.noNode" defaultMessage="Select a node to schedule follow-up." />
          )}
        </h4>
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span><FormattedMessage id="plugin.followUpReminders.dueLabel" defaultMessage="Follow-up date" /></span>
              <input
                type="datetime-local"
                value={dueInput}
                onChange={(event) => setDueInput(event.target.value)}
                style={{
                  borderRadius: 6,
                  border: `1px solid ${currentTheme.colors.inputBorder}`,
                  padding: '6px 8px',
                  background: currentTheme.colors.inputBackground,
                  color: currentTheme.colors.primaryText,
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span><FormattedMessage id="plugin.followUpReminders.noteLabel" defaultMessage="Notes (optional)" /></span>
              <textarea
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                rows={3}
                style={{
                  borderRadius: 6,
                  border: `1px solid ${currentTheme.colors.inputBorder}`,
                  padding: '6px 8px',
                  background: currentTheme.colors.inputBackground,
                  color: currentTheme.colors.primaryText,
                  resize: 'vertical',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  ...primaryButtonStyle,
                  cursor: dueInput ? 'pointer' : 'not-allowed',
                  opacity: dueInput ? 1 : 0.6,
                }}
                disabled={!dueInput}
              >
                <FormattedMessage id="plugin.followUpReminders.save" defaultMessage="Save reminder" />
              </button>
              <button
                type="button"
                onClick={() => handleClear()}
                style={{
                  ...buttonStyle,
                  cursor: existingReminder ? 'pointer' : 'not-allowed',
                  opacity: existingReminder ? 1 : 0.6,
                }}
                disabled={!existingReminder}
              >
                <FormattedMessage id="plugin.followUpReminders.clear" defaultMessage="Clear" />
              </button>
            </div>
            {existingReminder && (
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${currentTheme.colors.panelBorder}`,
                  background: currentTheme.colors.menuBackground,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: currentTheme.colors.secondaryText }}>
                  <FormattedMessage id="plugin.followUpReminders.currentSummary" defaultMessage="Saved reminder" />
                </div>
                <div style={{ fontSize: 13, color: currentTheme.colors.primaryText }}>
                  <FormattedMessage
                    id="plugin.followUpReminders.currentDue"
                    defaultMessage="Due {date}"
                    values={{
                      date: intl.formatDate(new Date(existingReminder.dueAt), { dateStyle: 'medium', timeStyle: 'short' }),
                    }}
                  />
                </div>
                {existingReminder.note ? (
                  <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText, whiteSpace: 'pre-wrap' }}>
                    <FormattedMessage
                      id="plugin.followUpReminders.currentNote"
                      defaultMessage="Notes: {note}"
                      values={{ note: existingReminder.note }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: currentTheme.colors.secondaryText }}>
                    <FormattedMessage id="plugin.followUpReminders.currentNoNote" defaultMessage="No notes added." />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 14, color: currentTheme.colors.secondaryText }}>
          <FormattedMessage id="plugin.followUpReminders.upcoming" defaultMessage="Upcoming follow-ups" />
        </h4>
        {sortedReminders.length === 0 ? (
          <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText }}>
            <FormattedMessage id="plugin.followUpReminders.none" defaultMessage="No follow-ups scheduled." />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedReminders.map((reminder) => {
              const dueTime = Date.parse(reminder.dueAt);
              const formattedDate = Number.isNaN(dueTime)
                ? intl.formatMessage({ id: 'plugin.followUpReminders.invalidShort', defaultMessage: 'Invalid date' })
                : intl.formatDate(new Date(dueTime), { dateStyle: 'medium', timeStyle: 'short' });
              const badgeColor = (() => {
                switch (reminder.status) {
                  case REMINDER_STATUS.OVERDUE:
                    return currentTheme.colors.error;
                  case REMINDER_STATUS.UPCOMING:
                    return currentTheme.colors.warning;
                  default:
                    return currentTheme.colors.info;
                }
              })();

              return (
                <div
                  key={reminder.nodeId}
                  style={{
                    border: `1px solid ${currentTheme.colors.panelBorder}`,
                    borderRadius: 10,
                    padding: 12,
                    background: currentTheme.colors.appBackground || currentTheme.colors.panelBackground,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{getNodeKey(reminder.node)}</strong>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 12,
                        border: `1px solid ${badgeColor}`,
                        color: badgeColor,
                        background: currentTheme.colors.panelBackground,
                      }}
                    >
                      {reminder.status === REMINDER_STATUS.OVERDUE ? (
                        <FormattedMessage id="plugin.followUpReminders.overdue" defaultMessage="Overdue" />
                      ) : reminder.status === REMINDER_STATUS.UPCOMING ? (
                        <FormattedMessage id="plugin.followUpReminders.dueSoon" defaultMessage="Due soon" />
                      ) : (
                        <FormattedMessage id="plugin.followUpReminders.scheduled" defaultMessage="Scheduled" />
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText }}>{formattedDate}</div>
                  {reminder.note && (
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: currentTheme.colors.primaryText }}>
                      {reminder.note}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={buttonStyle} type="button" onClick={() => handleSelectNode(reminder.nodeId)}>
                      <FormattedMessage id="plugin.followUpReminders.openNode" defaultMessage="Focus node" />
                    </button>
                    <button style={buttonStyle} type="button" onClick={() => handleClear(reminder.nodeId)}>
                      <FormattedMessage id="plugin.followUpReminders.markDone" defaultMessage="Mark done" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReminderOverlay({ appApi }) {
  const intl = useIntl();
  const { currentTheme } = useTheme();
  const nodes = Array.isArray(appApi?.nodes) ? appApi.nodes : [];
  const [reminders] = useReminderStore(nodes);
  const now = Date.now();
  const entries = React.useMemo(() => (
    Object.values(reminders || {})
      .map((reminder) => ({
        ...reminder,
        status: getReminderStatus(reminder.dueAt, now),
      }))
      .filter((reminder) => reminder.status === REMINDER_STATUS.OVERDUE || reminder.status === REMINDER_STATUS.UPCOMING)
  ), [reminders, now]);
  const logEvent = React.useCallback((id, defaultMessage, values = {}, level = 'info') => {
    if (!appApi?.plugin?.log) return;
    const message = intl.formatMessage({ id, defaultMessage }, values);
    appApi.plugin.log(message, level);
  }, [appApi, intl]);

  const count = entries.length;
  if (count === 0) return null;

  const handleOpenList = () => {
    const ids = entries.map((entry) => entry.nodeId);
    if (ids.length > 0) {
      appApi?.setPluginEnabled?.('custom.followUpReminders', true);
      appApi?.selectNodes?.(ids, { center: true });
    }
    appApi?.plugin?.openHub?.();
    logEvent(
      'plugin.followUpReminders.log.openHub',
      'Opened reminder list from overlay.',
      { count }
    );
  };

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        background: currentTheme.colors.panelBackground,
        color: currentTheme.colors.primaryText,
        border: `1px solid ${currentTheme.colors.panelBorder}`,
        boxShadow: `0 12px 24px ${currentTheme.colors.panelShadow}`,
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span role="img" aria-label="Reminder">⏰</span>
        <strong>{intl.formatMessage(
          { id: 'plugin.followUpReminders.overlayLabel', defaultMessage: '{count, plural, one {# follow-up due soon} other {# follow-ups due soon}}' },
          { count }
        )}</strong>
      </div>
      <button
        type="button"
        onClick={handleOpenList}
        style={{
          marginTop: 8,
          padding: '6px 10px',
          borderRadius: 6,
          border: `1px solid ${currentTheme.colors.inputBorder}`,
          background: currentTheme.colors.menuBackground,
          color: currentTheme.colors.primaryText,
          cursor: 'pointer',
        }}
      >
        <FormattedMessage id="plugin.followUpReminders.openPanel" defaultMessage="Review reminders" />
      </button>
    </div>
  );
}

export const followUpRemindersPlugin = {
  id: 'custom.followUpReminders',
  name: 'Follow-up Reminders',
  nameMessageId: 'plugin.followUpReminders.title',
  description: 'Track follow-up dates for nodes and highlight what needs attention.',
  descriptionId: 'plugin.followUpReminders.desc',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
    aboutPage: {
      markdown: `
# Follow-up Reminders

Track who or what you need to revisit next. Set a follow-up date on any node, then watch upcoming reminders from the side panel or overlay.

How to use:
- Select a node and choose "Save reminder" after picking a due date.
- Use "Highlight due" or "Select due" to focus on upcoming items.
- Clear reminders when work is complete to keep the list tidy.
      `.trim(),
    },
    sidePanels: [
      {
        id: 'followUpRemindersPanel',
        visible: () => true,
        order: 25,
        render: (api) => <ReminderPanel appApi={api} />,
      },
    ],
    canvasOverlays: [
      {
        id: 'followUpReminderOverlay',
        slot: 'top-right',
        order: 15,
        visible: () => true,
        render: (api) => <ReminderOverlay appApi={api} />,
      },
    ],
  },
};

export default followUpRemindersPlugin;
