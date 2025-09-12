// src/utils/searchSlang.ts
// PC Building Slang Mapping Utility

export interface SlangMappingResult {
  expandedTerm: string;
  wasExpanded: boolean;
  matchedSlang?: string;
}

export const PC_SLANG_MAPPING: { [key: string]: string } = {
  // Component types
  mobo: "Motherboard",
  mb: "Motherboard", 
  mainboard: "Motherboard",
  gfx: "GPU",
  graphics: "GPU",
  "video card": "GPU",
  "graphics card": "GPU", 
  mem: "RAM",
  memory: "RAM",
  proc: "CPU",
  processor: "CPU",
  chip: "CPU",
  psu: "PSU",
  power: "PSU",
  storage: "SSD",
  drive: "SSD",
  hdd: "HDD",
  ssd: "SSD",
  nvme: "SSD",
  "m.2": "SSD",
  cooler: "Cooler",
  cooling: "Cooler",
  fan: "Cooler",
  case: "Case",
  chassis: "Case",
  tower: "Case",

  // Brand slang
  intel: "intel",
  amd: "amd",
  nvidia: "nvidia",
  nv: "nvidia",
  asus: "asus",
  msi: "msi",
  gigabyte: "gigabyte",
  gb: "gigabyte",
  evga: "evga",
  corsair: "corsair",
  seasonic: "seasonic",
  nzxt: "nzxt",
  "cooler master": "cooler master",
  cm: "cooler master",
  "be quiet": "be quiet!",
  bequiet: "be quiet!",

  // Socket/compatibility slang
  lga: "lga",
  am4: "am4",
  am5: "am5",
  tr4: "tr4",
  ddr4: "ddr4",
  ddr5: "ddr5",
  atx: "atx",
  matx: "micro atx",
  "micro-atx": "micro atx",
  itx: "mini itx",
  "mini-itx": "mini itx",
  pcie: "pci express",
  "pci-e": "pci express",
  sata: "sata",

  // Performance slang
  gaming: "gaming",
  budget: "budget",
  "high end": "high performance",
  flagship: "high performance",
  "entry level": "budget",
  "mid range": "mainstream",
  workstation: "professional",
  rgb: "rgb",
  led: "rgb",
};

export const COMPONENT_TYPE_MAPPINGS: { [key: string]: string } = {
  motherboard: "Motherboard",
  gpu: "GPU",
  ram: "RAM",
  "power supply": "PSU",
  "solid state": "SSD",
  "hard drive": "HDD",
  cooling: "Cooler",
  chassis: "Case",
};

/**
 * Expands PC building slang terms to their full equivalents
 */
export function expandSlangTerm(searchTerm: string): SlangMappingResult {
  const cleanSearchTerm = searchTerm.toLowerCase().trim();

  // Direct mapping check
  const directMapping = PC_SLANG_MAPPING[cleanSearchTerm];
  if (directMapping) {
    return {
      expandedTerm: directMapping,
      wasExpanded: true,
      matchedSlang: cleanSearchTerm,
    };
  }

  // Partial mapping check (for compound terms)
  let expandedTerm = cleanSearchTerm;
  let wasExpanded = false;
  let matchedSlang: string | undefined;

  for (const [slang, expansion] of Object.entries(PC_SLANG_MAPPING)) {
    if (cleanSearchTerm.includes(slang) && slang.length >= 3) {
      expandedTerm = cleanSearchTerm.replace(slang, expansion);
      wasExpanded = true;
      matchedSlang = slang;
      break;
    }
  }

  return {
    expandedTerm,
    wasExpanded,
    matchedSlang,
  };
}

/**
 * Finds matching component type from expanded search term
 */
export function findComponentTypeFromSlang(
  expandedTerm: string,
  componentTypes: Array<{ id: string; name: string }>
): string | null {
  const searchTermUpper = expandedTerm.toUpperCase();

  // Check direct component type mappings
  for (const [slangTerm, componentType] of Object.entries(
    COMPONENT_TYPE_MAPPINGS
  )) {
    if (expandedTerm.includes(slangTerm)) {
      return componentType;
    }
  }

  // Check against component type names/IDs
  const matchingType = componentTypes.find(
    (type) =>
      type.id.toUpperCase().includes(searchTermUpper) ||
      type.name.toUpperCase().includes(searchTermUpper)
  );

  return matchingType?.id || null;
}

/**
 * Common regex patterns for compatibility detection
 */
export const COMPATIBILITY_PATTERNS = {
  exact:
    /^(AM[45]|LGA\d+|DDR[3456]|ATX|mATX|ITX|PCIe[0-9.]+|SATA[36]|M\.2|NVMe|Socket\s+\w+|FM\d+|TR\d+)$/i,
  partial: /^(AM[45]|LGA|DDR\d|ATX|PCIe|SATA|FM\d|TR\d)/i,
};

/**
 * RAM-related patterns including slang
 */
export const RAM_PATTERNS = /^(DDR\d?|SDRAM|DIMM|SO-DIMM|memory|ram|mem)$/i;
