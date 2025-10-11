import React from 'react';
import { getNodeDisplayText } from '../../utils/nodeUtils';

const STORAGE_KEY = 'vertex_plugin_gamification_v1';
const DEFAULT_STATE = {
  xp: 0,
  streak: 0,
  lastAwardDate: null,
  totalMilestones: 0,
  recentActivities: [],
};

let gamificationState = loadState();
const subscribers = new Set();

function loadState() {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage?.getItem?.(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      recentActivities: Array.isArray(parsed?.recentActivities) ? parsed.recentActivities.slice(0, 6) : [],
    };
  } catch (error) {
    console.warn('[gamificationPlugin] Failed to load state', error);
    return { ...DEFAULT_STATE };
  }
}

function persistState(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify({
      xp: next.xp,
      streak: next.streak,
      lastAwardDate: next.lastAwardDate,
      totalMilestones: next.totalMilestones,
      recentActivities: next.recentActivities,
    }));
  } catch (error) {
    console.warn('[gamificationPlugin] Failed to persist state', error);
  }
}

function getState() {
  return gamificationState;
}

function setState(updater) {
  const prev = gamificationState;
  const next = typeof updater === 'function' ? updater(prev) : updater;
  gamificationState = {
    ...DEFAULT_STATE,
    ...next,
    recentActivities: Array.isArray(next?.recentActivities) ? next.recentActivities.slice(0, 6) : [],
  };
  persistState(gamificationState);
  subscribers.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[gamificationPlugin] Subscriber failed', error);
    }
  });
}

function subscribe(listener) {
  if (typeof listener !== 'function') return () => {};
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function useGamificationSnapshot() {
  return React.useSyncExternalStore(subscribe, getState, getState);
}

function levelThreshold(level) {
  if (level <= 1) return 0;
  return (level - 1) * 120;
}

function computeLevel(xp) {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

function computeProgress(xp) {
  const level = computeLevel(xp);
  const currentFloor = levelThreshold(level);
  const nextFloor = levelThreshold(level + 1);
  const span = Math.max(1, nextFloor - currentFloor);
  const delta = Math.max(0, xp - currentFloor);
  return {
    level,
    percent: Math.max(0, Math.min(100, Math.round((delta / span) * 100))),
    currentFloor,
    nextFloor,
  };
}

function daysBetween(start, end) {
  const startMidnight = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endMidnight = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Math.round((endMidnight.getTime() - startMidnight.getTime()) / (24 * 60 * 60 * 1000));
}

function awardXp({ amount, reason, nodeId }, pluginApi) {
  const xpAmount = Number.parseInt(amount, 10);
  if (!Number.isFinite(xpAmount) || xpAmount <= 0) return;

  setState((prev) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const lastAward = prev.lastAwardDate ? new Date(prev.lastAwardDate) : null;

    let streak = prev.streak || 0;
    if (lastAward) {
      const diff = daysBetween(lastAward, now);
      if (diff === 0) {
        streak = Math.max(1, streak);
      } else if (diff === 1) {
        streak = streak + 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      label: reason || 'Milestone logged',
      nodeId: nodeId != null ? String(nodeId) : null,
      xpAwarded: xpAmount,
      at: nowIso,
    };
    const recentActivities = [entry, ...prev.recentActivities].slice(0, 6);

    return {
      ...prev,
      xp: Math.max(0, prev.xp + xpAmount),
      streak,
      lastAwardDate: nowIso,
      totalMilestones: prev.totalMilestones + 1,
      recentActivities,
    };
  });

  try {
    pluginApi?.log?.(`+${xpAmount} XP — ${reason || 'Milestone logged'}`);
  } catch {
    // noop
  }
}

const XP_BADGE_THRESHOLDS = [
  { xp: 120, label: 'Explorer' },
  { xp: 360, label: 'Scholar' },
  { xp: 720, label: 'Trailblazer' },
  { xp: 1200, label: 'Archivist' },
];

const STREAK_BADGES = [
  { streak: 3, label: 'Momentum' },
  { streak: 7, label: 'Committed' },
  { streak: 14, label: 'Unstoppable' },
];

const MILESTONE_BADGES = [
  { total: 5, label: 'Milestone Hunter' },
  { total: 15, label: 'Habit Builder' },
  { total: 30, label: 'Master Curator' },
];

function computeBadges(state) {
  const badges = [];
  XP_BADGE_THRESHOLDS.forEach(({ xp, label }) => {
    if (state.xp >= xp) badges.push(label);
  });
  STREAK_BADGES.forEach(({ streak, label }) => {
    if (state.streak >= streak) badges.push(`${label} (${streak}d)`);
  });
  MILESTONE_BADGES.forEach(({ total, label }) => {
    if (state.totalMilestones >= total) badges.push(`${label} (${total})`);
  });
  return badges.slice(0, 6);
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function GamificationPanel({ appApi }) {
  const snapshot = useGamificationSnapshot();
  const { level, percent, currentFloor, nextFloor } = computeProgress(snapshot.xp);
  const badges = computeBadges(snapshot);
  const nodes = Array.isArray(appApi?.nodes) ? appApi.nodes : [];
  const selectedId = Array.isArray(appApi?.selectedNodeIds) ? appApi.selectedNodeIds[0] : null;
  const selectedNode = selectedId != null ? nodes.find((node) => String(node?.id) === String(selectedId)) : null;
  const selectedLabel = selectedNode ? getNodeDisplayText(selectedNode) : null;

  const handleNodeReviewed = React.useCallback(() => {
    if (selectedId == null) return;
    const label = selectedLabel || `Node ${selectedId}`;
    awardXp({ amount: 15, reason: `Reviewed ${label}`, nodeId: selectedId }, appApi?.plugin);
  }, [selectedId, selectedLabel, appApi]);

  const handleSprintComplete = React.useCallback(() => {
    awardXp({ amount: 40, reason: 'Focus sprint completed' }, appApi?.plugin);
  }, [appApi]);

  const handleShareInsight = React.useCallback(() => {
    awardXp({ amount: 20, reason: 'Shared new insight' }, appApi?.plugin);
  }, [appApi]);

  const progressBarStyle = {
    height: 8,
    borderRadius: 999,
    background: 'rgba(148, 163, 184, 0.35)',
    overflow: 'hidden',
    marginTop: 6,
  };

  const progressFillStyle = {
    width: `${percent}%`,
    height: '100%',
    borderRadius: 'inherit',
    background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)',
    transition: 'width 160ms ease-out',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
      <section>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>Level {level}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {snapshot.xp} XP · {percent}% to next level ({nextFloor - currentFloor} XP window)
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Streak</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{snapshot.streak} day{snapshot.streak === 1 ? '' : 's'}</div>
          </div>
        </header>
        <div style={progressBarStyle}>
          <div style={progressFillStyle} />
        </div>
        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {badges.map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(59, 130, 246, 0.14)',
                  color: '#1d4ed8',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Quick actions</div>
        <button
          type="button"
          onClick={handleNodeReviewed}
          disabled={selectedId == null}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: selectedId == null ? 'rgba(148, 163, 184, 0.16)' : 'rgba(59, 130, 246, 0.12)',
            color: selectedId == null ? 'rgba(15, 23, 42, 0.65)' : '#1d4ed8',
            cursor: selectedId == null ? 'not-allowed' : 'pointer',
            transition: 'transform 120ms ease',
          }}
        >
          +15 XP · Mark {selectedLabel ? `"${selectedLabel}"` : 'node'} reviewed
        </button>
        <button
          type="button"
          onClick={handleShareInsight}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#047857',
            cursor: 'pointer',
            transition: 'transform 120ms ease',
          }}
        >
          +20 XP · Capture a new insight
        </button>
        <button
          type="button"
          onClick={handleSprintComplete}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(79, 70, 229, 0.12)',
            color: '#4338ca',
            cursor: 'pointer',
            transition: 'transform 120ms ease',
          }}
        >
          +40 XP · Complete a focus sprint
        </button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Recent activity</div>
        {snapshot.recentActivities.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>No milestones logged yet. Use the quick actions to get started.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {snapshot.recentActivities.map((activity) => (
              <li key={activity.id} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{activity.label}</div>
                <div style={{ fontSize: 11, opacity: 0.68 }}>
                  +{activity.xpAwarded} XP · {formatDate(activity.at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GamificationOverlay() {
  const snapshot = useGamificationSnapshot();
  const { level, percent } = computeProgress(snapshot.xp);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '12px 16px',
        borderRadius: 14,
        background: 'rgba(17, 24, 39, 0.72)',
        color: '#f8fafc',
        minWidth: 160,
        boxShadow: '0 18px 34px rgba(15, 23, 42, 0.45)',
      }}
    >
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.72 }}>Gamification</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Level {level}</div>
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(148, 163, 184, 0.35)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            borderRadius: 'inherit',
            background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)',
            transition: 'width 160ms ease-out',
          }}
        />
      </div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{snapshot.xp} XP total · streak {snapshot.streak}</div>
    </div>
  );
}

export const gamificationPlugin = {
  id: 'example.gamification',
  name: 'Gamification Boost',
  nameMessageId: 'plugin.gamification.name',
  description: 'Track XP, streaks, and achievements while mapping ideas.',
  descriptionId: 'plugin.gamification.description',
  version: '0.1.0',
  author: 'Vertex Lab',
  slots: {
    aboutPage: {
      markdown: `
# Gamification Boost

Stay motivated while you map. This plugin awards XP for common knowledge graph tasks and highlights your progress with streaks and badges.

**Highlights**
- Quick actions to log milestones and earn XP.
- Lightweight achievements that adapt to your streak and total milestones.
- Optional overlay that shows level progress at a glance.

Tip: pair it with focus sprints or daily reviews to keep momentum high.
      `.trim(),
    },
    sidePanels: [
      {
        id: 'gamificationPanel',
        title: 'Gamification',
        order: 70,
        mobileBehavior: 'drawer',
        allowCollapse: true,
        render: (appApi) => <GamificationPanel appApi={appApi} />,
      },
    ],
    canvasOverlays: [
      {
        id: 'gamificationBadge',
        slot: 'top-right',
        order: 45,
        style: { pointerEvents: 'auto' },
        visible: (api) => !api?.isMobile,
        render: () => <GamificationOverlay />,
      },
    ],
    commands: [
      {
        id: 'example.gamification.nodeReviewed',
        title: 'Gamification: Mark Node Reviewed (+15 XP)',
        when: 'node',
        run: (api, ctx) => {
          const nodeId = ctx?.nodeId ?? api?.selectedNodeIds?.[0];
          if (nodeId == null) return;
          const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
          const node = nodes.find((item) => String(item?.id) === String(nodeId));
          const label = node ? getNodeDisplayText(node) : `Node ${nodeId}`;
          awardXp({ amount: 15, reason: `Reviewed ${label}`, nodeId }, api?.plugin);
        },
      },
      {
        id: 'example.gamification.focusSprint',
        title: 'Gamification: Complete Focus Sprint (+40 XP)',
        when: 'canvas',
        run: (api) => {
          awardXp({ amount: 40, reason: 'Focus sprint completed' }, api?.plugin);
        },
      },
      {
        id: 'example.gamification.shareInsight',
        title: 'Gamification: Share Insight (+20 XP)',
        when: 'canvas',
        run: (api) => {
          awardXp({ amount: 20, reason: 'Shared new insight' }, api?.plugin);
        },
      },
    ],
  },
};

export default gamificationPlugin;
