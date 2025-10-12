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
    if (allow && nodeId != null && !allow.has(String(nodeId))) return;
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

function ReminderPanel({ appApi, layout = 'floating' }) {
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
        const node = findNodeById(reminder.nodeId);
        const due = Date.parse(reminder.dueAt);
        return {
          ...reminder,
          node,
          label: node
            ? getNodeKey(node)
            : intl.formatMessage(
                { id: 'plugin.followUpReminders.unknownNode', defaultMessage: 'Node {id}' },
                { id: reminder.nodeId }
              ),
          dueTime: Number.isNaN(due) ? null : new Date(due),
          status: getReminderStatus(reminder.dueAt, now),
        };
      })
      .filter((entry) => entry.dueTime)
      .sort((a, b) => {
        return a.dueTime - b.dueTime;
      });
  }, [reminders, nodes, now, intl, findNodeById]);

  const dueSoonEntries = React.useMemo(
    () => sortedReminders.filter(
      (entry) => entry.status === REMINDER_STATUS.OVERDUE || entry.status === REMINDER_STATUS.UPCOMING
    ),
    [sortedReminders]
  );

  const dueSoonNodeIds = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    dueSoonEntries.forEach((entry) => {
      const id = entry.node?.id ?? entry.nodeId;
      if (id == null) return;
      const key = typeof id === 'object' ? JSON.stringify(id) : String(id);
      if (seen.has(key)) return;
      seen.add(key);
      list.push(id);
    });
    return list;
  }, [dueSoonEntries]);

  const handleBulkSelect = React.useCallback(() => {
    if (!appApi?.selectNodes || dueSoonNodeIds.length === 0) {
      showStatus(
        'info',
        'plugin.followUpReminders.statusNoneDue',
        'No reminders are due right now.'
      );
      return;
    }
    appApi.selectNodes(dueSoonNodeIds, { center: true });
    logEvent(
      'plugin.followUpReminders.log.selectDue',
      'Selected {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonNodeIds.length }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusSelected',
      'Selected {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonNodeIds.length }
    );
  }, [appApi, dueSoonNodeIds, logEvent, showStatus]);

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
    if (!appApi?.onHighlightNodes || dueSoonNodeIds.length === 0) {
      showStatus(
        'info',
        'plugin.followUpReminders.statusNoneDue',
        'No reminders are due right now.'
      );
      return;
    }
    appApi.onHighlightNodes(dueSoonNodeIds);
    logEvent(
      'plugin.followUpReminders.log.highlightDue',
      'Highlighted {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonNodeIds.length }
    );
    showStatus(
      'info',
      'plugin.followUpReminders.statusHighlighted',
      'Highlighted {count, plural, one {# due node} other {# due nodes}}.',
      { count: dueSoonNodeIds.length }
    );
  }, [appApi, dueSoonNodeIds, logEvent, showStatus]);

  const isInlineLayout = layout === 'inline';

  const glassSurface = 'var(--plugin-panel-surface-glass, rgba(15, 23, 42, 0.32))';
  const panelBorderVar = 'var(--plugin-panel-border, rgba(148, 163, 184, 0.35))';
  const panelStyle = {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: currentTheme.colors.primaryText,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    position: isInlineLayout ? 'relative' : 'static',
  };

  const buttonStyle = {
    borderRadius: 6,
    padding: '8px 12px',
    border: `1px solid ${panelBorderVar}`,
    background: glassSurface,
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
              cursor: dueSoonNodeIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: dueSoonNodeIds.length === 0 ? 0.6 : 1,
            }}
            disabled={dueSoonNodeIds.length === 0}
          >
            <FormattedMessage id="plugin.followUpReminders.highlightDue" defaultMessage="Highlight due" />
          </button>
          <button
            type="button"
            onClick={handleBulkSelect}
            style={{
              ...buttonStyle,
              cursor: dueSoonNodeIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: dueSoonNodeIds.length === 0 ? 0.6 : 1,
            }}
            disabled={dueSoonNodeIds.length === 0}
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
                  {Number.isNaN(Date.parse(existingReminder.dueAt))
                    ? (
                      <FormattedMessage id="plugin.followUpReminders.currentDueUnknown" defaultMessage="Due date not set." />
                    )
                    : (
                      <FormattedMessage
                        id="plugin.followUpReminders.currentDue"
                        defaultMessage="Due {date}"
                        values={{
                          date: intl.formatDate(new Date(existingReminder.dueAt), { dateStyle: 'medium', timeStyle: 'short' }),
                        }}
                      />
                    )}
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

    </div>
  );
}

function ReminderNotifications({ appApi }) {
  const intl = useIntl();
  const { currentTheme } = useTheme();
  const nodes = Array.isArray(appApi?.nodes) ? appApi.nodes : [];
  const [reminders, setReminders] = useReminderStore(nodes);
  const findNodeById = React.useCallback(
    (id) => nodes.find((node) => String(node?.id) === String(id)) || null,
    [nodes]
  );
  const logEvent = React.useCallback((id, defaultMessage, values = {}, level = 'info') => {
    if (!appApi?.plugin?.log) return;
    const message = intl.formatMessage({ id, defaultMessage }, values);
    appApi.plugin.log(message, level);
  }, [appApi, intl]);

  const now = Date.now();
  const dueEntries = React.useMemo(() => {
    const list = Object.values(reminders || {});
    return list
      .map((reminder) => {
        const node = findNodeById(reminder.nodeId);
        const due = Date.parse(reminder.dueAt);
        return {
          ...reminder,
          node,
          label: node
            ? getNodeKey(node)
            : intl.formatMessage(
                { id: 'plugin.followUpReminders.unknownNode', defaultMessage: 'Node {id}' },
                { id: reminder.nodeId }
              ),
          dueTime: Number.isNaN(due) ? null : new Date(due),
          status: getReminderStatus(reminder.dueAt, now),
        };
      })
      .filter((entry) => entry.dueTime && (entry.status === REMINDER_STATUS.OVERDUE || entry.status === REMINDER_STATUS.UPCOMING))
      .sort((a, b) => a.dueTime - b.dueTime);
  }, [reminders, findNodeById, intl, now]);

  const handleFocus = React.useCallback((nodeId) => {
    if (!nodeId || !appApi?.selectNode) return;
    appApi.selectNode(nodeId, { center: true });
    const node = findNodeById(nodeId);
    logEvent(
      'plugin.followUpReminders.log.focus',
      'Focused reminder node {name}.',
      { name: getNodeKey(node) }
    );
  }, [appApi, findNodeById, logEvent]);

  const handleMarkDone = React.useCallback((nodeId) => {
    if (!nodeId) return;
    const key = String(nodeId);
    setReminders((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    const node = findNodeById(nodeId);
    logEvent(
      'plugin.followUpReminders.log.cleared',
      'Cleared reminder for {name}.',
      { name: getNodeKey(node) }
    );
  }, [setReminders, findNodeById, logEvent]);

  const buttonStyle = {
    borderRadius: 6,
    padding: '6px 12px',
    border: `1px solid ${currentTheme.colors.inputBorder}`,
    background: currentTheme.colors.menuBackground,
    color: currentTheme.colors.primaryText,
    cursor: 'pointer',
  };

  if (dueEntries.length === 0) {
    return (
      <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText }}>
        <FormattedMessage id="plugin.followUpReminders.notificationsEmpty" defaultMessage="You're all caught up for now." />
      </div>
    );
  }

  const visibleEntries = dueEntries.slice(0, 4);
  const remaining = dueEntries.length - visibleEntries.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText }}>
        <FormattedMessage
          id="plugin.followUpReminders.notificationsSummary"
          defaultMessage="{count, plural, one {# reminder needs attention} other {# reminders need attention}}"
          values={{ count: dueEntries.length }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleEntries.map((entry) => {
          const badgeColor = (() => {
            switch (entry.status) {
              case REMINDER_STATUS.OVERDUE:
                return currentTheme.colors.error;
              case REMINDER_STATUS.UPCOMING:
                return currentTheme.colors.warning;
              default:
                return currentTheme.colors.info;
            }
          })();
          const formattedDate = entry.dueTime
            ? intl.formatDate(entry.dueTime, { dateStyle: 'medium', timeStyle: 'short' })
            : intl.formatMessage({ id: 'plugin.followUpReminders.invalidShort', defaultMessage: 'Invalid date' });
          const nodeId = entry.node?.id ?? entry.nodeId;

          return (
            <div
              key={entry.nodeId}
              style={{
                borderRadius: 12,
                border: `1px solid ${currentTheme.colors.panelBorder}`,
                background: currentTheme.colors.menuBackground,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 14, color: currentTheme.colors.primaryText }}>{entry.label}</strong>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: 12,
                    border: `1px solid ${badgeColor}`,
                    color: badgeColor,
                    background: currentTheme.colors.panelBackground,
                  }}
                >
                  {entry.status === REMINDER_STATUS.OVERDUE ? (
                    <FormattedMessage id="plugin.followUpReminders.overdue" defaultMessage="Overdue" />
                  ) : (
                    <FormattedMessage id="plugin.followUpReminders.dueSoon" defaultMessage="Due soon" />
                  )}
                </span>
              </div>
              <div style={{ fontSize: 13, color: currentTheme.colors.secondaryText }}>{formattedDate}</div>
              {entry.note && (
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: currentTheme.colors.primaryText }}>
                  {entry.note}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={buttonStyle} type="button" onClick={() => handleFocus(nodeId)}>
                  <FormattedMessage id="plugin.followUpReminders.openNode" defaultMessage="Focus node" />
                </button>
                <button style={buttonStyle} type="button" onClick={() => handleMarkDone(entry.nodeId)}>
                  <FormattedMessage id="plugin.followUpReminders.markDone" defaultMessage="Mark done" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {remaining > 0 && (
        <div style={{ fontSize: 12, color: currentTheme.colors.secondaryText }}>
          <FormattedMessage
            id="plugin.followUpReminders.notificationsMore"
            defaultMessage="+{count} more scheduled"
            values={{ count: remaining }}
          />
        </div>
      )}
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
    notifications: [
      {
        id: 'followUpRemindersNotifications',
        title: 'Follow-up Reminders',
        order: 15,
        visible: () => true,
        badge: (api) => {
          const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
          const nodeIds = nodes.map((node) => node?.id).filter((id) => id != null);
          const scoped = filterRemindersForNodes(getReminderState(nodeIds), nodes);
          const now = Date.now();
          const count = Object.values(scoped || {}).reduce((total, reminder) => {
            const status = getReminderStatus(reminder.dueAt, now);
            return (status === REMINDER_STATUS.OVERDUE || status === REMINDER_STATUS.UPCOMING)
              ? total + 1
              : total;
          }, 0);
          return count > 0 ? count : null;
        },
        render: (api) => <ReminderNotifications appApi={api} />,
      },
    ],
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
        title: 'Follow-up Reminders',
        allowCollapse: true,
        mobileBehavior: 'hidden',
        visible: () => true,
        order: 25,
        render: (api) => <ReminderPanel appApi={api} layout="floating" />,
        renderMobile: (api) => <ReminderPanel appApi={api} layout="inline" />,
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
