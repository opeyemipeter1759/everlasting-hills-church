"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, Users, QrCode, Download, X } from "lucide-react";
import QRCode from "qrcode";

type Service = {
  id: string;
  name: string;
  scheduledAt: string;
  attendanceCount: number;
  qrUrl: string;
};

function relDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function QRModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, service.qrUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#1a0008", light: "#ffffff" },
      });
    }
  }, [service.qrUrl]);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `qr-${service.name.replace(/\s+/g, "-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 p-6 max-w-sm w-full space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{service.name}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{relDate(service.scheduledAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center bg-white rounded-xl p-3 border border-gray-100">
          <canvas ref={canvasRef} />
        </div>

        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
          Members scan this QR code to check in to this service.
        </p>

        <button
          type="button"
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#87102C] text-white hover:bg-[#6E0C24] transition-colors"
        >
          <Download size={15} />
          Download QR Code
        </button>
      </div>
    </div>
  );
}

export default function ServicesView({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Services</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            View service history and generate QR codes for member check-in.
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Calendar size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No services yet.</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Services are created automatically when the first check-in happens on a given day.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Service History
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {services.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/8">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-[#87102C] dark:text-[#e8768a]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{relDate(s.scheduledAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  <Users size={12} />
                  <span className="font-semibold">{s.attendanceCount}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-[#87102C]/10 dark:hover:bg-[#87102C]/20 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors flex-shrink-0"
                >
                  <QrCode size={13} />
                  QR Code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <QRModal service={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
