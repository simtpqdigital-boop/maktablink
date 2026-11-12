import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-8 mx-auto max-w-md bg-[#083834] border border-teal-500/30 rounded-3xl text-center space-y-4 text-white shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black font-['Outfit']">Terjadi Kendala Tampilan</h3>
            <p className="text-xs text-teal-200/70 mt-1">
              {this.state.error?.message || 'Sistem mendeteksi kendala pada tampilan scanner saat beralih tab.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center space-x-2 mx-auto active:scale-95 transition-all font-['Outfit']"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
