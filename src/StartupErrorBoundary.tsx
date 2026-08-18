import { Component, type ErrorInfo, type ReactNode } from "react";

const errorMessage = (reason: unknown) => reason instanceof Error ? reason.message : String(reason);

export const StartupError = ({ reason }: { reason: unknown }) => (
  <main className="startup-error" role="alert">
    <h1>Chyba při spuštění aplikace</h1>
    <p>{errorMessage(reason)}</p>
  </main>
);

export class StartupErrorBoundary extends Component<{ children: ReactNode }, { reason: unknown }> {
  state = { reason: null as unknown };

  static getDerivedStateFromError(reason: unknown) {
    return { reason };
  }

  componentDidCatch(reason: unknown, info: ErrorInfo) {
    console.error("POS startup error", reason, info);
  }

  render() {
    return this.state.reason ? <StartupError reason={this.state.reason} /> : this.props.children;
  }
}
