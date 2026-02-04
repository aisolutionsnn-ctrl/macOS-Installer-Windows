
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
      
      // Koristimo allorigins kao alternativni proxy ako je fajl prevelik za corsproxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(APPLE_CATALOG_URL)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Katalog nedostupan (Status: ${response.status})`);
      }

      const json = await response.json();
      const text = json.contents;
      
      if (!text || text.length < 1000) {
        throw new Error("Katalog je prazan ili previše mali. Proxy greška.");
      }

      /**
       * U Apple katalogu (plist), podaci su grupisani po proizvodima (Products).
       * Svaki proizvod ima set paketa (Packages) i metapodatke (ExtendedMetaInfo).
       * Tražimo blok koji sadrži verziju stringa.
       */
      
      // Razdvajamo tekst na blokove <dict> koji predstavljaju proizvode (približna metoda bez punog XML parsera)
      const products = text.split('<key>Products</key>')[1]?.split('<key>')[1]?.split('</dict>');
      
      // Pokušaj 1: Tražimo blok koji sadrži i verziju i InstallAssistant.pkg
      const versionSafe = version.replace(/\./g, '\\.');
      // Tražimo InstallAssistant.pkg link koji je "blizu" verzije u tekstu
      // Delimo ceo katalog na delove oko svakog linka i proveravamo prisustvo verzije
      const links = text.match(/https?:\/\/swcdn\.apple\.com\/content\/downloads\/.*?\/(?:InstallAssistant|RecoveryHDMetaDmg)\.pkg/gi) || [];
      
      console.log(`[BACKEND] Found ${links.length} total potential links. Filtering for ${version}...`);

      // Filtriramo linkove
      // gibMacOS princip: Proveri .dist fajl. Mi ćemo proveriti kontekst u katalogu.
      for (const link of links) {
        // Uzimamo isečak teksta oko linka (5000 karaktera pre) da vidimo metapodatke
        const index = text.indexOf(link);
        const context = text.substring(Math.max(0, index - 5000), index);
        
        if (context.includes(`<string>${version}</string>`) || context.includes(`>${version}<`)) {
          console.log(`[BACKEND] Match found for ${version}: ${link}`);
          return link;
        }
      }

      // Pokušaj 2: Ako nismo našli striktan meč sa verzijom, tražimo bilo koji Monterey build ako je Monterey u pitanju
      if (version.startsWith("12.")) {
         const montereyLinks = links.filter((l: string) => l.includes("InstallAssistant.pkg"));
         // Monterey je često u sredini kataloga. Vraćamo najverovatniji ako postoji.
         if (montereyLinks.length > 0) {
            console.log(`[BACKEND] Fallback: Returning first Monterey-capable link.`);
            return montereyLinks.find((l: string) => l.toLowerCase().includes("monterey")) || montereyLinks[0];
         }
      }

      // Pokušaj 3: Vrati bilo koji stabilan link za traženu vrstu (Full)
      const assistantLinks = links.filter((l: string) => l.includes("InstallAssistant.pkg"));
      if (assistantLinks.length > 0) {
        const fallback = assistantLinks[assistantLinks.length - 1]; // Poslednji je obično najnoviji Sequoia/Sonoma
        console.warn(`[BACKEND] Exact version match not found. Falling back to latest stable: ${fallback}`);
        return fallback;
      }

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
