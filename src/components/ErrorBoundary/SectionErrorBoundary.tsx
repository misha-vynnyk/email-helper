import { OctagonAlert, RefreshCw } from "lucide-react";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);

    // Log error to our logger
    console.error(`Section Error Boundary [${this.props.sectionName}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='p-4'>
          <div className='flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200'>
            <OctagonAlert className='w-4 h-4 shrink-0 mt-0.5' />
            <div className='flex-1 min-w-0 text-xs leading-relaxed'>
              <p>
                Something went wrong in the <strong>{this.props.sectionName}</strong> section.
              </p>
              {this.state.error && <pre className='mt-1 text-[0.7rem] whitespace-pre-wrap break-words opacity-80'>{this.state.error.message}</pre>}
            </div>
            <button
              type='button'
              onClick={this.handleReset}
              className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shrink-0'>
              <RefreshCw className='w-3.5 h-3.5' />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC для зручного використання
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, sectionName: string, fallback?: ReactNode) {
  return function WithErrorBoundary(props: P) {
    return (
      <SectionErrorBoundary sectionName={sectionName} fallback={fallback}>
        <Component {...props} />
      </SectionErrorBoundary>
    );
  };
}
