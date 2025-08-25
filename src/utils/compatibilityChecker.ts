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
    const firstRamSpeed = (RAM[0] as any).ramSpeed; // Using any to access property that might not be in interface

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
          message: `RAM speed ${firstRamSpeed}MHz exceeds CPU maximum supported speed of ${maxRamSpeed}MHz`,
          affectedComponents: [
            ...RAM.map((r) => r.name || "RAM"),
            CPU.name || "CPU",
          ],
          category: "memory",
        });
      }
    }

    // Check motherboard memory support
    if (Motherboard && Motherboard.ramType && Motherboard.ramType !== ramType) {
      issues.push({
        type: "error",
        message: `Motherboard supports ${Motherboard.ramType} but selected RAM is ${ramType}`,
        affectedComponents: [
          Motherboard.name || "Motherboard",
          ...RAM.map((r) => r.name || "RAM"),
        ],
        category: "memory",
      });
    }

    // Check for mixed RAM types
    const ramTypes = new Set(RAM.map((r) => r.ramType).filter(Boolean));
    const ramSpeeds = new Set(
      RAM.map((r) => (r as any).ramSpeed).filter(Boolean)
    );
    const ramCapacities = new Set(
      RAM.map((r) => (r as any).ramCapacity).filter(Boolean)
    );

    if (ramTypes.size > 1) {
      issues.push({
        type: "error",
        message: "Cannot mix different RAM types in the same build",
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }

    if (ramSpeeds.size > 1) {
      issues.push({
        type: "warning",
        message:
          "Mixed RAM speeds detected. System will run at the lowest speed",
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }

    if (ramCapacities.size > 1) {
      issues.push({
        type: "warning",
        message:
          "Mixed RAM capacities detected. Consider using matching capacity sticks for optimal performance",
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }

    // Check motherboard RAM slot capacity
    if (Motherboard && Motherboard.extraCompatibility) {
      const mbCompat = Motherboard.extraCompatibility as Record<
        string,
        unknown
      >;
      const maxRamSlots = mbCompat.ram_slots as number;

      if (maxRamSlots && RAM.length > maxRamSlots) {
        issues.push({
          type: "error",
          message: `Too many RAM sticks (${RAM.length}) for motherboard capacity (${maxRamSlots} slots)`,
          affectedComponents: [
            ...RAM.map((r) => r.name || "RAM"),
            Motherboard.name || "Motherboard",
          ],
          category: "memory",
        });
      }
    }
  }

  return issues;
}

/**
 * Check power supply compatibility and requirements
 */
function checkPowerCompatibility(build: BuildSlots): {
  issues: CompatibilityIssue[];
  power: BuildCompatibilityResult["powerConsumption"];
} {
  const issues: CompatibilityIssue[] = [];
  let totalPower = 0;

  // Calculate power consumption
  if (build.CPU) {
    totalPower += build.CPU.wattage || estimatePowerUsage("CPU", build.CPU);
  }

  if (build.GPU) {
    totalPower += build.GPU.wattage || estimatePowerUsage("GPU", build.GPU);
  }

  if (build.Motherboard) {
    totalPower += POWER_ESTIMATES.Motherboard.base;
  }

  if (build.RAM) {
    totalPower += build.RAM.length * POWER_ESTIMATES.RAM.perStick;
  }

  if (build.SSD) {
    totalPower += build.SSD.length * POWER_ESTIMATES.SSD.perUnit;
  }

  if (build.HDD) {
    totalPower += build.HDD.length * POWER_ESTIMATES.HDD.perUnit;
  }

  if (build.Cooler) {
    const coolerName = build.Cooler.name?.toLowerCase() || "";
    totalPower +=
      coolerName.includes("liquid") || coolerName.includes("aio")
        ? POWER_ESTIMATES.Cooler.liquid
        : POWER_ESTIMATES.Cooler.base;
  }

  totalPower += POWER_ESTIMATES.Case.fans;

  // Recommended PSU wattage (add 20% headroom)
  const recommendedPower = Math.ceil(totalPower * 1.2);

  // Check PSU capacity
  const psuWattage = build.PSU?.wattage;
  if (psuWattage) {
    if (psuWattage < totalPower) {
      issues.push({
        type: "error",
        message: `PSU wattage (${psuWattage}W) is insufficient for estimated power draw (${totalPower}W)`,
        affectedComponents: [build.PSU?.name || "PSU"],
        category: "power",
      });
    } else if (psuWattage < recommendedPower) {
      issues.push({
        type: "warning",
        message: `PSU wattage (${psuWattage}W) is below recommended (${recommendedPower}W) for optimal efficiency`,
        affectedComponents: [build.PSU?.name || "PSU"],
        category: "power",
      });
    }
  }

  return {
    issues,
    power: {
      total: totalPower,
      recommended: recommendedPower,
      psuWattage,
    },
  };
}

/**
 * Check physical compatibility (dimensions, form factors)
 */
function checkPhysicalCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { Case, GPU, Motherboard, Cooler, PSU } = build;

  if (Case) {
    // Check GPU length compatibility
    if (GPU && Case.gpuLengthMm && GPU.gpuLengthMm) {
      if (GPU.gpuLengthMm > Case.gpuLengthMm) {
        issues.push({
          type: "error",
          message: `GPU length (${GPU.gpuLengthMm}mm) exceeds case clearance (${Case.gpuLengthMm}mm)`,
          affectedComponents: [GPU.name || "GPU", Case.name || "Case"],
          category: "size",
        });
      }
    }

    // Check CPU cooler height
    if (Cooler && Case.coolerHeightMm && Cooler.coolerHeightMm) {
      if (Cooler.coolerHeightMm > Case.coolerHeightMm) {
        issues.push({
          type: "error",
          message: `CPU cooler height (${Cooler.coolerHeightMm}mm) exceeds case clearance (${Case.coolerHeightMm}mm)`,
          affectedComponents: [Cooler.name || "Cooler", Case.name || "Case"],
          category: "size",
        });
      }
    }

    // Check motherboard form factor
    if (Motherboard && Case.formFactor && Motherboard.formFactor) {
      if (!isFormFactorCompatible(Motherboard.formFactor, Case.formFactor)) {
        issues.push({
          type: "error",
          message: `Motherboard form factor (${Motherboard.formFactor}) is not compatible with case (${Case.formFactor})`,
          affectedComponents: [
            Motherboard.name || "Motherboard",
            Case.name || "Case",
          ],
          category: "size",
        });
      }
    }

    // Check PSU form factor
    if (PSU && Case.psuFormFactor && PSU.psuFormFactor) {
      if (PSU.psuFormFactor !== Case.psuFormFactor) {
        issues.push({
          type: "warning",
          message: `PSU form factor (${PSU.psuFormFactor}) may not fit optimally in case (${Case.psuFormFactor})`,
          affectedComponents: [PSU.name || "PSU", Case.name || "Case"],
          category: "size",
        });
      }
    }
  }

  return issues;
}

/**
 * Check general compatibility requirements
 */
function checkGeneralCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // Check for essential components
  if (!build.CPU) {
    issues.push({
      type: "warning",
      message: "CPU is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  if (!build.Motherboard) {
    issues.push({
      type: "warning",
      message: "Motherboard is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  if (!build.RAM || build.RAM.length === 0) {
    issues.push({
      type: "warning",
      message: "RAM is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  if (!build.PSU) {
    issues.push({
      type: "warning",
      message: "Power supply is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  if (!build.SSD && !build.HDD) {
    issues.push({
      type: "warning",
      message: "Storage device (SSD or HDD) is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  if (!build.Case) {
    issues.push({
      type: "warning",
      message: "Case is required for a complete build",
      affectedComponents: [],
      category: "general",
    });
  }

  // Check for builds without dedicated GPU (office builds might be OK)
  if (!build.GPU && build.CPU) {
    const cpuName = build.CPU.name?.toLowerCase() || "";
    const hasIntegratedGraphics =
      cpuName.includes("apu") ||
      cpuName.includes("integrated") ||
      cpuName.includes("uhd") ||
      cpuName.includes("iris") ||
      cpuName.includes("vega"); // AMD APUs

    if (!hasIntegratedGraphics) {
      issues.push({
        type: "warning",
        message:
          "No GPU detected. Ensure CPU has integrated graphics or add a dedicated GPU",
        affectedComponents: [build.CPU.name || "CPU"],
        category: "general",
      });
    }
  }

  return issues;
}

/**
 * Enhanced power usage estimation for components without explicit wattage
 */
function estimatePowerUsage(
  type: string,
  component: ComponentResponse
): number {
  const name = component.name?.toLowerCase() || "";
  const price = Number(component.price) || 0;

  switch (type) {
    case "CPU":
      // More comprehensive CPU power estimation
      if (name.includes("i9") || name.includes("ryzen 9") || price > 400)
        return POWER_ESTIMATES.CPU.extreme;
      if (name.includes("i7") || name.includes("ryzen 7") || price > 250)
        return POWER_ESTIMATES.CPU.high;
      if (name.includes("i5") || name.includes("ryzen 5"))
        return POWER_ESTIMATES.CPU.base;
      return POWER_ESTIMATES.CPU.base * 0.8; // Lower-end CPUs

    case "GPU":
      // More comprehensive GPU power estimation based on model names and price
      if (
        name.includes("4090") ||
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
          const socketsA = a.extraCompatibility?.socket_support as unknown;
          const socketsB = b.extraCompatibility?.socket_support as unknown;
          if (
            Array.isArray(socketsA) &&
            socketsA.includes(build.CPU.socket || "")
          )
            scoreA += 8;
          if (
            Array.isArray(socketsB) &&
            socketsB.includes(build.CPU.socket || "")
          )
            scoreB += 8;
        }
      }

      // Brand matching preferences
      if (build.CPU && build.CPU.brand) {
        // Prefer matching CPU/GPU brands for potential optimizations
        if (targetType === "GPU" || targetType === "Motherboard") {
          if (a.brand === build.CPU.brand) scoreA += 3;
          if (b.brand === build.CPU.brand) scoreB += 3;
        }
      }

      // Price considerations (prefer mid-range over extremes unless high-end build)
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const targetPrice = priceRange
        ? (priceRange.min + priceRange.max) / 2
        : 500;

      // Slight preference for prices closer to target range middle
      scoreA -= Math.abs(priceA - targetPrice) / 100;
      scoreB -= Math.abs(priceB - targetPrice) / 100;

      // Final sort: higher score first, then by price ascending
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return priceA - priceB;
    });

  return suggestions.slice(0, 5); // Return top 5 suggestions
}
