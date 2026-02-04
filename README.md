# HackinFlow — DESKTOP aplikacija

Automatsko preuzimanje zvaničnih macOS instalera i priprema OpenCore EFI. **Radi kao desktop aplikacija (Electron)** — bez browsera, bez Rusta, bez Visual Studio.

---

## Pokretanje DESKTOP aplikacije (Electron)

1. **Instalacija:**  
   `npm install`  
   Prvi put Electron preuzima ~150 MB; ako stane na polovini, sačekaj ili pokreni ponovo.

2. **Ako vrati "Electron failed to install correctly":**  
   Pokreni:  
   `node node_modules/electron/install.js`  
   Sačekaj da se preuzimanje završi (može trajati nekoliko minuta).

3. **Pokretanje aplikacije:**  
   - Jedan komand:  
     `npm run electron:dev`  
     (pokreće Vite + Electron; otvara se prozor aplikacije.)  
   - Ili: u prvom terminalu `npm run dev`, u drugom `npm run electron`.

4. **U aplikaciji:** Odaberi tip sistema → hardver → macOS verziju → **Odaberi Disk/Folder** (otvara se sistemski dijalog) → Pokreni automatizaciju. Fajlovi idu na izabranu putanju (npr. USB).

---

## Samo web (browser)

Ako želiš isključivo u browseru: `npm run dev`, pa otvori http://localhost:5173 u Chrome/Edge (ne u iframe-u). Za upis na disk browser traži odabir foldera (File System Access API).
