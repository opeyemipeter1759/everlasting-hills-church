"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Printer } from "lucide-react";

type Props = {
  text: string | null;
  open: boolean;
  onClose: () => void;
  title?: string;
};

export default function QRCodeModal({ text, open, onClose, title }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setDataUrl(null);
    if (open && text) {
      QRCode.toDataURL(text, { errorCorrectionLevel: "H", margin: 2, width: 360 })
        .then((url) => mounted && setDataUrl(url))
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [open, text]);

  const handlePrint = () => {
    if (!dataUrl) return;
    const w = window.open("");
    if (w) {
      w.document.write(`<img src="${dataUrl}" onload="window.print();window.close()"/>`);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-church-dark">{title ?? "QR Code"}</h3>
            <p className="text-sm text-church-dark/60 mt-1">Scan to pay or save the account.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} aria-label="Print QR" className="p-2 rounded-md hover:bg-black/5">
              <Printer size={16} />
            </button>
            <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-md hover:bg-black/5">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" className="w-64 h-64 object-contain" />
          ) : (
            <div className="py-10 text-church-dark/60">Generating…</div>
          )}
        </div>

        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-white/5 text-church-dark">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
