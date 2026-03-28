import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error boundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="section">
          <div className="container">
            <div className="app-error-boundary glass-card">
              <span className="eyebrow">Something went wrong</span>
              <h2>The page ran into an unexpected problem.</h2>
              <p>Try refreshing the page. If the issue continues, go back to Home and try again.</p>
              <div className="app-error-boundary__actions">
                <button type="button" className="btn btn--primary" onClick={this.handleReload}>
                  Reload Page
                </button>
                <button type="button" className="btn btn--secondary" onClick={this.handleGoHome}>
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
