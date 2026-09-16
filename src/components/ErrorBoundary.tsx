import { Component, type ReactNode, type ErrorInfo } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Do not log financial data or credentials. */
  }
  render() {
    if (this.state.error)
      return (
        <main className="state">
          <h1>This page could not be loaded</h1>
          <p>Please refresh the page and try again.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </main>
      );
    return this.props.children;
  }
}
