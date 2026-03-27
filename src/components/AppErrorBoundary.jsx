import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Unhandled React error:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="section">
          <div className="container">
            <div className="glass-card empty-state">
              <span className="eyebrow">Something Broke</span>
              <h2>We hit an unexpected app error.</h2>
              <p>Please reload the page and try again.</p>
              <button type="button" className="btn btn--primary" onClick={this.handleReload}>
                Reload App
              </button>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
