import * as React from 'react';
import { Button } from 'antd';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-800">Đã xảy ra lỗi</h1>
          <p className="text-sm text-slate-500 max-w-md text-center">{this.state.message}</p>
          <Button type="primary" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
