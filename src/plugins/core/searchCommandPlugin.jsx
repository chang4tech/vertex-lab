export const searchCommandPlugin = {
  id: 'core.search',
  name: 'Search',
  nameMessageId: 'plugin.search.name',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    commands: [
      {
        id: 'core.search.open',
        title: 'Open Search',
        when: 'canvas',
        run: (api) => {
          if (typeof api?.openSearch === 'function') api.openSearch();
          else if (typeof window !== 'undefined') {
            try { window.dispatchEvent(new CustomEvent('vertex:open-search')); } catch {}
          }
        },
      },
    ],
  },
};

export default searchCommandPlugin;

