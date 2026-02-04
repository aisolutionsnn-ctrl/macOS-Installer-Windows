
export interface BackendResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Apple Catalog URL (Merged Catalog for multiple macOS versions)
 */
const APPLE_CATALOG_URL = "https://swscan.apple.com/content/catalogs/others/index-15-14-13-12-11-10.16-10.15-10.14-10.13-10.12-10.11-10.10-10.9-mountainlion-lion-snowleopard.merged-1.sucatalog";

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

export const backend = {
  isSupported: () => {
    return typeof window !== 'undefined' && (isElectron() || !!(window as any).showDirectoryPicker);
  },

  isFramed: () => {
    if (isElectron()) return false;
    try {
      return window.self !== window.top || (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0);
    } catch (e) {
      return true;
    }
  },

  isElectron,

  selectLocalFolder: async (): Promise<{ handle?: FileSystemDirectoryHandle; path: string } | { error: string } | null> => {
    try {
      if (isElectron()) {
        const result = await (window as any).electronAPI.selectFolder();
        if (!result) return null;
        return { path: result.path };
      }
      if (backend.isFramed()) {
        throw new Error("SecurityError: Cross origin sub frames aren't allowed to show a file picker.");
      }
      if (!(window as any).showDirectoryPicker) {
        throw new Error("Vaš pregledač ne podržava direktan pristup disku. Koristite Electron desktop app ili Chrome/Edge.");
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite', startIn: 'desktop' });
      return { handle, path: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Korisnik je otkazao odabir.");
        return null;
      }
      let errorMsg = err.message || "Greška pri pristupu fajl sistemu.";
      if (err.name === 'SecurityError' || errorMsg.includes('Cross origin sub frames') || errorMsg.includes('file picker')) {
        errorMsg = "Browser blokira pristup disku unutar ovog prozora (iFrame). Otvori aplikaciju u novom tabu ili koristi Electron.";
      }
      console.error("File System Access Error Details:", err);
      return { error: errorMsg };
    }
  },

  runAutomationElectron: async (
    dirPath: string,
    downloadUrl: string,
    fileName: string,
    generation: string,
    onProgress: (p: number) => void
  ): Promise<BackendResponse> => {
    if (!isElectron()) {
      return { success: false, message: 'Electron nije dostupan.' };
    }
    const unsub = (window as any).electronAPI.onDownloadProgress(onProgress);
    try {
      await (window as any).electronAPI.runAutomation({
        dirPath,
        downloadUrl,
        fileName,
        generation,
      });
      return { success: true, message: 'Uspešno preuzimanje i EFI.' };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    } finally {
      if (unsub) unsub();
    }
  },

  /**
   * Unapređena pretraga linkova: Pretražuje katalog i filtrira linkove na osnovu verzije.
   * Simulira gibMacOS logiku:
   * 1. Preuzima katalog.
   * 2. Pronalazi blokove koji sadrže traženu verziju (npr. 12.7.6).
   * 3. Izvlači InstallAssistant.pkg link iz tog bloka.
   */
  getMacOsDownloadUrl: async (version: string, build: string): Promise<string | null> => {
    try {
      console.log(`[BACKEND] Fetching Apple Catalog for version: ${version}, build: ${build}...`);
      
      // Try multiple proxy sources for reliability
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(APPLE_CATALOG_URL)}`,
        `https://corsproxy.io/?${encodeURIComponent(APPLE_CATALOG_URL)}`
      ];
      
      let text = '';
      let success = false;
      
      for (const proxyUrl of proxies) {
        try {
          console.log(`[BACKEND] Trying proxy: ${proxyUrl}`);
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            console.warn(`[BACKEND] Proxy ${proxyUrl} failed with status: ${response.status}`);
            continue;
          }

          if (proxyUrl.includes('allorigins')) {
            const json = await response.json();
            text = json.contents;
          } else {
            text = await response.text();
          }
          
          if (text && text.length > 1000) {
            success = true;
            console.log(`[BACKEND] Successfully fetched catalog (${text.length} chars)`);
            break;
          }
        } catch (err) {
          console.warn(`[BACKEND] Proxy ${proxyUrl} error:`, err);
          continue;
        }
      }
      
      if (!success) {
        throw new Error("All proxies failed. Catalog unavailable.");
      }

      // Improved parsing strategy - look for specific build numbers and version patterns
      console.log(`[BACKEND] Parsing catalog for version ${version}, build ${build}...`);
      
      // Find all InstallAssistant.pkg links
      const pkgLinks = text.match(/https?:\/\/swcdn\.apple\.com\/content\/downloads\/.*?\/InstallAssistant.*?\.pkg/gi) || [];
      const recoveryLinks = text.match(/https?:\/\/swcdn\.apple\.com\/content\/downloads\/.*?\/RecoveryHDMetaDmg.*?\.pkg/gi) || [];
      
      console.log(`[BACKEND] Found ${pkgLinks.length} InstallAssistant links, ${recoveryLinks.length} Recovery links`);
      
      // Strategy 1: Exact build match
      for (const link of [...pkgLinks, ...recoveryLinks]) {
        const index = text.indexOf(link);
        const contextStart = Math.max(0, index - 3000);
        const contextEnd = Math.min(text.length, index + 1000);
        const context = text.substring(contextStart, contextEnd);
        
        // Look for build number in context
        if (context.includes(build) || context.includes(`>${build}<`) || context.includes(`"${build}"`)) {
          console.log(`[BACKEND] Found exact build match for ${build}: ${link}`);
          return link;
        }
      }
      
      // Strategy 2: Version match with better context checking
      const versionPatterns = [
        `<string>${version}</string>`,
        `>${version}<`,
        `"${version}"`,
        `${version}.`,
        `${version} `
      ];
      
      for (const link of [...pkgLinks, ...recoveryLinks]) {
        const index = text.indexOf(link);
        const contextStart = Math.max(0, index - 5000);
        const contextEnd = Math.min(text.length, index + 1000);
        const context = text.substring(contextStart, contextEnd);
        
        for (const pattern of versionPatterns) {
          if (context.includes(pattern)) {
            console.log(`[BACKEND] Found version match for ${version}: ${link}`);
            return link;
          }
        }
      }
      
      // Strategy 3: Version-specific fallbacks
      if (version.startsWith("15.")) { // Sequoia
        const sequoiaLinks = pkgLinks.filter(link => 
          link.toLowerCase().includes('sequoia') || 
          link.toLowerCase().includes('15.')
        );
        if (sequoiaLinks.length > 0) {
          console.log(`[BACKEND] Fallback: Using Sequoia link: ${sequoiaLinks[0]}`);
          return sequoiaLinks[0];
        }
      }
      
      if (version.startsWith("14.")) { // Sonoma
        const sonomaLinks = pkgLinks.filter(link => 
          link.toLowerCase().includes('sonoma') || 
          link.toLowerCase().includes('14.')
        );
        if (sonomaLinks.length > 0) {
          console.log(`[BACKEND] Fallback: Using Sonoma link: ${sonomaLinks[0]}`);
          return sonomaLinks[0];
        }
      }
      
      if (version.startsWith("13.")) { // Ventura
        const venturaLinks = pkgLinks.filter(link => 
          link.toLowerCase().includes('ventura') || 
          link.toLowerCase().includes('13.')
        );
        if (venturaLinks.length > 0) {
          console.log(`[BACKEND] Fallback: Using Ventura link: ${venturaLinks[0]}`);
          return venturaLinks[0];
        }
      }
      
      if (version.startsWith("12.")) { // Monterey
        const montereyLinks = pkgLinks.filter(link => 
          link.toLowerCase().includes('monterey') || 
          link.toLowerCase().includes('12.')
        );
        if (montereyLinks.length > 0) {
          console.log(`[BACKEND] Fallback: Using Monterey link: ${montereyLinks[0]}`);
          return montereyLinks[0];
        }
      }
      
      // Strategy 4: Return the most recent InstallAssistant
      if (pkgLinks.length > 0) {
        const fallback = pkgLinks[pkgLinks.length - 1];
        console.warn(`[BACKEND] No exact match found. Using latest InstallAssistant: ${fallback}`);
        return fallback;
      }
      
      console.error(`[BACKEND] No valid download links found for ${version} (${build})`);
      return null;
    } catch (err) {
      console.error("Failed to fetch/parse Apple Catalog:", err);
      return null;
    }
  },

  downloadToDirectory: async (
    directoryHandle: FileSystemDirectoryHandle, 
    url: string, 
    fileName: string, 
    onProgress: (p: number) => void
  ): Promise<BackendResponse> => {
    try {
      console.log(`[BACKEND] Starting download from: ${url}`);
      // Koristimo corsproxy.io za sam download jer podržava streaming bolje nego allorigins
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error(`Server odgovorio sa statusom ${response.status}`);
      
      const contentLength = +(response.headers.get('Content-Length') || 0);
      const reader = response.body?.getReader();
      
      if (!reader) throw new Error("Nije moguće inicijalizovati stream reader.");

      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      let receivedLength = 0;
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;

        await writable.write(value);
        receivedLength += value.length;
        
        if (contentLength > 0) {
          const progress = Math.floor((receivedLength / contentLength) * 100);
          onProgress(progress);
        }
      }

      await writable.close();
      return { success: true, message: "Uspešno preuzimanje." };
    } catch (err: any) {
      console.error("[BACKEND] Download error:", err);
      return { success: false, message: err.message };
    }
  },

  generateEFI: async (directoryHandle: FileSystemDirectoryHandle, model: string): Promise<void> => {
    const efiFolder = await directoryHandle.getDirectoryHandle('EFI', { create: true });
    const ocFolder = await efiFolder.getDirectoryHandle('OC', { create: true });
    
    const folders = ['Kexts', 'ACPI', 'Drivers', 'Resources', 'Tools'];
    for (const folder of folders) {
      await ocFolder.getDirectoryHandle(folder, { create: true });
    }
    
    const config = await ocFolder.getFileHandle('config.plist', { create: true });
    const writable = await config.createWritable();
    const configContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>#INFO</key>
    <string>Generated by HackinFlow for ${model}</string>
    <key>ACPI</key><dict><key>Add</key><array/></dict>
    <key>DeviceProperties</key><dict><key>Add</key><dict/></dict>
</dict>
</plist>`;
    await writable.write(configContent);
    await writable.close();
  }
};
