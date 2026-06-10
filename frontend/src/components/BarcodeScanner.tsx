import { Button } from 'antd';
import { Camera, X } from 'lucide-react';
import * as React from 'react';

type Props = {
  onScan: (code: string) => void;
};

export function BarcodeScanner({ onScan }: Props) {
  const [open, setOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<{ stop: () => void } | null>(null);

  const stopCamera = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current ?? undefined,
          (result) => {
            if (cancelled || !result) return;
            onScan(result.getText());
            setOpen(false);
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch {
        onScan('');
        setOpen(false);
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, onScan, stopCamera]);

  if (!open) {
    return (
      <Button icon={<Camera size={16} />} onClick={() => setOpen(true)}>
        Quét mã
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
        <Button
          className="absolute top-2 right-2"
          icon={<X size={16} />}
          onClick={() => setOpen(false)}
        />
        <p className="text-center text-white text-sm py-2">Đưa mã vạch vào khung hình</p>
      </div>
    </div>
  );
}
