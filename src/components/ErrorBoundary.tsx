import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Menangkap error saat memuat chunk lazy (mis. gagal jaringan saat
 * download chunk AdminDashboard/APanel) agar aplikasi tidak blank total.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Gagal memuat halaman/chunk:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#b91c1c', fontWeight: 600 }}>⚠️ Terjadi kesalahan saat memuat halaman.</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Silakan periksa koneksi internet Anda, lalu coba lagi.</p>
          <button className="btn-save" onClick={this.handleRetry} style={{ marginTop: '10px' }}>
            🔄 Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
