import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PluginErrorBoundary from './PluginErrorBoundary.jsx';
import { appendPluginLog } from './errorLog.js';

function PanelRenderer({ render, appApi }) {
  // Call provided render so errors bubble to the boundary above
  return render(appApi);
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
  const [collapsedPanels, setCollapsedPanels] = useState(() => new Set());
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeMobilePanelKey, setActiveMobilePanelKey] = useState(null);

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
        pointerEvents: 'none',
        maxHeight: maxHeightValue,
        maxWidth: 'min(340px, calc(100vw - 32px))',
        zIndex: 10115,
      };

  useEffect(() => {
    if (typeof onSidePanelWidthChange !== 'function') return undefined;
    if (hideSidePanels || sidePanelEntries.length === 0) {
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
  }, [onSidePanelWidthChange, hideSidePanels, sidePanelEntries.length]);

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

  const handleCollapseChange = useCallback((key, nextOpen) => {
    setCollapsedPanels((prev) => {
      const next = new Set(prev instanceof Set ? prev : []);
      if (nextOpen) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

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

  const activeMobilePanel = mobileDrawerEntries.find((entry) => entry.key === activeMobilePanelKey) || null;
  const activeMobilePanelLabelId = activeMobilePanel ? `plugin-mobile-drawer-tab-${activeMobilePanel.key}` : undefined;

  return (
    <>
      {visibleDesktopEntries.length > 0 && !hideSidePanels && (
        <div ref={containerRef} className="plugin-side-panels" style={sidePanelContainerStyle}>
          <div className="plugin-side-panels__scroll" style={{ maxHeight: maxHeightValue }}>
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
                      <span className="plugin-side-panels__arrow" aria-hidden="true">›</span>
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
      {mobileDrawerEntries.length > 0 && !hideSidePanels && (
        <>
          <div
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
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close panel drawer"
              >
                ✕
              </button>
            </div>
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
                    className={`plugin-mobile-drawer__tab ${isActive ? 'plugin-mobile-drawer__tab--active' : ''}`}
                    onClick={() => setActiveMobilePanelKey(entry.key)}
                  >
                    {entry.title}
                  </button>
                );
              })}
            </div>
            <div className="plugin-mobile-drawer__body">
              {activeMobilePanel?.mobileElement || activeMobilePanel?.element || null}
            </div>
          </div>
          <button
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
