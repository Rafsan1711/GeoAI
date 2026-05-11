import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AtlasCharacter, AtlasBubble } from '../atlas';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 selection:bg-accent-cyan/30">
          <div className="max-w-md w-full text-center flex flex-col items-center">
            <div className="mb-8 relative pr-[100px]">
              <AtlasCharacter size="lg" showLabel={false} animate={true} />
              <div className="absolute top-0 right-0">
                <AtlasBubble message="Something went wrong." side="right" />
              </div>
            </div>
            
            <h1 className="text-3xl font-black font-sans tracking-tight text-accent-red mb-3">
              Glitch in the Engine
            </h1>
            
            <p className="text-text-secondary mb-8">
              The Atlas Engine encountered an unexpected error. Don't worry, even the smartest maps need a refresh sometimes.
            </p>
            
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 bg-text-primary text-black font-medium rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Restart Atlas Engine
            </button>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 p-4 bg-bg-surface border border-accent-red/30 rounded-lg text-left overflow-auto w-full text-xs font-mono text-accent-red/80">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
