# HackinFlow – 100 zadataka

HackinFlow je desktop aplikacija (Tauri, Windows/macOS/Linux) za automatsko preuzimanje zvaničnih macOS instalera (gibMacOS logika) i pripremu OpenCore EFI foldera. Cilj: pomoć korisnicima bez pristupa Mac-u da podignu sistem (Hackintosh ili Legacy Mac).

---

## Indeks po oblastima

| Oblast | Zadaci | Opis |
|--------|--------|------|
| [Desktop] | 1–12 | Migracija na desktop (Tauri), konfiguracija, build |
| [GibMacOS] | 13–24 | Apple katalog, preuzimanje instalera, validacija |
| [Disk] | 25–32 | Native lista diskova/USB, folder picker, upozorenja |
| [EFI] | 33–47 | EFI struktura, OpenCore baza, Drivers, mapiranje platformi |
| [Kexts] | 48–64 | Kexts po platformi, preuzimanje, redosled, validacija |
| [ACPI] | 65–78 | SSDT-ovi, config.plist po platformi, SMBIOS |
| [Legacy] | 79–85 | OpenCore Legacy Patcher, Legacy Mac, OCLP integracija |
| [Boot] | 86–92 | Bootabilni USB uputstva, skripte, sledeći koraci |
| [Docs] | 93–100 | Testovi, dokumentacija, UX, održavanje |

---

## Zadaci 1–12 [Desktop]

1. **Inicijalizacija Tauri 2 u repo** — Tauri 2 projekat u postojećem repo (Vite+React), `src-tauri` sa Cargo.toml i tauri.conf.json. [Desktop]
2. **Povezivanje React UI sa Tauri** — Frontend ostaje u `src/`, Tauri koristi Vite za build i dev (beforeDevCommand, beforeBuildCommand, frontendDist). [Desktop]
3. **Konfiguracija Tauri (tauri.conf.json)** — Dozvoljene kapacitete (fs, dialog, http), prozor, identifier, bundle za Win/Mac/Linux. [Desktop]
4. **Implementacija native liste diskova/particija** — Tauri command (Rust) koji vraća listu mount point-ova i labela (Windows WMI/GetVolumeInformation, Linux /proc/mounts ili udev, macOS diskutil). [Desktop]
5. **Tauri command za odabir foldera** — Native folder picker (tauri-plugin-dialog ili rfd); vraćanje putanje kao string. [Desktop]
6. **Zameniti selectLocalFolder sa Tauri invoke** — Kada je Tauri, poziv native command za folder picker; fallback na showDirectoryPicker u browseru. [Desktop]
7. **Download i pisanje u Tauri backendu** — Preuzimanje po putanji (reqwest stream u fajl); progress preko Tauri eventa. [Desktop]
8. **Build i test na Windows** — `npm run tauri build` i `tauri dev` na Windows; provera da se prozor otvori i da odabir foldera radi. [Desktop]
9. **Build za macOS i Linux** — CI ili ručni build za macOS (DMG) i Linux (AppImage/deb); dokumentovati u README. [Desktop]
10. **Pakovanje i distribucija** — Tauri MSI/NSIS za Windows, DMG/pkg za macOS, AppImage/deb za Linux; dokumentovati u README. [Desktop]
11. **Ukloniti/usloviti browser-specifikacije** — isFramed(), "Otvori u novom tabu", showDirectoryPicker; u desktopu nema iframe restrikcija. [Desktop]
12. **Ažurirati README** — "HackinFlow je desktop aplikacija (Windows/macOS/Linux). Za pokretanje: …" i link na Rust instalaciju. [Desktop]

---

## Zadaci 13–24 [GibMacOS]

13. **Parsiranje Apple merged kataloga (plist/XML)** — Umesto string matching-a; mapiranje Products → verzija, build, Packages. [GibMacOS]
14. **Podrška za Recovery i Full instalere** — RecoveryHDMetaDmg vs InstallAssistant.pkg; izbor tipa u UI. [GibMacOS]
15. **Tačno mapiranje verzija na katalog** — Verzije iz constants.ts na kataloške unose (version + build); ukloniti fallback "bilo koji Monterey". [GibMacOS]
16. **Detekcija i prikaz veličine preuzimanja** — Size iz kataloga; ažurirati MACOS_VERSIONS ili prikaz u UI. [GibMacOS]
17. **Podrška za više kataloga** — Ako merged katalog ne pokriva sve verzije, uključiti starije kataloge. [GibMacOS]
18. **Retry i timeout za fetch kataloga** — Izbor proxy-ja (corsproxy.io / allorigins) ili fallback; retry logika. [GibMacOS]
19. **Resumable download (Range header)** — Za prekidana preuzimanja; čuvanje progressa u localStorage/sessionStorage. [GibMacOS]
20. **Validacija preuzetog fajla** — Checksum ako je u katalogu, ili minimalno size check. [GibMacOS]
21. **Opciono: poziv gibMacOS (Python)** — Ako je Python + gibMacOS na sistemu, Tauri može pokrenuti skriptu; ili bundle Python runtime. [GibMacOS]
22. **Preuzimanje samo metapodataka** — Dokumentovati šta je potrebno pored .pkg za "bootabilni" korak (MakeInstall / createinstallmedia). [GibMacOS]
23. **UI: izbor "samo preuzimanje" vs "preuzmi + EFI"** — Progress po fazi (katalog → download → EFI); logovanje grešaka po koracima. [GibMacOS]
24. **E2E ili ručni test za 2 verzije** — Monterey, Sonoma: link i preuzimanje završavaju uspešno. [GibMacOS]

---

## Zadaci 25–32 [Disk]

25. **Prikaz liste diskova/particija u UI** — Korisnik vidi oznake (npr. "USB (E:)", "/media/usb") i kapacitet; izbor ciljnog diska/particije. [Disk]
26. **Upozorenje za sistemski disk** — Ako je izabran Windows C:\, macOS root, Linux /: jasna poruka i opciono blokiranje. [Disk]
27. **Native folder picker kao fallback** — Ako korisnik želi folder na disku (npr. D:\HackinFlow) umesto root-a particije. [Disk]
28. **Dokumentacija: nije potrebno ništa instalirati za USB** — Na desktopu OS vidi disk; aplikacija koristi standardne API-je. [Disk]
29. **Opciono: detekcija USB uključen/isključen** — Tauri event ili polling; osvežavanje liste diskova. [Disk]
30. **README: Linux prava** — Na Linuxu eventualno prava za /dev/sdX ili mount point; Windows/macOS bez dodatnih koraka. [Disk]
31. **Test: USB stick u listi** — USB priključen → pojavljuje se u listi; odabir → putanja ispravna. [Disk]
32. **Test: upis na USB** — Odabir USB particije → upis fajlova radi. [Disk]

---

## Zadaci 33–47 [EFI]

33. **Definisanje kanonske EFI strukture** — Prema Dortania: EFI/OC/ sa ACPI, Drivers, Kexts, Resources, Tools. [EFI]
34. **Automatsko preuzimanje OpenCorePkg** — GitHub releases; izbor X64 (ili IA32 za legacy); DEBUG vs RELEASE. [EFI]
35. **Raspakivanje OpenCorePkg** — OpenCore.efi, Bootstrap.efi; samo potrebni fajlovi iz Drivers/ i Tools/ (bez AudioDxe, CrScreenshotDxe, OpenCanopy). [EFI]
36. **Preuzimanje OcBinaryData za HfsPlus.efi** — Obavezno u EFI/OC/Drivers/. [EFI]
37. **Lista obaveznih Drivers** — OpenRuntime.efi, HfsPlus.efi; za legacy: HfsPlusLegacy.efi, OpenUsbKbDxe.efi, OpenPartitionDxe.efi po potrebi. [EFI]
38. **ResetNvramEntry.efi u Tools** — Opciono OpenShell.efi za debug. [EFI]
39. **Mapiranje CPU generacije na platformu** — Sandy Bridge, Ivy, Haswell, Skylake, Kaby, Coffee Lake, Comet Lake, Rocket Lake, Alder/Raptor; AMD Zen 1/2/3/4. [EFI]
40. **Legacy Mac: mapiranje macModel na set fajlova** — OCLP EFI bundle ili minimalan OpenCore + Mac-specific kexts; istraživanje OCLP API/releases. [EFI]
41. **Verzionisanje OpenCore i OcBinaryData** — Pinned ili "latest stable"; prikaz u UI. [EFI]
42. **Čišćenje EFI** — Ne kopirati nepotrebne Drivers/Tools (Dortania "cleaned EFI" lista). [EFI]
43. **Jedini izvor istine za listu fajlova** — Konfigurabilna lista (JSON/TS) po platformi (Desktop Intel/AMD, Laptop, Legacy Mac). [EFI]
44. **Kopiranje u ciljni folder** — Svi EFI fajlovi na odabranu putanju (root USB ili folder). [EFI]
45. **Validacija EFI strukture** — Provera da svi obavezni fajlovi postoje pre završetka. [EFI]
46. **Dokumentacija EFI u README** — Šta se generiše (folderi, fajlovi). [EFI]
47. **Test: generisana EFI bootabilna** — Provera da EFI folder može boot-ovati (u VM ili na stvarnom hardveru ako je moguće). [EFI]

---

## Zadaci 48–64 [Kexts]

48. **Obavezni kexts za sve: Lilu, VirtualSMC** — Preuzimanje sa acidanthera releases; staviti u EFI/OC/Kexts/. [Kexts]
49. **WhateverGreen za sve** — Preuzimanje i dodavanje; AppleALC (ili AppleALCU) po defaultu. [Kexts]
50. **Mapiranje GPU na WhateverGreen i DeviceProperties** — AMD RX 580, Intel, Nvidia; dokumentovati Nvidia ograničenja. [Kexts]
51. **Ethernet kext po chipsetu** — IntelMausi, RealtekRTL8111, SmallTreeIntel82576, AppleIGB, LucyRTL8125; preset "generic Intel/Realtek". [Kexts]
52. **USB: XHCI-unsupported** — Za H310, B360, Z390 itd.; USBToolBox opciono — dokumentovati. [Kexts]
53. **AMD CPU kexts** — AMDRyzenCPUPowerManagement, AppleMCEReporterDisabler za macOS 12.3+; XLNCUSBFIX samo za FX. [Kexts]
54. **Laptop: VoodooPS2 ili VoodooI2C** — SMCBatteryManager, SMCLightSensor opciono; SSDT-PNLF za backlight. [Kexts]
55. **Legacy Mac: kexts iz OCLP payload-a** — Lista i automatsko dodavanje kada je izabran Legacy Mac. [Kexts]
56. **VirtualSMC plugin-i** — SMCProcessor (Intel), SMCAMDProcessor (AMD), SMCRadeonSensors (AMD GPU), NVMeFix po hardveru. [Kexts]
57. **Preuzimanje kext-ova** — URL-e (GitHub releases / Dortania builds); raspakivanje .zip i kopiranje .kext u Kexts/. [Kexts]
58. **Redosled u config.plist (Kernel → Add)** — BrcmPatchRAM redosled; Lilu prvi, zatim zavisni kexts. [Kexts]
59. **Validacija kexts** — Nakon generate EFI, provera da svi navedeni kexts postoje; upozorenje ako nešto nedostaje. [Kexts]
60. **Opciono isključivanje audio** — Ako korisnik izabere "bez audio", ne dodavati AppleALC. [Kexts]
61. **Dokumentacija kext po platformi** — Koji kext za koji chipset (README ili in-app). [Kexts]
62. **Ažuriranje liste kext URL-ova** — Konfigurabilni JSON/TS za lako ažuriranje. [Kexts]
63. **Test: kexts učitavaju se u macOS** — Provera da generisani kexts ne izazivaju kernel panic (ručno ili VM). [Kexts]
64. **Kext verzije u UI** — Prikaz verzija ugrađenih kext-ova u About ili Config Preview. [Kexts]

---

## Zadaci 65–78 [ACPI]

65. **Preuzimanje/uključivanje kompajliranih SSDT-ova** — SSDT-EC, SSDT-EC-USBX, SSDT-PLUG, SSDT-AWAC, SSDT-PMC, SSDT-RHUB, SSDT-RTC0-RANGE, SSDT-PNLF, SSDT-GPI0, SSDT-IMEI, SSDT-UNC, SSDT-CPUR. [ACPI]
66. **Mapiranje platforme na obavezne SSDT-ove** — Tabela: Desktop Intel/AMD, Laptop, HEDT prema Dortania. [ACPI]
67. **Generisanje config.plist iz šablona po platformi** — Dortania sample configs (Coffee Lake, Comet Lake, AMD) kao baza. [ACPI]
68. **Popunjavanje ACPI → Add** — Lista SSDT-ova u config.plist. [ACPI]
69. **Popunjavanje Boot → Arguments** — Potrebni boot argumenti po platformi. [ACPI]
70. **Popunjavanje DeviceProperties** — GPU, iGPU, Ethernet prema hardveru. [ACPI]
71. **Popunjavanje Kernel → Add** — Svi kexts sa Enabled; Kernel → Force ako treba. [ACPI]
72. **Misc → Security (SecureBootModel)** — NVRAM; podešavanje po platformi. [ACPI]
73. **SMBIOS izbor** — Mapiranje CPU generacije na preporučeni SMBIOS (npr. iMac19,1 za Coffee Lake). [ACPI]
74. **Legacy Mac: config baziran na OCLP** — Minimalan config koji boot-a njihov installer. [ACPI]
75. **Validacija plist** — Schema ili plist parse pre pisanja; backup starog config.plist ako postoji. [ACPI]
76. **Opcija Debug vs Release config** — Misc → Debug → DISABLE u Release. [ACPI]
77. **Dokumentacija ACPI** — Link na "Gathering files" i "Getting started with ACPI" za ručne izmene. [ACPI]
78. **Test: config.plist parsiran** — Provera da generisani config može učitati OpenCore (ProperTree ili sl.). [ACPI]

---

## Zadaci 79–85 [Legacy]

79. **Istraživanje OCLP** — Kako generiše EFI za dati model (identifier); CLI ili API za "build EFI for iMac14,2". [Legacy]
80. **Automatsko preuzimanje OCLP release** — Generisanje EFI za izabrani macModel; kopiranje u ciljni EFI folder. [Legacy]
81. **Fallback: gotovi OCLP EFI paketi** — Ako nema API, preuzimanje gotovih paketa po modelu ili uputstva korisniku. [Legacy]
82. **Kompatibilnost macOS verzije sa Legacy Mac** — Upozorenje ako je izabran macOS noviji od nativeMax za taj model. [Legacy]
83. **UI za Legacy Mac** — Prikaz "OpenCore Legacy Patcher" putanje ili "Automatski EFI (OCLP)" kada je implementirano. [Legacy]
84. **Test za jedan model** — npr. iMac14,2: validan EFI folder. [Legacy]
85. **Dokumentacija Legacy Mac u README** — Kada koristiti, ograničenja. [Legacy]

---

## Zadaci 86–92 [Boot]

86. **Uputstvo u app** — (1) Odaberi USB (ili folder); (2) Preuzmi installer + generiši EFI; (3) Link ka Dortania "Making the installer in Windows/Linux". [Boot]
87. **Opciono: generisanje skripte** — PowerShell/batch za Windows, shell za Linux; korisnik unosi putanju; particije i kopiranje. [Boot]
88. **Nakon "Uspeh": Sledeći koraci** — Šta uraditi sa USB-om (boot order, instalacija). [Boot]
89. **Samo preuzimanje: uputstvo** — "Kako napraviti installer USB ručno" (gibMacOS / Dortania). [Boot]
90. **Razmotriti gibMacOS MakeInstall** — Ako je Python + gibMacOS na sistemu; desktop app poziva skriptu; istraživanje. [Boot]
91. **Export uputstva (PDF/markdown)** — Prilagođeno izboru (PC vs Legacy Mac, verzija macOS). [Boot]
92. **Dokumentacija bootabilnog USB u README** — Ograničenja (nema createinstallmedia na Windows/Linux). [Boot]

---

## Zadaci 93–100 [Docs]

93. **Jedinični testovi za parsiranje kataloga** — Mock plist; mapiranje verzija na linkove. [Docs]
94. **E2E (Playwright ili manual)** — Flow: izbor PC → generacija → odabir foldera → download (mock/mali fajl) → generateEFI → provera strukture. [Docs]
95. **README: Zahtevi i USB korak** — Chrome/Edge za web; Tauri za desktop; "USB korak", "EFI šta se generiše", "Legacy Mac", "Bootabilni USB ograničenja". [Docs]
96. **Ažuriranje constants.ts** — Nove macOS verzije (build), novi Mac modeli, nove CPU generacije. [Docs]
97. **Lokalizacija** — Sve poruke na srpskom; provera konzistentnosti. [Docs]
98. **Performanse i error handling** — Veliki fajl: chunked write da ne blokira UI; error boundaries; jasna poruka ako generateEFI ne uspe. [Docs]
99. **CORS/proxy** — Ako allorigins/corsproxy imaju limit, razmotriti vlastiti proxy ili uputstvo za lokalni proxy. [Docs]
100. **Održavanje** — Ažuriranje zadataka kada Dortania/OpenCore izbaci novu verziju; provera linkova na kexts/drivers. [Docs]
