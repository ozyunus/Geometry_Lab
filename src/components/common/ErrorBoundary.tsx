import React, { Component, ErrorInfo, ReactNode } from 'react';
import analytics from '../../services/analytics';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackExperience?: 'adults' | 'kids';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analytics.trackError({
      error_category: 'ui_boundary',
      message: error.message || 'Unknown component rendering error',
      stack_summary: (errorInfo.componentStack || error.stack || '').slice(0, 300),
      affected_experience: this.props.fallbackExperience || analytics.getExperience(),
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-white/80 rounded-2xl border border-red-200 shadow-sm m-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Bir şeyler beklenmedik şekilde durdu / Something went wrong
          </h3>
          <p className="text-sm text-slate-600 max-w-md mb-4">
            Çizim veya ders durumunuz korundu. Sayfayı yenilemeden bu adımı tekrar deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087D86] text-white text-sm font-bold shadow-sm hover:opacity-90 transition cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Yeniden Dene / Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
