
import { MacOSVersion, Drive, MacModel } from './types';

export const MACOS_VERSIONS: MacOSVersion[] = [
  { name: 'macOS Sequoia', version: '15.0', build: '24A335', size: '13.2 GB', type: 'Full' },
  { name: 'macOS Sonoma', version: '14.5', build: '23F79', size: '12.8 GB', type: 'Full' },
  { name: 'macOS Ventura', version: '13.6', build: '22G120', size: '12.1 GB', type: 'Full' },
  { name: 'macOS Monterey', version: '12.7.6', build: '21H1320', size: '11.8 GB', type: 'Full' }, // Ažuriran build
  { name: 'macOS Big Sur', version: '11.7.10', build: '20G1427', size: '12.2 GB', type: 'Full' },
  { name: 'macOS Catalina', version: '10.15.7', build: '19H15', size: '650 MB', type: 'Recovery' },
  { name: 'macOS Mojave', version: '10.14.6', build: '18G103', size: '6.1 GB', type: 'Full' },
];

export const MAC_MODELS: MacModel[] = [
  // iMac Legacy
  { id: 'imac81', name: 'iMac 24"', identifier: 'iMac8,1', year: 'Early 2008', nativeMax: '10.11' },
  { id: 'imac91', name: 'iMac 24"', identifier: 'iMac9,1', year: 'Early 2009', nativeMax: '10.11' },
  { id: 'imac101', name: 'iMac 27"', identifier: 'iMac10,1', year: 'Late 2009', nativeMax: '10.13' },
  { id: 'imac111', name: 'iMac 27"', identifier: 'iMac11,1', year: 'Late 2009', nativeMax: '10.13' },
  { id: 'imac122', name: 'iMac 27"', identifier: 'iMac12,2', year: 'Mid 2011', nativeMax: '10.13' },
  // iMac Slim
  { id: 'imac131', name: 'iMac 21.5"', identifier: 'iMac13,1', year: 'Late 2012', nativeMax: '10.15' },
  { id: 'imac142', name: 'iMac 27"', identifier: 'iMac14,2', year: 'Late 2013', nativeMax: '10.15' },
  { id: 'imac151', name: 'iMac 27" 5K', identifier: 'iMac15,1', year: 'Late 2014', nativeMax: '11.7' },
  { id: 'imac171', name: 'iMac 27" 5K', identifier: 'iMac17,1', year: 'Late 2015', nativeMax: '12.7' },
  { id: 'imac183', name: 'iMac 27" 5K', identifier: 'iMac18,3', year: 'Mid 2017', nativeMax: '13.6' },
  { id: 'imac191', name: 'iMac 27" 5K', identifier: 'iMac19,1', year: 'Early 2019', nativeMax: '14.5' },
  { id: 'imac201', name: 'iMac 27" 5K', identifier: 'iMac20,1', year: 'Mid 2020', nativeMax: '15.0' },
];

export const CPU_GENERATIONS = {
  intel: [
    'Sandy/Ivy Bridge (2nd/3rd)',
    'Haswell/Broadwell (4th/5th)',
    'Skylake/Kaby Lake (6th/7th)',
    'Coffee/Comet Lake (8th/10th)',
    'Rocket Lake (11th)',
    'Alder/Raptor Lake (12th+)',
  ],
  amd: [
    'Ryzen (Zen/Zen+)',
    'Ryzen (Zen 2/3)',
    'Ryzen (Zen 4)',
  ]
};
