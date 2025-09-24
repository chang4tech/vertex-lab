import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useUser } from '../contexts/UserProvider.jsx';

function ProfilePage() {
  const { user, status, error, library, isLibraryLoading, refreshLibrary, deleteLibraryGraph, refreshUser } = useUser();
  const [actionError, setActionError] = React.useState(null);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      sessionStorage.setItem('vertex_auth_return', '#/profile');
      window.location.hash = '#/login';
    }
  }, [status]);

  React.useEffect(() => {
    if (status === 'authenticated') {
      refreshLibrary().catch(() => {});
    }
  }, [status, refreshLibrary]);

  if (status === 'loading') {
    return (
      <CenteredContainer>
        <FormattedMessage id="profile.loading" defaultMessage="Loading your profile…" />
      </CenteredContainer>
    );
  }

  if (status === 'error') {
    return (
      <CenteredContainer>
        <div style={{ color: '#dc2626' }}>
          <FormattedMessage id="profile.loadError" defaultMessage="Unable to load your profile." />
          {error && <div style={{ marginTop: 8, fontSize: 13 }}>{String(error.message || error)}</div>}
        </div>
      </CenteredContainer>
    );
  }

  if (!user) {
    return null;
  }

  const metadataEntries = user.metadata && typeof user.metadata === 'object'
    ? Object.entries(user.metadata)
    : [];

  const hasLibraryEntries = Array.isArray(library) && library.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>
            <FormattedMessage id="profile.title" defaultMessage="Your profile" />
          </h1>
          <div style={{ color: '#4b5563', fontSize: 14 }}>
            {user.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              const fallback = sessionStorage.getItem('vertex_auth_return') || '#/';
              window.location.hash = fallback;
            }}
            style={secondaryButtonStyle}
          >
            <FormattedMessage id="profile.back" defaultMessage="Back" />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              } catch (logoutError) {
                console.error('[profile] logout error', logoutError);
              }
              await refreshUser();
              window.location.hash = '#/';
            }}
            style={dangerButtonStyle}
          >
            <FormattedMessage id="profile.logout" defaultMessage="Sign out" />
          </button>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          <FormattedMessage id="profile.basicInfo" defaultMessage="Basic information" />
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          <li><strong><FormattedMessage id="profile.name" defaultMessage="Name" />:</strong> {user.name || <FormattedMessage id="profile.missing" defaultMessage="Not provided" />}</li>
          <li><strong><FormattedMessage id="profile.email" defaultMessage="Email" />:</strong> {user.email}</li>
          <li><strong><FormattedMessage id="profile.created" defaultMessage="Account created" />:</strong> {formatDate(user.createdAt)}</li>
          <li><strong><FormattedMessage id="profile.updated" defaultMessage="Last updated" />:</strong> {formatDate(user.updatedAt)}</li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          <FormattedMessage id="profile.metadata" defaultMessage="Metadata" />
        </h2>
        {metadataEntries.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 14 }}>
            <FormattedMessage id="profile.noMetadata" defaultMessage="No additional metadata available." />
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            {metadataEntries.map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {renderMetadataValue(value)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={cardStyle}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={sectionTitleStyle}>
            <FormattedMessage id="profile.library" defaultMessage="Your library" />
          </h2>
          <button
            type="button"
            onClick={() => refreshLibrary().catch(err => setActionError(err.message || 'Failed to refresh library'))}
            style={secondaryButtonStyle}
            disabled={isLibraryLoading}
          >
            <FormattedMessage id="profile.refresh" defaultMessage="Refresh" />
          </button>
        </header>
        {actionError && (
          <div style={{ color: '#dc2626', marginBottom: 8, fontSize: 13 }}>{actionError}</div>
        )}
        {isLibraryLoading && (
          <div style={{ color: '#4b5563', fontSize: 14 }}>
            <FormattedMessage id="profile.libraryLoading" defaultMessage="Syncing your library…" />
          </div>
        )}
        {!hasLibraryEntries && !isLibraryLoading && (
          <div style={{ color: '#4b5563', fontSize: 14 }}>
            <FormattedMessage id="profile.libraryEmpty" defaultMessage="You have not saved any graphs yet." />
          </div>
        )}
        {hasLibraryEntries && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {library.map((entry) => (
              <li key={entry.id} style={{ border: '1px solid var(--input-border, #d1d5db)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600 }}>{entry.name}</div>
                <div style={{ fontSize: 13, color: '#4b5563' }}>
                  <FormattedMessage id="profile.libraryMeta" defaultMessage="{nodes} nodes · {edges} edges" values={{ nodes: entry.nodes?.length ?? 0, edges: entry.edges?.length ?? 0 }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  <FormattedMessage id="profile.libraryUpdated" defaultMessage="Updated {time}" values={{ time: formatDate(entry.updatedAt) }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('vertex_loaded_graph', JSON.stringify({ nodes: entry.nodes, edges: entry.edges }));
                      const returnHash = sessionStorage.getItem('vertex_auth_return') || '#/';
                      window.location.hash = returnHash;
                    }}
                    style={secondaryButtonStyle}
                  >
                    <FormattedMessage id="profile.loadInCanvas" defaultMessage="Open in canvas" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setActionError(null);
                      try {
                        await deleteLibraryGraph(entry.graphId ?? entry.id);
                      } catch (err) {
                        setActionError(err.message || 'Failed to delete graph');
                      }
                    }}
                    style={dangerButtonStyle}
                  >
                    <FormattedMessage id="profile.deleteGraph" defaultMessage="Delete" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function renderMetadataValue(value) {
  if (value == null) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return String(value);
    }
  }
  return String(value);
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  } catch (err) {
    return String(value);
  }
}

const cardStyle = {
  background: 'var(--panel-background, #ffffff)',
  border: '1px solid var(--panel-border, #e5e7eb)',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
};

const sectionTitleStyle = {
  margin: 0,
  marginBottom: 12,
  fontSize: 18,
};

const secondaryButtonStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--input-border, #d1d5db)',
  background: 'var(--panel-background, #ffffff)',
  color: '#2563eb',
  cursor: 'pointer',
  fontWeight: 600,
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  border: '1px solid rgba(220, 38, 38, 0.4)',
  color: '#dc2626',
};

function CenteredContainer({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', color: '#4b5563' }}>{children}</div>
    </div>
  );
}

export default ProfilePage;
