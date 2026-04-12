import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          background: "#fff", 
          minHeight: "100vh", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif"
        }}>
          <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>Something went wrong.</h2>
          <p style={{ color: "#64748b", maxWidth: "400px", marginBottom: "24px" }}>
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: "12px 24px", 
              background: "#22c55e", 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              fontWeight: 600, 
              cursor: "pointer" 
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ 
              marginTop: "40px", 
              textAlign: "left", 
              background: "#f1f5f9", 
              padding: "20px", 
              borderRadius: "8px", 
              fontSize: "0.8rem", 
              overflow: "auto", 
              maxWidth: "90%" 
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
