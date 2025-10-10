import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HelpPanel } from '../../components/panels/HelpPanel';

const HELP_OVERLAY_LAYOUT_KEY = 'help';

function HelpOverlayContent({ api }) {
  const isHelpVisible = !!api?.isHelpVisible;
  const toggleHelp = api?.toggleHelp || (() => {});
  const overlayRightInset = Number.isFinite(api?.overlayRightInset) ? api.overlayRightInset : Number(api?.overlayRightInset) || 0;
  const overlayLayout = api?.overlayLayout;
  const setOverlayLayout = api?.setOverlayLayout;
  const isMobile = !!api?.isMobile;

  useEffect(() => {
    if (!setOverlayLayout) return;
    const hasEntry = overlayLayout?.items?.[HELP_OVERLAY_LAYOUT_KEY];
    if (!hasEntry) {
      setOverlayLayout({
        items: {
          [HELP_OVERLAY_LAYOUT_KEY]: {
            slot: 'top-right',
            order: isMobile ? 40 : 10,
          },
        },
      });
    }
  }, [overlayLayout?.items, setOverlayLayout, isMobile]);

  const triggerClass = useMemo(() => `trigger ${isHelpVisible ? 'active' : ''}`, [isHelpVisible]);

  const portalTarget = useMemo(() => (typeof document === 'undefined' ? null : document.body), []);

  const panelPortal = useMemo(() => (
    portalTarget
      ? createPortal(<HelpPanel isVisible={isHelpVisible} overlayRightInset={overlayRightInset} />, portalTarget)
      : null
  ), [portalTarget, isHelpVisible, overlayRightInset]);

  return (
    <React.Fragment>
      {panelPortal}
      <div
        className={triggerClass}
        role="button"
        aria-label={isHelpVisible ? 'Hide help' : 'Show help'}
        aria-pressed={isHelpVisible}
        tabIndex={0}
        title={isHelpVisible ? 'Hide help' : 'Show help'}
        onClick={toggleHelp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleHelp();
          }
        }}
      >
        {isHelpVisible ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 8a3 3 0 1 1 6 0c0 2-3 2.5-3 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        )}
        <div className="trigger-tooltip">{isHelpVisible ? '收起' : '帮助'}</div>
      </div>
    </React.Fragment>
  );
}

export const helpOverlayPlugin = {
  id: 'core.helpOverlay',
  name: 'Help Overlay',
  nameMessageId: 'plugin.helpOverlay.name',
  slots: {
    canvasOverlays: [
      {
        id: 'helpButton',
        layoutKey: HELP_OVERLAY_LAYOUT_KEY,
        render: (api) => <HelpOverlayContent api={api} />,
      },
    ],
  },
};

export default helpOverlayPlugin;
