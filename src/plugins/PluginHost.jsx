import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PluginErrorBoundary from './PluginErrorBoundary.jsx';
import { appendPluginLog } from './errorLog.js';
import { useHapticFeedback } from '../hooks/useHapticFeedback.js';
import { useNotificationHistory } from '../hooks/useNotificationHistory.js';

function PanelRenderer({ render, appApi }) {
  // Call provided render so errors bubble to the boundary above
  return render(appApi);
}

function NotificationSection({ entries = [], variant = 'desktop', onNotificationVisible, isUnseen }) {
  const observerRef = React.useRef(null);
  const cardRefs = React.useRef(new Map());

  React.useEffect(() => {
    if (!onNotificationVisible || typeof IntersectionObserver === 'undefined') return;

    // Create observer to detect when notifications become visible
    observerRef.current = new IntersectionObserver(
      (observerEntries) => {
        observerEntries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.dataset.notificationKey;
            if (key) {
              onNotificationVisible(key);
            }
          }
        });
      },
      { threshold: 0.5 } // Mark as seen when 50% visible
    );

    // Observe all notification cards
    cardRefs.current.forEach((element) => {
      if (element) observerRef.current.observe(element);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [entries, onNotificationVisible]);

  if (!entries || entries.length === 0) {
    return null;
  }

  const baseClass = variant === 'mobile' ? 'plugin-mobile-drawer' : 'plugin-side-panels';
  const rootClass = `${baseClass}__notifications`;
  const headerClass = `${baseClass}__notifications-header`;
  const listClass = `${baseClass}__notifications-list`;
  const cardClass = `${baseClass}__notification-card`;
  const cardHeaderClass = `${baseClass}__notification-cardHeader`;
  const badgeClass = `${baseClass}__notification-badge`;
  const bodyClass = `${baseClass}__notification-cardBody`;

  return (
    <section className={rootClass} aria-label="Plugin notifications">
      <div className={headerClass}>
        <FormattedMessage id="plugins.notifications.title" defaultMessage="Notifications" />
      </div>
      <div className={listClass}>
        {entries.map((entry) => {
          // Support priority variants: info, warning, error, success
          const priority = entry.priority || 'info';
          const priorityClass = priority !== 'info' ? ` ${cardClass}--${priority}` : '';
          const unseen = isUnseen ? isUnseen(entry.key) : false;

          return (
            <article
              key={entry.key}
              className={`${cardClass}${priorityClass}`}
              ref={(el) => {
                if (el) {
                  cardRefs.current.set(entry.key, el);
                } else {
                  cardRefs.current.delete(entry.key);
                }
              }}
              data-notification-key={entry.key}
              style={{ position: 'relative' }}
            >
              {unseen && (
                <span
                  className="plugin-update-badge"
                  aria-label="Unread notification"
                  title="New notification"
                />
              )}
              <div className={cardHeaderClass}>
                <span>{entry.title}</span>
                {entry.badge !== undefined && entry.badge !== null && entry.badge !== false && entry.badge !== '' && (
                  <span className={badgeClass}>{entry.badge}</span>
                )}
              </div>
              <div className={bodyClass}>
                {entry.element}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const descriptorsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i];
    const db = b[i];
    if (!da || !db) return false;
    if (da.key !== db.key) return false;
    if (da.pluginId !== db.pluginId) return false;
    if (da.overlayId !== db.overlayId) return false;
    if (da.slot !== db.slot) return false;
    if ((da.order ?? 0) !== (db.order ?? 0)) return false;
    if (da.element !== db.element) return false;
  }
  return true;
};

// Simple plugin host that renders plugin-provided side panels
export function PluginHost({ plugins = [], appApi, onOverlaysChange, onSidePanelWidthChange, hideSidePanels = false }) {
  const { triggerHaptic, triggerWithAnimation } = useHapticFeedback();
  const {
    markAsSeen,
    markAllAsSeen,
    isUnseen,
    getUnseenCount,
    updateCurrentNotifications,
  } = useNotificationHistory();

  const overlayDescriptors = useMemo(() => {
    if (!plugins || plugins.length === 0) return [];
    return plugins.flatMap((plugin) => {
      const overlays = Array.isArray(plugin?.slots?.canvasOverlays) ? plugin.slots.canvasOverlays : [];
      const withPluginApi = (render) => (hostApi) => {
        const api = {
          ...hostApi,
          plugin: {
            id: plugin.id,
            log: (message, level = 'info') => appendPluginLog({ pluginId: plugin.id, level, message: String(message) }),
            openHub: () => {
              try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
              try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {}
            },
            // Back-compat shims
            openConfig: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
            openConsole: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
          },
        };
        return render(api);
      };

      return overlays
        .filter((overlay) => (typeof overlay.visible === 'function' ? overlay.visible(appApi) : true))
        .map((overlay) => ({
          key: `${plugin.id}:overlay:${overlay.id}`,
          pluginId: plugin.id,
          overlayId: overlay.id,
          slot: overlay.slot,
          order: overlay.order,
          style: overlay.style,
          layoutKey: overlay.layoutKey || `${plugin.id}:${overlay.id}`,
          element: (
            <PluginErrorBoundary key={`${plugin.id}:overlay:${overlay.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(overlay.render)} appApi={appApi} />
            </PluginErrorBoundary>
          ),
        }));
    });
  }, [plugins, appApi]);

  const lastDescriptorsRef = useRef();
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [collapsedPanels, setCollapsedPanels] = useState(() => new Set());
  const [scrollAtTop, setScrollAtTop] = useState(true);
  const [scrollAtBottom, setScrollAtBottom] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeMobilePanelKey, setActiveMobilePanelKey] = useState(null);
  const drawerRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const drawerStartY = useRef(0);
  const drawerStartTranslate = useRef(0);

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const stored = localStorage.getItem('vertex_plugin_panel_width');
      return stored ? parseInt(stored, 10) : 340;
    } catch {
      return 340;
    }
  });
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const isResizing = useRef(false);

  useEffect(() => {
    if (typeof onOverlaysChange === 'function') {
      if (descriptorsEqual(lastDescriptorsRef.current, overlayDescriptors)) return;
      // console.log('PluginHost overlays changed', overlayDescriptors);
      lastDescriptorsRef.current = overlayDescriptors;
      onOverlaysChange(overlayDescriptors);
    }
  }, [overlayDescriptors, onOverlaysChange]);

  if (!plugins || plugins.length === 0) return null;

  const sidePanelEntries = useMemo(() => {
    if (!plugins || plugins.length === 0) return [];
    const entries = [];
    plugins.forEach((plugin) => {
      const panels = Array.isArray(plugin?.slots?.sidePanels) ? plugin.slots.sidePanels : [];
      const withPluginApi = (render) => (hostApi) => {
        const api = {
          ...hostApi,
          plugin: {
            id: plugin.id,
            log: (message, level = 'info') => appendPluginLog({ pluginId: plugin.id, level, message: String(message) }),
            openHub: () => {
              try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
              try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {}
            },
            openConfig: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
            openConsole: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
          },
        };
        return render(api);
      };

      panels
        .filter((panel) => (typeof panel.visible === 'function' ? panel.visible(appApi) : true))
        .forEach((panel) => {
          const panelTitle =
            (typeof panel.title === 'function' && panel.title(appApi)) ||
            (typeof panel.title === 'string' && panel.title) ||
            (typeof panel.label === 'function' && panel.label(appApi)) ||
            (typeof panel.label === 'string' && panel.label) ||
            (typeof panel.name === 'string' && panel.name) ||
            plugin.name ||
            panel.id ||
            plugin.id;

          const element = (
            <PluginErrorBoundary key={`${plugin.id}:${panel.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(panel.render)} appApi={appApi} />
            </PluginErrorBoundary>
          );
          let mobileElement = null;
          if (typeof panel.renderMobile === 'function') {
            mobileElement = (
              <PluginErrorBoundary key={`${plugin.id}:${panel.id}:mobile`} pluginId={plugin.id}>
                <PanelRenderer render={withPluginApi(panel.renderMobile)} appApi={appApi} />
              </PluginErrorBoundary>
            );
          }
          entries.push({
            key: `${plugin.id}:${panel.id}`,
            order: panel.order ?? 0,
            element,
            mobileElement,
            title: panelTitle,
            allowCollapse: panel.allowCollapse !== false,
            mobileBehavior: panel.mobileBehavior || (panel.requiredOnMobile ? 'drawer' : 'hidden'),
            pluginId: plugin.id,
            panelId: panel.id,
          });
        });
    });
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return entries;
  }, [plugins, appApi]);

  const notificationEntries = useMemo(() => {
    if (!plugins || plugins.length === 0) return [];
    const entries = [];
    plugins.forEach((plugin) => {
      const notifications = Array.isArray(plugin?.slots?.notifications) ? plugin.slots.notifications : [];
      const withPluginApi = (render) => (hostApi) => {
        const api = {
          ...hostApi,
          plugin: {
            id: plugin.id,
            log: (message, level = 'info') => appendPluginLog({ pluginId: plugin.id, level, message: String(message) }),
            openHub: () => {
              try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
              try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {}
            },
            openConfig: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
            openConsole: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
          },
        };
        return render(api);
      };

      notifications
        .filter((notification) => (typeof notification.visible === 'function' ? notification.visible(appApi) : true))
        .forEach((notification) => {
          const notificationTitle =
            (typeof notification.title === 'function' && notification.title(appApi)) ||
            (typeof notification.title === 'string' && notification.title) ||
            (typeof notification.label === 'function' && notification.label(appApi)) ||
            (typeof notification.label === 'string' && notification.label) ||
            (typeof notification.name === 'string' && notification.name) ||
            plugin.name ||
            notification.id ||
            plugin.id;

          const badgeValue = typeof notification.badge === 'function'
            ? notification.badge(appApi)
            : notification.badge;

          const priority = typeof notification.priority === 'function'
            ? notification.priority(appApi)
            : (notification.priority || 'info');

          const element = (
            <PluginErrorBoundary key={`${plugin.id}:${notification.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(notification.render)} appApi={appApi} />
            </PluginErrorBoundary>
          );

          entries.push({
            key: `${plugin.id}:${notification.id}`,
            order: notification.order ?? 0,
            element,
            title: notificationTitle,
            badge: badgeValue,
            priority,
            pluginId: plugin.id,
            notificationId: notification.id,
          });
        });
    });
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return entries;
  }, [plugins, appApi]);

  const isMobile = !!appApi?.isMobile;
  const menuBarBottom = appApi?.menuBarBottom ?? 80;
  const corePanelOffset = Number.isFinite(appApi?.corePanelOffset)
    ? appApi.corePanelOffset
    : (isMobile ? 8 : 16);
  const sidePanelVerticalBuffer = isMobile ? 16 : 24;
  const sidePanelTopPx = menuBarBottom + 12;
  const maxHeightValue = `calc(100vh - ${sidePanelTopPx + sidePanelVerticalBuffer}px - env(safe-area-inset-bottom, 0px))`;
  const sidePanelContainerStyle = isMobile || hideSidePanels
    ? { display: 'none' }
    : {
        position: 'fixed',
        top: `calc(${menuBarBottom + 12}px + env(safe-area-inset-top))`,
        right: `calc(${corePanelOffset}px + env(safe-area-inset-right))`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'auto',
        maxHeight: maxHeightValue,
        width: `${panelWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 10115,
      };

  // Track notification keys for history management
  const notificationKeys = useMemo(() => notificationEntries.map((entry) => entry.key), [notificationEntries]);
  const unseenNotificationCount = getUnseenCount(notificationKeys);

  // Update current notifications for history tracking
  useEffect(() => {
    updateCurrentNotifications(notificationKeys);
  }, [notificationKeys, updateCurrentNotifications]);

  useEffect(() => {
    if (typeof onSidePanelWidthChange !== 'function') return undefined;
    if (hideSidePanels || (sidePanelEntries.length === 0 && notificationEntries.length === 0)) {
      onSidePanelWidthChange(0);
      return undefined;
    }
    const el = containerRef.current;
    if (!el) {
      onSidePanelWidthChange(0);
      return undefined;
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      onSidePanelWidthChange(Math.max(0, Math.round(rect?.width || 0)));
    };

    measure();

    let resizeObserver;
    const hasResizeObserver = typeof ResizeObserver !== 'undefined';
    if (hasResizeObserver) {
      resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(el);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', measure);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('resize', measure);
      }
      onSidePanelWidthChange(0);
    };
  }, [onSidePanelWidthChange, hideSidePanels, sidePanelEntries.length, notificationEntries.length]);

  useEffect(() => {
    setCollapsedPanels((prev) => {
      if (!(prev instanceof Set)) return new Set();
      const validKeys = new Set(sidePanelEntries.filter((entry) => entry.allowCollapse).map((entry) => entry.key));
      let changed = false;
      const next = new Set();
      prev.forEach((key) => {
        if (validKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [sidePanelEntries]);

  const handleCollapseChange = useCallback((key, nextOpen, event) => {
    // Trigger haptic feedback on collapse/expand
    triggerHaptic('light');

    setCollapsedPanels((prev) => {
      const next = new Set(prev instanceof Set ? prev : []);
      if (nextOpen) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, [triggerHaptic]);

  const visibleDesktopEntries = !isMobile ? sidePanelEntries : [];

  const mobileDrawerEntries = isMobile
    ? sidePanelEntries.filter((entry) => entry.mobileBehavior === 'drawer')
    : [];

  useEffect(() => {
    if (!isMobile) return;
    if (mobileDrawerEntries.length === 0) {
      setMobileDrawerOpen(false);
      setActiveMobilePanelKey(null);
      return;
    }
    setActiveMobilePanelKey((prev) => {
      if (prev && mobileDrawerEntries.some((entry) => entry.key === prev)) {
        return prev;
      }
      return mobileDrawerEntries[0]?.key || null;
    });
  }, [isMobile, mobileDrawerEntries]);

  useEffect(() => {
    if (hideSidePanels) {
      setMobileDrawerOpen(false);
    }
  }, [hideSidePanels]);

  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
        const btn = toggleButtonRef.current;
        if (btn && typeof btn.focus === 'function') btn.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobile, mobileDrawerOpen]);

  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return;
    const firstFocus = () => {
      const el = document.getElementById(activeMobilePanelKey ? `plugin-mobile-drawer-tab-${activeMobilePanelKey}` : '');
      if (el && typeof el.focus === 'function') el.focus();
    };
    firstFocus();
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const root = drawerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trap);
    return () => window.removeEventListener('keydown', trap);
  }, [isMobile, mobileDrawerOpen, activeMobilePanelKey]);

  const activeMobilePanel = mobileDrawerEntries.find((entry) => entry.key === activeMobilePanelKey) || null;
  const activeMobilePanelLabelId = activeMobilePanel ? `plugin-mobile-drawer-tab-${activeMobilePanel.key}` : undefined;

  // Track scroll position for scroll indicators
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setScrollAtTop(scrollTop <= 1);
      setScrollAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    };

    updateScroll();
    el.addEventListener('scroll', updateScroll, { passive: true });
    return () => el.removeEventListener('scroll', updateScroll);
  }, [sidePanelEntries, notificationEntries]);

  // Swipe-to-close gesture for mobile drawer
  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      drawerStartY.current = touch.clientY;
      drawerStartTranslate.current = 0;
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - drawerStartY.current;

      // Only allow downward swipe (positive deltaY)
      if (deltaY > 0) {
        drawerStartTranslate.current = deltaY;
        drawer.style.transform = `translateY(${deltaY}px)`;
        drawer.style.transition = 'none';
      }
    };

    const onTouchEnd = () => {
      const deltaY = drawerStartTranslate.current;

      // If swiped down more than 100px, close the drawer
      if (deltaY > 100) {
        triggerHaptic('medium');
        setMobileDrawerOpen(false);
        const btn = toggleButtonRef.current;
        if (btn && typeof btn.focus === 'function') btn.focus();
      }

      // Reset transform
      drawer.style.transform = '';
      drawer.style.transition = '';
      drawerStartY.current = 0;
      drawerStartTranslate.current = 0;
    };

    const handle = drawer.querySelector('.plugin-mobile-drawer__handle');
    if (handle) {
      handle.addEventListener('touchstart', onTouchStart, { passive: true });
      handle.addEventListener('touchmove', onTouchMove, { passive: true });
      handle.addEventListener('touchend', onTouchEnd, { passive: true });

      return () => {
        handle.removeEventListener('touchstart', onTouchStart);
        handle.removeEventListener('touchmove', onTouchMove);
        handle.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [isMobile, mobileDrawerOpen]);

  // Resizable panel drag logic
  useEffect(() => {
    if (isMobile) return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      isResizing.current = true;
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = panelWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!isResizing.current) return;
      e.preventDefault();

      // Calculate new width (resize from left, so subtract delta)
      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = Math.max(280, Math.min(600, resizeStartWidth.current + deltaX));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Persist to localStorage
      try {
        localStorage.setItem('vertex_plugin_panel_width', String(panelWidth));
      } catch {}
    };

    const container = containerRef.current;
    if (!container) return;

    const handle = container.querySelector('.plugin-panel-resize-handle');
    if (handle) {
      handle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      return () => {
        handle.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isMobile, panelWidth]);

  return (
    <>
      {(notificationEntries.length > 0 || visibleDesktopEntries.length > 0) && !hideSidePanels && (
        <div ref={containerRef} className="plugin-side-panels" style={sidePanelContainerStyle}>
          <div
            className="plugin-panel-resize-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize plugin panel"
            title="Drag to resize panel"
          />
          <div
            ref={scrollContainerRef}
            className="plugin-side-panels__scroll"
            style={{ maxHeight: maxHeightValue }}
            data-scroll-top={scrollAtTop}
            data-scroll-bottom={scrollAtBottom}
          >
            <NotificationSection
              entries={notificationEntries}
              onNotificationVisible={markAsSeen}
              isUnseen={isUnseen}
            />
            {visibleDesktopEntries.map((entry) => {
              const collapsed = collapsedPanels.has(entry.key);
              if (entry.allowCollapse) {
                return (
                  <details
                    key={entry.key}
                    className="plugin-side-panels__item plugin-side-panels__item--collapsible"
                    open={!collapsed}
                    onToggle={(event) => handleCollapseChange(entry.key, event.currentTarget.open)}
                  >
                    <summary className="plugin-side-panels__summary">
                      <span className="plugin-side-panels__title">{entry.title}</span>
                      <span className="plugin-side-panels__arrow" aria-hidden="true">?</span>
                    </summary>
                    <div className="plugin-side-panels__content">
                      {entry.element}
                    </div>
                  </details>
                );
              }
              return (
                <div key={entry.key} className="plugin-side-panels__item">
                  {entry.element}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {isMobile && (notificationEntries.length > 0 || mobileDrawerEntries.length > 0) && !hideSidePanels && (
        <>
          <div
            ref={drawerRef}
            className={`plugin-mobile-drawer ${mobileDrawerOpen ? 'plugin-mobile-drawer--open' : ''}`}
            role="dialog"
            aria-modal={mobileDrawerOpen ? 'true' : undefined}
            aria-hidden={mobileDrawerOpen ? undefined : 'true'}
            aria-labelledby={mobileDrawerOpen ? activeMobilePanelLabelId : undefined}
          >
            <div className="plugin-mobile-drawer__handle">
              <div className="plugin-mobile-drawer__grabber" aria-hidden="true" />
              <button
                type="button"
                className="plugin-mobile-drawer__close"
                onClick={() => { setMobileDrawerOpen(false); const btn = toggleButtonRef.current; if (btn && typeof btn.focus === 'function') btn.focus(); }}
                aria-label="Close panel drawer"
              >
                ���
              </button>
            </div>
            <NotificationSection
              entries={notificationEntries}
              variant="mobile"
              onNotificationVisible={markAsSeen}
              isUnseen={isUnseen}
            />
            <div className="plugin-mobile-drawer__tabs" role="tablist">
              {mobileDrawerEntries.map((entry) => {
                const isActive = entry.key === activeMobilePanelKey;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    id={`plugin-mobile-drawer-tab-${entry.key}`}
                    aria-controls={`plugin-mobile-drawer-panel-${entry.key}`}
                    className={`plugin-mobile-drawer__tab ${isActive ? 'plugin-mobile-drawer__tab--active' : ''}`}
                    onClick={() => setActiveMobilePanelKey(entry.key)}
                    onKeyDown={(e) => {
                      const idx = mobileDrawerEntries.findIndex(x => x.key === activeMobilePanelKey);
                      if (e.key === 'ArrowRight') {
                        const next = mobileDrawerEntries[(idx + 1) % mobileDrawerEntries.length];
                        if (next) setActiveMobilePanelKey(next.key);
                        e.preventDefault();
                      } else if (e.key === 'ArrowLeft') {
                        const prev = mobileDrawerEntries[(idx - 1 + mobileDrawerEntries.length) % mobileDrawerEntries.length];
                        if (prev) setActiveMobilePanelKey(prev.key);
                        e.preventDefault();
                      } else if (e.key === 'Home') {
                        const first = mobileDrawerEntries[0];
                        if (first) setActiveMobilePanelKey(first.key);
                        e.preventDefault();
                      } else if (e.key === 'End') {
                        const last = mobileDrawerEntries[mobileDrawerEntries.length - 1];
                        if (last) setActiveMobilePanelKey(last.key);
                        e.preventDefault();
                      }
                    }}
                  >
                    {entry.title}
                  </button>
                );
              })}
            </div>
            <div
              className="plugin-mobile-drawer__body"
              role="tabpanel"
              id={activeMobilePanel ? `plugin-mobile-drawer-panel-${activeMobilePanel.key}` : undefined}
              aria-labelledby={activeMobilePanel ? `plugin-mobile-drawer-tab-${activeMobilePanel.key}` : undefined}
            >
              {activeMobilePanel?.mobileElement || activeMobilePanel?.element || null}
            </div>
          </div>
          <button
            ref={toggleButtonRef}
            type="button"
            className="plugin-mobile-drawer__toggle"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            aria-expanded={mobileDrawerOpen}
          >
            {activeMobilePanel?.title || 'Panels'}
          </button>
        </>
      )}
    </>
  );
}

export default PluginHost;
