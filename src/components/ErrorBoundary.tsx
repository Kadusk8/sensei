import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
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
                <div className="min-h-screen bg-zinc-950 text-white p-10 flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Algo deu errado! 💥</h1>
                    <div className="bg-zinc-900 p-6 rounded-lg border border-red-900 max-w-2xl w-full overflow-auto">
                        <h2 className="text-xl font-mono text-red-400 mb-2">{this.state.error?.name}</h2>
                        <p className="font-mono text-zinc-300 whitespace-pre-wrap">{this.state.error?.message}</p>
                        {this.state.error?.stack && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <pre className="text-xs text-zinc-500 overflow-auto max-h-60">{this.state.error.stack}</pre>
                            </div>
                        )}
                    </div>
                    <button
                        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
