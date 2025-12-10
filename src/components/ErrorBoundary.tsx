import React, { Component, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ErrorBoundary caught error:', error);
    console.error('🔴 Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback se fornito
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback di default
      return (
        <div className="error-boundary-container">
          <h2 className="error-boundary-title">
            ⚠️ Si è verificato un errore
          </h2>
          
          <p className="error-boundary-message">
            Il sistema di prenotazione ha riscontrato un problema. 
            Puoi provare a ricaricare la pagina o contattarci direttamente.
          </p>

          <details className="error-boundary-details">
            <summary className="error-boundary-details-summary">
              Dettagli tecnici (per sviluppatori)
            </summary>
            <pre className="error-boundary-details-pre">
              <strong>Errore:</strong>{'\n'}
              {this.state.error?.toString()}{'\n\n'}
              <strong>Stack:</strong>{'\n'}
              {this.state.error?.stack}
            </pre>
          </details>

          <div className="error-boundary-actions">
            <button
              onClick={this.handleReset}
              className="error-boundary-btn error-boundary-btn-retry"
            >
              🔄 Riprova
            </button>

            <button
              onClick={() => window.location.reload()}
              className="error-boundary-btn error-boundary-btn-reload"
            >
              ↻ Ricarica Pagina
            </button>

            <a
              href="mailto:info@vincantomaori.it"
              className="error-boundary-link-contact"
            >
              📧 Contattaci
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
