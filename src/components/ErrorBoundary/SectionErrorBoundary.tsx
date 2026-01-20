import React, { Component, ErrorInfo, ReactNode } from "react";

import { Refresh as RefreshIcon } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";

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
        <Box p={2}>
          <Alert
            severity='error'
            action={
              <Button
                color='inherit'
                size='small'
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Retry
              </Button>
            }
          >
            <Typography
              variant='body2'
              gutterBottom
            >
              Something went wrong in the <strong>{this.props.sectionName}</strong> section.
            </Typography>
            {this.state.error && (
              <Typography
                variant='caption'
                component='pre'
                sx={{ mt: 1, fontSize: "0.75rem" }}
              >
                {this.state.error.message}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// HOC для зручного використання
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  sectionName: string,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <SectionErrorBoundary
        sectionName={sectionName}
        fallback={fallback}
      >
        <Component {...props} />
      </SectionErrorBoundary>
    );
  };
}
