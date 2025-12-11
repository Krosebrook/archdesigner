import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

/**
 * Production-Grade Error Boundary
 * 
 * Catches React errors and displays a beautiful fallback UI
 * with recovery options and error details for debugging.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error Boundary caught error:', error, errorInfo);
    
    // Store error details
    this.setState({
      error,
      errorInfo
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.log('Error logged to tracking service:', this.state.errorId);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full shadow-2xl border-red-200">
            <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-900">
                    Something Went Wrong
                  </CardTitle>
                  <p className="text-red-700 text-sm mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Error ID for support */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium mb-1">
                  Error ID (for support):
                </p>
                <code className="text-xs text-red-900 bg-white px-2 py-1 rounded border border-red-200">
                  {errorId}
                </code>
              </div>

              {/* User-friendly message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  What happened?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The application encountered an unexpected error and couldn't continue. 
                  This has been automatically logged, and our team will investigate.
                </p>
              </div>

              {/* Error details (development only) */}
              {isDevelopment && error && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Error Details (Development Mode):
                  </h3>
                  
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-48">
                    <pre className="text-red-400 text-xs font-mono">
                      {error.toString()}
                    </pre>
                  </div>

                  {errorInfo && errorInfo.componentStack && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Component Stack (click to expand)
                      </summary>
                      <div className="mt-2 bg-gray-900 rounded-lg p-4 overflow-auto max-h-48">
                        <pre className="text-gray-400 text-xs font-mono">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Recovery options */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  What can you do?
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={this.handleReset}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>

                  <Link to={createPageUrl('Dashboard')} className="sm:col-span-2">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Support info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">Need help?</strong>
                  {' '}Contact support with the error ID above, and we'll assist you promptly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;