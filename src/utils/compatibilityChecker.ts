// src/utils/compatibilityChecker.ts
import type { ComponentResponse } from "../api/model";

export interface CompatibilityIssue {
  type: "error" | "warning";
  message: string;
  affectedComponents: string[];
  category: "socket" | "power" | "size" | "memory" | "general";
}

export interface BuildCompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  powerConsumption: {
    total: number;
    recommended: number;
    psuWattage?: number;
  };
}

export interface BuildSlots {
  CPU?: ComponentResponse;
  GPU?: ComponentResponse;
  Motherboard?: ComponentResponse;
  RAM?: ComponentResponse[];
  PSU?: ComponentResponse;
  Case?: ComponentResponse;
  Cooler?: ComponentResponse;
  SSD?: ComponentResponse[];
  HDD?: ComponentResponse[];
}

// Component power consumption estimates (watts)
const POWER_ESTIMATES = {
  CPU: { base: 65, high: 125, extreme: 200 },
  GPU: { base: 150, high: 250, extreme: 400 },
  Motherboard: { base: 30, high: 50, extreme: 80 },
  RAM: { perStick: 5, high: 8 },
  SSD: { perUnit: 5 },
  HDD: { perUnit: 8 },
  Cooler: { base: 5, liquid: 15 },
  Case: { fans: 10 },
};

/**
 * Main compatibility checker for PC build validation
 */
export function checkBuildCompatibility(
  build: BuildSlots
): BuildCompatibilityResult {
  const issues: CompatibilityIssue[] = [];

  // Check socket compatibility
  issues.push(...checkSocketCompatibility(build));

  // Check memory compatibility
  issues.push(...checkMemoryCompatibility(build));

  // Check cooler compatibility
  issues.push(...checkCoolerCompatibility(build));

  // Check power requirements
  const powerResult = checkPowerCompatibility(build);
  issues.push(...powerResult.issues);

  // Check physical dimensions
  issues.push(...checkPhysicalCompatibility(build));

  // Check general component compatibility
  issues.push(...checkGeneralCompatibility(build));

  return {
    isCompatible: issues.filter((i) => i.type === "error").length === 0,
    issues,
    powerConsumption: powerResult.power,
  };
}

/**
 * Check CPU and motherboard socket compatibility
 */
function checkSocketCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { CPU, Motherboard } = build;

  if (CPU && Motherboard) {
    const cpuSocket = CPU.socket;
    const mbSocket = Motherboard.socket;

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push({
        type: "error",
        message: `CPU socket ${cpuSocket} is not compatible with motherboard socket ${mbSocket}`,
        affectedComponents: [
          CPU.name || "CPU",
          Motherboard.name || "Motherboard",
        ],
        category: "socket",
      });
    }
  }

  return issues;
}

/**
 * Check CPU cooler socket compatibility
 */
function checkCoolerCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { CPU, Cooler } = build;

  if (CPU && Cooler && CPU.socket) {
    const supportedSockets = Cooler.extraCompatibility
      ?.socket_support as unknown;

    if (
      Array.isArray(supportedSockets) &&
      !supportedSockets.includes(CPU.socket)
    ) {
      issues.push({
        type: "error",
        message: `CPU cooler does not support ${CPU.socket} socket`,
        affectedComponents: [CPU.name || "CPU", Cooler.name || "Cooler"],
        category: "socket",
      });
    }
  }

  return issues;
}

/**
 * Check memory (RAM) compatibility with CPU and motherboard
 */
function checkMemoryCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { CPU, Motherboard, RAM } = build;

  if (RAM && RAM.length > 0) {
    const ramType = RAM[0].ramType;
    const firstRamSpeed = (RAM[0] as any).ramSpeed;

    // Check CPU memory support
    if (CPU && CPU.extraCompatibility) {
      const cpuCompat = CPU.extraCompatibility as Record<string, unknown>;
      const ddr4Support = cpuCompat.ddr4_support;
      const ddr5Support = cpuCompat.ddr5_support;
      const maxRamSpeed = cpuCompat.max_ram_speed as number;

      if (ramType === "DDR4" && ddr4Support === false) {
        issues.push({
          type: "error",
          message: `CPU ${CPU.name} does not support DDR4 memory`,
          affectedComponents: [
            CPU.name || "CPU",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }

      if (ramType === "DDR5" && ddr5Support === false) {
        issues.push({
          type: "error",
          message: `CPU ${CPU.name} does not support DDR5 memory`,
          affectedComponents: [
            CPU.name || "CPU",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }

      // Check RAM speed compatibility
      if (maxRamSpeed && firstRamSpeed && firstRamSpeed > maxRamSpeed) {
        issues.push({
          type: "warning",
          message: `RAM speed ${firstRamSpeed}MHz exceeds CPU maximum supported speed ${maxRamSpeed}MHz`,
          affectedComponents: [
            CPU.name || "CPU",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }
    }

    // Check motherboard memory support
    if (Motherboard) {
      const mbRamType = Motherboard.ramType;
      if (mbRamType && ramType && mbRamType !== ramType) {
        issues.push({
          type: "error",
          message: `Motherboard supports ${mbRamType} but selected RAM is ${ramType}`,
          affectedComponents: [
            Motherboard.name || "Motherboard",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }

      // Check memory slot capacity
      const mbCompat = Motherboard.extraCompatibility as Record<
        string,
        unknown
      >;
      const maxMemorySlots = mbCompat?.max_memory_slots as number;
      if (maxMemorySlots && RAM.length > maxMemorySlots) {
        issues.push({
          type: "error",
          message: `Motherboard has ${maxMemorySlots} memory slots but ${RAM.length} RAM sticks selected`,
          affectedComponents: [
            Motherboard.name || "Motherboard",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }
    }

    // Check for mixed RAM types/speeds
    const ramTypes = new Set(RAM.map((r) => r.ramType));
    const ramSpeeds = new Set(RAM.map((r) => (r as any).ramSpeed));

    if (ramTypes.size > 1) {
      issues.push({
        type: "error",
        message: "Mixed RAM types detected - all RAM must be the same type",
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }

    if (ramSpeeds.size > 1) {
      issues.push({
        type: "warning",
        message:
          "Mixed RAM speeds detected - system will run at the slowest speed",
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }
  }

  return issues;
}

/**
 * Check power supply compatibility and requirements
 */
function checkPowerCompatibility(build: BuildSlots): {
  issues: CompatibilityIssue[];
  power: { total: number; recommended: number; psuWattage?: number };
} {
  const issues: CompatibilityIssue[] = [];
  let totalPower = 0;

  // Calculate total power consumption
  Object.entries(build).forEach(([, component]) => {
    if (!component) return;

    if (Array.isArray(component)) {
      // Handle arrays (RAM, SSD, HDD)
      component.forEach((comp) => {
        totalPower += estimateComponentPower(comp);
      });
    } else {
      totalPower += estimateComponentPower(component);
    }
  });

  // Add system overhead (fans, USB devices, etc.)
  totalPower += 50;

  const recommendedWattage = Math.ceil(totalPower * 1.2); // 20% headroom

  const powerResult = {
    total: totalPower,
    recommended: recommendedWattage,
    psuWattage: build.PSU ? Number(build.PSU.wattage) || 0 : undefined,
  };

  // Check PSU capacity
  if (build.PSU) {
    const psuWattage = Number(build.PSU.wattage) || 0;
    powerResult.psuWattage = psuWattage;

    if (psuWattage < totalPower) {
      issues.push({
        type: "error",
        message: `PSU wattage (${psuWattage}W) is insufficient for build requirements (${totalPower}W)`,
        affectedComponents: [build.PSU.name || "PSU"],
        category: "power",
      });
    } else if (psuWattage < recommendedWattage) {
      issues.push({
        type: "warning",
        message: `PSU wattage (${psuWattage}W) is below recommended capacity (${recommendedWattage}W)`,
        affectedComponents: [build.PSU.name || "PSU"],
        category: "power",
      });
    }
  }

  return { issues, power: powerResult };
}

/**
 * Check physical compatibility (form factors, clearances)
 */
function checkPhysicalCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { Motherboard, Case, GPU, Cooler } = build;

  // Check motherboard and case form factor compatibility
  if (Motherboard && Case) {
    const mbFormFactor = Motherboard.formFactor;
    const caseFormFactor = Case.formFactor;

    if (
      mbFormFactor &&
      caseFormFactor &&
      !isFormFactorCompatible(mbFormFactor, caseFormFactor)
    ) {
      issues.push({
        type: "error",
        message: `Motherboard form factor ${mbFormFactor} is not compatible with case ${caseFormFactor}`,
        affectedComponents: [
          Motherboard.name || "Motherboard",
          Case.name || "Case",
        ],
        category: "size",
      });
    }
  }

  // Check GPU clearance
  if (GPU && Case) {
    const gpuLength = (GPU as any).length || 0;
    const caseGpuClearance =
      (Case.extraCompatibility as any)?.max_gpu_length || 0;

    if (gpuLength > 0 && caseGpuClearance > 0 && gpuLength > caseGpuClearance) {
      issues.push({
        type: "error",
        message: `GPU length (${gpuLength}mm) exceeds case clearance (${caseGpuClearance}mm)`,
        affectedComponents: [GPU.name || "GPU", Case.name || "Case"],
        category: "size",
      });
    }
  }

  // Check cooler height clearance
  if (Cooler && Case) {
    const coolerHeight = (Cooler as any).height || 0;
    const caseCpuClearance =
      (Case.extraCompatibility as any)?.max_cpu_cooler_height || 0;

    if (
      coolerHeight > 0 &&
      caseCpuClearance > 0 &&
      coolerHeight > caseCpuClearance
    ) {
      issues.push({
        type: "error",
        message: `CPU cooler height (${coolerHeight}mm) exceeds case clearance (${caseCpuClearance}mm)`,
        affectedComponents: [Cooler.name || "Cooler", Case.name || "Case"],
        category: "size",
      });
    }
  }

  return issues;
}

/**
 * Check general compatibility issues
 */
function checkGeneralCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { GPU, Motherboard, SSD, HDD } = build;

  // Check PCIe slot availability for GPU
  if (GPU && Motherboard) {
    const pciSlots = (Motherboard.extraCompatibility as any)?.pci_slots || 1;
    if (pciSlots < 1) {
      issues.push({
        type: "error",
        message: "Motherboard does not have available PCIe slots for GPU",
        affectedComponents: [
          GPU.name || "GPU",
          Motherboard.name || "Motherboard",
        ],
        category: "general",
      });
    }
  }

  // Check storage interface compatibility
  if (SSD && Motherboard) {
    const nvmeSlots = (Motherboard.extraCompatibility as any)?.nvme_slots || 0;
    const nvmeCount = SSD.filter(
      (ssd) => (ssd as any).interface === "NVMe"
    ).length;

    if (nvmeCount > nvmeSlots) {
      issues.push({
        type: "error",
        message: `Motherboard has ${nvmeSlots} NVMe slots but ${nvmeCount} NVMe drives selected`,
        affectedComponents: [
          Motherboard.name || "Motherboard",
          ...SSD.filter((ssd) => (ssd as any).interface === "NVMe").map(
            (s) => s.name || "NVMe SSD"
          ),
        ],
        category: "general",
      });
    }
  }

  // Check SATA port availability
  if ((SSD || HDD) && Motherboard) {
    const sataPorts = (Motherboard.extraCompatibility as any)?.sata_ports || 4;
    const sataCount = [
      ...(SSD?.filter((ssd) => (ssd as any).interface === "SATA") || []),
      ...(HDD || []),
    ].length;

    if (sataCount > sataPorts) {
      issues.push({
        type: "error",
        message: `Motherboard has ${sataPorts} SATA ports but ${sataCount} SATA drives selected`,
        affectedComponents: [
          Motherboard.name || "Motherboard",
          ...(SSD?.filter((ssd) => (ssd as any).interface === "SATA").map(
            (s) => s.name || "SATA SSD"
          ) || []),
          ...(HDD?.map((h) => h.name || "HDD") || []),
        ],
        category: "general",
      });
    }
  }

  return issues;
}

/**
 * Estimate power consumption for a component
 */
function estimateComponentPower(component: ComponentResponse): number {
  const name = (component.name || "").toLowerCase();
  const price = Number(component.price) || 0;
  const type = component.type;

  switch (type) {
    case "CPU":
      // High-end CPUs based on naming patterns and price
      if (
        name.includes("i9") ||
        name.includes("ryzen 9") ||
        name.includes("threadripper") ||
        price > 400
      )
        return POWER_ESTIMATES.CPU.extreme;
      if (
        name.includes("i7") ||
        name.includes("ryzen 7") ||
        name.includes("i5-13") ||
        price > 200
      )
        return POWER_ESTIMATES.CPU.high;
      return POWER_ESTIMATES.CPU.base;

    case "GPU":
      // High-end GPUs based on naming patterns and price
      if (
        name.includes("4090") ||
        name.includes("4080") ||
        name.includes("7900 xtx") ||
        name.includes("3090") ||
        price > 1000
      )
        return POWER_ESTIMATES.GPU.extreme;
      if (
        name.includes("4080") ||
        name.includes("4070 ti") ||
        name.includes("7800 xt") ||
        name.includes("3080") ||
        name.includes("3070 ti") ||
        price > 500
      )
        return POWER_ESTIMATES.GPU.high;
      if (
        name.includes("4070") ||
        name.includes("4060 ti") ||
        name.includes("7700 xt") ||
        name.includes("3070") ||
        name.includes("3060 ti") ||
        price > 300
      )
        return POWER_ESTIMATES.GPU.base;
      return POWER_ESTIMATES.GPU.base * 0.7; // Entry-level GPUs

    case "Motherboard":
      // Motherboard power based on features and price
      if (price > 300 || name.includes("x670") || name.includes("z790"))
        return POWER_ESTIMATES.Motherboard.extreme;
      if (price > 150 || name.includes("b650") || name.includes("b760"))
        return POWER_ESTIMATES.Motherboard.high;
      return POWER_ESTIMATES.Motherboard.base;

    case "RAM":
      // RAM power consumption per stick
      if (name.includes("ddr5") || price > 100) return POWER_ESTIMATES.RAM.high;
      return POWER_ESTIMATES.RAM.perStick;

    case "SSD":
      return POWER_ESTIMATES.SSD.perUnit;

    case "HDD":
      return POWER_ESTIMATES.HDD.perUnit;

    case "Cooler":
      // Liquid coolers consume more power
      if (name.includes("liquid") || name.includes("aio"))
        return POWER_ESTIMATES.Cooler.liquid;
      return POWER_ESTIMATES.Cooler.base;

    case "Case":
      // Base case fan power
      return POWER_ESTIMATES.Case.fans;

    case "PSU":
      // PSU itself doesn't consume power in our calculation
      return 0;

    default:
      return 0;
  }
}

/**
 * Enhanced form factor compatibility checking
 */
function isFormFactorCompatible(
  mbFormFactor: string,
  caseFormFactor: string
): boolean {
  const compatibility: Record<string, string[]> = {
    "E-ATX": ["Full Tower", "Super Tower"],
    ATX: ["ATX", "Full Tower", "Mid Tower", "Super Tower"],
    "Micro-ATX": [
      "ATX",
      "Micro-ATX",
      "Full Tower",
      "Mid Tower",
      "Mini Tower",
      "Super Tower",
    ],
    "Mini-ITX": [
      "ATX",
      "Micro-ATX",
      "Mini-ITX",
      "Full Tower",
      "Mid Tower",
      "Mini Tower",
      "SFF",
      "HTPC",
      "Super Tower",
    ],
  };

  // Handle case form factors
  const caseCompatibility: Record<string, string[]> = {
    "Full Tower": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
    "Super Tower": ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"],
    "Mid Tower": ["ATX", "Micro-ATX", "Mini-ITX"],
    "Mini Tower": ["Micro-ATX", "Mini-ITX"],
    SFF: ["Mini-ITX"],
    HTPC: ["Mini-ITX"],
  };

  return (
    compatibility[mbFormFactor]?.includes(caseFormFactor) ||
    caseCompatibility[caseFormFactor]?.includes(mbFormFactor) ||
    mbFormFactor === caseFormFactor
  );
}

/**
 * Enhanced component suggestions with proper array handling and compatibility testing
 */
export function getComponentSuggestions(
  build: BuildSlots,
  targetType: keyof BuildSlots,
  allComponents: ComponentResponse[] | { data: ComponentResponse[] },
  priceRange?: { min: number; max: number }
): ComponentResponse[] {
  // Handle both data structures
  const components = Array.isArray(allComponents)
    ? allComponents
    : allComponents?.data || [];

  if (!components || components.length === 0) {
    return [];
  }

  const suggestions = components
    .filter((component) => {
      // Filter by component type
      if (component.type !== targetType) return false;

      // Filter by stock availability
      if (!component.stockQuantity || component.stockQuantity <= 0)
        return false;

      // Filter by price range
      if (priceRange) {
        const price = Number(component.price) || 0;
        if (price < priceRange.min || price > priceRange.max) return false;
      }

      // Test compatibility by adding component appropriately
      const testBuild = { ...build };

      if (
        targetType === "RAM" ||
        targetType === "SSD" ||
        targetType === "HDD"
      ) {
        // For arrays, add to existing array or create new one
        const existingArray =
          (testBuild[targetType] as ComponentResponse[]) || [];
        testBuild[targetType] = [...existingArray, component] as any;
      } else {
        // For single components
        testBuild[targetType] = component;
      }

      const compatibility = checkBuildCompatibility(testBuild);

      // Only suggest if it doesn't introduce errors
      return (
        compatibility.issues.filter((i) => i.type === "error").length === 0
      );
    })
    .sort((a, b) => {
      // Enhanced sorting algorithm
      let scoreA = 0;
      let scoreB = 0;

      // Compatibility with existing components gets higher score
      if (build.CPU) {
        // Motherboard socket compatibility
        if (targetType === "Motherboard" && a.socket === build.CPU.socket)
          scoreA += 10;
        if (targetType === "Motherboard" && b.socket === build.CPU.socket)
          scoreB += 10;

        // RAM compatibility
        if (targetType === "RAM") {
          if (build.Motherboard?.ramType === a.ramType) scoreA += 5;
          if (build.Motherboard?.ramType === b.ramType) scoreB += 5;
        }

        // Cooler socket compatibility
        if (targetType === "Cooler") {
          const aSupportsSocket =
            Array.isArray(a.extraCompatibility?.socket_support) &&
            (a.extraCompatibility.socket_support as string[]).includes(
              build.CPU.socket || ""
            );
          const bSupportsSocket =
            Array.isArray(b.extraCompatibility?.socket_support) &&
            (b.extraCompatibility.socket_support as string[]).includes(
              build.CPU.socket || ""
            );

          if (aSupportsSocket) scoreA += 8;
          if (bSupportsSocket) scoreB += 8;
        }
      }

      // Price-based scoring (prefer middle-range for value)
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const avgPrice = (priceA + priceB) / 2;

      if (avgPrice > 0) {
        scoreA += Math.max(0, 5 - Math.abs(priceA - avgPrice) / avgPrice);
        scoreB += Math.max(0, 5 - Math.abs(priceB - avgPrice) / avgPrice);
      }

      // Stock quantity consideration
      scoreA += Math.min((a.stockQuantity || 0) / 10, 2);
      scoreB += Math.min((b.stockQuantity || 0) / 10, 2);

      return scoreB - scoreA;
    })
    .slice(0, 10); // Return top 10 suggestions

  return suggestions;
}
