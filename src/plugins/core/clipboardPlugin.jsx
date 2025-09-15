export const clipboardPlugin = {
  id: 'core.clipboard',
  name: 'Clipboard Tools',
  description: 'Commands to copy selection or node ids',
  slots: {
    commands: [
      {
        id: 'clipboard.copySelectionIds',
        title: 'Copy Selected IDs',
        when: (api) => (api?.selectedNodeIds?.length ?? 0) > 0,
        run: async (api) => {
          const text = (api?.selectedNodeIds || []).join(', ');
          try { await navigator.clipboard?.writeText?.(text); } catch {}
        },
      },
      {
        id: 'clipboard.copyNodeId',
        title: 'Copy Node ID',
        when: 'node',
        run: async (_api, ctx) => {
          try { await navigator.clipboard?.writeText?.(String(ctx?.nodeId ?? '')); } catch {}
        },
      },
    ],
  },
};

export default clipboardPlugin;

