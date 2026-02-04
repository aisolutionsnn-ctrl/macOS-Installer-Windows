
export enum AppStep {
  WELCOME,
  SYSTEM_TYPE,
  HARDWARE_SELECT,
  DRIVE_SELECT,
  MACOS_SELECT,
  CONFIG_PREVIEW,
  PROCESSING,
  FINISHED,
  ERROR
}

export type SystemType = 'pc' | 'mac';
export type CPUType = 'intel' | 'amd';
export type GPUType = 'amd' | 'intel' | 'nvidia';

export interface MacModel {
  id: string;
  name: string;
  identifier: string;
  year: string;
  nativeMax: string; // Latest official macOS version
}

export interface HardwareProfile {
  systemType: SystemType;
  // PC Fields
  cpuType: CPUType;
  generation: string;
  gpuType: GPUType;
  gpuModel: string;
  laptop: boolean;
  // Mac Fields
  macModel: MacModel | null;
}

export interface Drive {
  id: string;
  name: string;
  size: string;
  mountPoint: string;
  isSystem: boolean;
}

export interface MacOSVersion {
  name: string;
  version: string;
  build: string;
  size: string;
  type: 'Recovery' | 'Full';
}

export interface AppError {
  code: string;
  message: string;
  details: string;
  suggestions: string[];
}

export interface AppState {
  step: AppStep;
  hardware: HardwareProfile;
  selectedDrive: Drive | null;
  selectedMacOS: MacOSVersion | null;
  localSource: boolean; // Use existing local bundle?
  localPath: string | null; // Path to existing local bundle
  isProcessing: boolean;
  isDownloadOnly: boolean; // Only download, don't flash?
  progress: number;
  logs: string[];
  error: AppError | null;
}
