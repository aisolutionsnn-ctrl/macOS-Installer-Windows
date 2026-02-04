
import React, { useEffect, useRef } from 'react';

interface TerminalProps {
  logs: string[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0c0c0e] rounded-lg border border-zinc-800 p-4 font-mono text-sm h-64 overflow-y-auto" ref={terminalRef}>
      <div className="flex gap-2 mb-2 border-b border-zinc-900 pb-2">
        <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/30"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/30"></div>
        <span className="text-zinc-600 ml-2">hackinflow-daemon.log</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-emerald-500 mr-2">❯</span>
          <span className={log.startsWith('[ERROR]') ? 'text-red-400' : 'text-zinc-300'}>
            {log}
          </span>
        </div>
      ))}
      <div className="animate-pulse h-4 w-2 bg-zinc-700 mt-1"></div>
    </div>
  );
};

export default Terminal;
