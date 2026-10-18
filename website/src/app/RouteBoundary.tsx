import { Component, type ReactNode } from 'react';
import { Container, ErrorState } from '../ui';

interface State { error: Error | null }

/**
 * Catches a page that throws or a lazy chunk that fails to download (offline, stale deploy).
 * Keyed by route in App, so moving to another page clears it. Retry reloads, which refetches the chunk.
 */
export class RouteBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = /dynamically imported module|Failed to fetch|Loading chunk/i.test(error.message);
    return (
      <Container className="py-20">
        <ErrorState
          title={chunk ? 'This page could not be downloaded' : 'This page failed to render'}
          detail={error.message}
          onRetry={() => window.location.reload()}
          retryLabel="Reload page">
          {chunk
            ? 'The connection dropped or the site was updated while you were reading. Reloading fetches the current version.'
            : 'Something in this page broke. Reloading usually fixes it; if it does not, the other pages still work.'}
        </ErrorState>
      </Container>
    );
  }
}
