interface MapHUDProps {
  zoom: number;
  pitch: number;
}

export function MapHUD({ zoom, pitch }: MapHUDProps) {
  return (
    <div className="absolute top-3 left-3 z-10 pointer-events-none">
      <div className="bg-[#090D16]/95 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300">
        <div className="text-[10px] text-slate-500 uppercase">
          Tallinn Sector Radar
        </div>

        <div className="mt-1 flex gap-3">
          <span className="text-rose-400">Critical</span>
          <span className="text-amber-400">Warning</span>
          <span className="text-blue-400">Nominal</span>
        </div>

        <div className="mt-1 text-[9px] text-slate-500">
          ZOOM: {zoom.toFixed(1)}
          {" | "}
          PITCH: {pitch.toFixed(0)}°
        </div>
      </div>
    </div>
  );
}
