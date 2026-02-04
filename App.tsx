
import React, { useState, useEffect } from 'react';
import { AppStep, AppState, MacOSVersion, MacModel } from './types';
import { MACOS_VERSIONS, MAC_MODELS, CPU_GENERATIONS } from './constants';
import { backend } from './services/backendService';
import { getCompatibilityAdvice } from './services/geminiService';
import Terminal from './components/Terminal';

const App: React.FC = () => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState(false);

  const [state, setState] = useState<AppState>({
    step: AppStep.WELCOME,
    hardware: {
      systemType: 'pc',
      cpuType: 'intel',
      generation: 'Coffee/Comet Lake (8th/10th)',
      gpuType: 'amd',
      gpuModel: 'Radeon RX 580',
      laptop: false,
      macModel: null,
    },
    selectedDrive: null,
    selectedMacOS: null,
    localSource: false,
    localPath: null,
    isProcessing: false,
    isDownloadOnly: false,
    progress: 0,
    logs: [],
    error: null,
  });

  useEffect(() => {
    const framed = backend.isFramed();
    setIsFramed(framed);
    if (framed) {
      setErrorMessage("RESTRIKCIJA: Aplikacija je unutar iframe-a. Browser blokira direktan pristup disku radi bezbednosti.");
    }
  }, []);

  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setState(prev => ({ 
      ...prev, 
      logs: [...prev.logs, `${timestamp} ${isError ? '[ERROR]' : '[INFO]'} ${message}`] 
    }));
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handlePickFolder = async () => {
    if (isFramed) {
      setErrorMessage("Nije moguće odabrati HDD dok je aplikacija u iframe-u. Molimo kliknite na 'Otvori u novom tabu'.");
      return;
    }
    
    setErrorMessage(null);
    const result = await backend.selectLocalFolder();
    
    if (result && 'error' in result) {
      setErrorMessage(result.error);
      addLog(result.error, true);
      return;
    }

    if (result && 'path' in result && !('error' in result)) {
      if ('handle' in result && result.handle) {
        setDirectoryHandle(result.handle);
        setSelectedPath(null);
      } else {
        setDirectoryHandle(null);
        setSelectedPath(result.path);
      }
      setState(p => ({ ...p, localPath: result.path }));
      addLog(`Disk folder povezan: ${result.path}`);
    }
  };

  const runAiAnalysis = async () => {
    setIsAiLoading(true);
    const advice = await getCompatibilityAdvice(state.hardware);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (state.step === AppStep.CONFIG_PREVIEW) {
      runAiAnalysis();
    }
  }, [state.step]);

  const startAutomation = async () => {
    const hasTarget = directoryHandle || selectedPath;
    if (!hasTarget || !state.selectedMacOS) return;
    setState(prev => ({ ...prev, step: AppStep.PROCESSING, isProcessing: true, logs: [], progress: 0 }));
    try {
      addLog(`[GIB-MAC] Preuzimanje kataloga od Apple-a za ${state.selectedMacOS.name}...`);
      const downloadUrl = await backend.getMacOsDownloadUrl(state.selectedMacOS.version, state.selectedMacOS.build);
      if (!downloadUrl) throw new Error("Nije pronađen validan link za preuzimanje.");
      const fileName = `InstallAssistant_${state.selectedMacOS.version}.pkg`;
      const generation = state.hardware.systemType === 'pc' ? state.hardware.generation : (state.hardware.macModel?.identifier ?? '');

      if (selectedPath && backend.isElectron()) {
        addLog(`[STORAGE] Electron: upis u ${selectedPath}...`);
        const downloadResult = await backend.runAutomationElectron(
          selectedPath,
          downloadUrl,
          fileName,
          generation,
          (p) => setState(prev => ({ ...prev, progress: p }))
        );
        if (!downloadResult.success) throw new Error(downloadResult.message);
      } else if (directoryHandle) {
        addLog(`[STORAGE] Otvaranje stream-a ka: ${directoryHandle.name}...`);
        const downloadResult = await backend.downloadToDirectory(directoryHandle, downloadUrl, fileName, (p) => {
          setState(prev => ({ ...prev, progress: p }));
        });
        if (!downloadResult.success) throw new Error(downloadResult.message);
        addLog(`[OPENCORE] Generisanje EFI...`);
        await backend.generateEFI(directoryHandle, generation);
      } else return;

      addLog(`[SUCCESS] Proces završen.`);
      setState(prev => ({ ...prev, isProcessing: false, step: AppStep.FINISHED, progress: 100 }));
    } catch (err: any) {
      addLog(err.message, true);
      setState(prev => ({ ...prev, isProcessing: false, error: { code: 'ERR', message: err.message, details: '', suggestions: [] } }));
    }
  };

  const handleNext = () => {
    if (state.step === AppStep.CONFIG_PREVIEW) {
      startAutomation();
    } else if (state.step === AppStep.SYSTEM_TYPE) {
      setState(p => ({ ...p, step: AppStep.HARDWARE_SELECT }));
    } else if (state.step === AppStep.HARDWARE_SELECT) {
      setState(p => ({ ...p, step: AppStep.MACOS_SELECT }));
    } else {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  return (
    <div className="h-screen flex flex-col items-center bg-[#0a0a0c] text-[#e4e4e7] p-3 overflow-hidden">
      <div className="w-full max-w-5xl flex flex-col h-full">
        
        <header className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter leading-none">HackinFlow</h1>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">v2.5 Hybrid Engine</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFramed && (
              <button 
                onClick={openInNewTab}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-bold uppercase hover:bg-amber-500/30 transition-all animate-pulse"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Otvori u novom tabu (FIX)
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className={`w-1.5 h-1.5 rounded-full ${backend.isSupported() && !isFramed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                {backend.isSupported() && !isFramed ? 'Disk API Active' : 'Access Restricted'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col overflow-hidden">
          <div className="glass-panel flex-grow rounded-[1.5rem] overflow-hidden shadow-2xl relative flex flex-col border border-white/5">
            <div className="flex-grow overflow-y-auto p-4 md:p-6">
              
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                  <div className="text-xl">⚠️</div>
                  <div className="flex-grow">
                    <div className="text-[11px] font-black text-red-400 uppercase mb-0.5">Greška Browser Restrikcije</div>
                    <div className="text-[10px] text-red-300 leading-tight">{errorMessage}</div>
                  </div>
                  {isFramed && (
                    <button onClick={openInNewTab} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-400 transition-all">Fix Now</button>
                  )}
                </div>
              )}

              {state.step === AppStep.WELCOME && (
                <div className="h-full flex flex-col justify-center max-w-xl">
                  <h2 className="text-4xl font-black mb-3 leading-tight text-white tracking-tight">
                    Real macOS <br/> <span className="text-indigo-500 text-3xl">Direct From Apple CDN.</span>
                  </h2>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Automatsko preuzimanje zvaničnih macOS instalera i priprema OpenCore EFI particije direktno na vaš disk ili USB.
                  </p>
                  <button onClick={handleNext} className="h-12 w-fit px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                    Pokreni Proces
                  </button>
                </div>
              )}

              {state.step === AppStep.SYSTEM_TYPE && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Odaberite Tip Sistema</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setState(p => ({ ...p, hardware: { ...p.hardware, systemType: 'pc' } })); handleNext(); }} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500 text-left transition-all">
                      <div className="text-2xl mb-1">🖥️</div>
                      <div className="text-base font-bold text-white">Hackintosh PC</div>
                      <div className="text-[10px] text-zinc-500 uppercase">Intel/AMD Custom Hardware</div>
                    </button>
                    <button onClick={() => { setState(p => ({ ...p, hardware: { ...p.hardware, systemType: 'mac' } })); handleNext(); }} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500 text-left transition-all">
                      <div className="text-2xl mb-1">🍎</div>
                      <div className="text-base font-bold text-white">Legacy Mac</div>
                      <div className="text-[10px] text-zinc-500 uppercase">iMac / MacBook Pro / Mini</div>
                    </button>
                  </div>
                </div>
              )}

              {state.step === AppStep.HARDWARE_SELECT && (
                <div className="h-full flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-4">Podešavanje Hardvera</h3>
                  {state.hardware.systemType === 'pc' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-zinc-500 ml-1">CPU Proizvođač</label>
                        <div className="flex gap-2">
                          {['intel', 'amd'].map(v => (
                            <button key={v} onClick={() => setState(p => ({ ...p, hardware: { ...p.hardware, cpuType: v as any } }))} className={`flex-1 h-10 rounded-xl font-bold uppercase text-[10px] border ${state.hardware.cpuType === v ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-zinc-800 text-zinc-500'}`}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-zinc-500 ml-1">Generacija</label>
                        <select className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs" value={state.hardware.generation} onChange={(e) => setState(p => ({ ...p, hardware: { ...p.hardware, generation: e.target.value } }))}>
                          {(CPU_GENERATIONS as any)[state.hardware.cpuType].map((gen: string) => <option key={gen} value={gen}>{gen}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                      {MAC_MODELS.map(model => (
                        <button key={model.id} onClick={() => setState(p => ({ ...p, hardware: { ...p.hardware, macModel: model } }))} className={`p-2.5 rounded-xl border text-left transition-all ${state.hardware.macModel?.id === model.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/20'}`}>
                          <div className="text-[10px] font-bold text-white truncate">{model.name}</div>
                          <div className="text-[8px] text-zinc-500 font-mono truncate">{model.identifier}</div>
                          <div className="text-[8px] text-indigo-400 mt-0.5">{model.year}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-4 flex justify-end">
                    <button onClick={handleNext} disabled={state.hardware.systemType === 'mac' && !state.hardware.macModel} className="h-10 px-8 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-20 transition-all">Nastavi</button>
                  </div>
                </div>
              )}

              {state.step === AppStep.MACOS_SELECT && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">macOS Verzija & Disk</h3>
                    <button 
                      onClick={handlePickFolder} 
                      className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg transition-all ${(directoryHandle || selectedPath) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : (isFramed ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-indigo-600 text-white hover:bg-indigo-500')}`}
                    >
                      {(directoryHandle || selectedPath) ? '✅ Disk Povezan' : (isFramed ? '🔒 Access Blocked' : '📁 Odaberi Disk/Folder')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {MACOS_VERSIONS.map(mac => (
                      <button key={mac.build} onClick={() => setState(p => ({ ...p, selectedMacOS: mac }))} className={`p-3 rounded-xl border transition-all text-left ${state.selectedMacOS?.build === mac.build ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                        <div className="font-bold text-[11px] text-white truncate">{mac.name}</div>
                        <div className="text-[8px] text-zinc-500 font-mono">{mac.version} • {mac.size}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.step === AppStep.CONFIG_PREVIEW && (
                <div className="h-full flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-4">Pregled Konfiguracije</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <SummaryItem label="Hardver" value={state.hardware.systemType === 'pc' ? state.hardware.generation : state.hardware.macModel?.name || ""} />
                    <SummaryItem label="macOS" value={state.selectedMacOS?.name || ""} />
                  </div>
                  
                  <div className="flex-grow bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 relative overflow-hidden">
                    <div className="absolute top-2 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span className="text-[7px] font-black text-white uppercase tracking-widest">Gemini AI Analysis</span>
                    </div>
                    <div className="text-[10px] font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap">
                      {isAiLoading ? 'Analyzing compatibility with Gemini 3...' : aiAdvice}
                    </div>
                  </div>

                  <button onClick={handleNext} disabled={!(directoryHandle || selectedPath) || !state.selectedMacOS || isFramed} className="mt-4 w-full h-12 bg-indigo-600 text-white text-sm font-black rounded-xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-20">
                    Pokreni Automatizaciju
                  </button>
                </div>
              )}

              {state.step === AppStep.PROCESSING && (
                <div className="h-full flex flex-col">
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-black text-white mb-1">Preuzimanje sa Apple Servera...</h3>
                    <div className="text-3xl font-black text-indigo-500 mb-2">{state.progress}%</div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${state.progress}%` }}></div>
                    </div>
                  </div>
                  <Terminal logs={state.logs} />
                </div>
              )}

              {state.step === AppStep.FINISHED && (
                <div className="text-center py-4 h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">🍏</div>
                  <h2 className="text-3xl font-black text-white mb-1">Uspeh!</h2>
                  <p className="text-zinc-400 text-sm mb-8">Fajlovi su spremljeni u: <br/><span className="text-white font-mono font-bold">{directoryHandle?.name ?? selectedPath ?? ''}</span></p>
                  <button onClick={() => window.location.reload()} className="px-10 h-12 bg-indigo-600 text-white font-bold rounded-xl mx-auto w-fit">Završi</button>
                </div>
              )}

            </div>

            {state.step > 0 && state.step < AppStep.PROCESSING && (
              <div className="px-5 py-2 border-t border-white/5 bg-white/5 flex justify-between items-center h-12">
                <button onClick={() => setState(p => ({ ...p, step: p.step - 1 }))} className="text-zinc-500 text-[10px] font-bold hover:text-zinc-300 uppercase tracking-widest">Nazad</button>
                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Korak {state.step} / 5</div>
                {state.step < AppStep.CONFIG_PREVIEW && state.step !== AppStep.HARDWARE_SELECT && state.step !== AppStep.SYSTEM_TYPE && (
                  <button onClick={handleNext} className="h-8 px-5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase">Sledeće</button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{label: string, value: string}> = ({ label, value }) => (
  <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
    <div className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mb-0.5">{label}</div>
    <div className="text-xs font-bold text-white truncate">{value}</div>
  </div>
);

export default App;
