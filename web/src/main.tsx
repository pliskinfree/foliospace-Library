import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

class BootErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="bootError" role="alert">
          <h1>FolioSpace Library failed to start</h1>
          <pre>{this.state.error.message}</pre>
        </main>
      );
    }
    return this.props.children;
  }
}

async function render() {
  const params = new URLSearchParams(window.location.search);
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  const children = params.get("website") === "1" ? React.createElement((await import("./Website")).Website) : <App />;

  root.render(
    <React.StrictMode>
      <BootErrorBoundary>{children}</BootErrorBoundary>
    </React.StrictMode>,
  );
}

void render();
