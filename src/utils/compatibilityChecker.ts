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
 * Check memory (RAM) compatibility with CPU and motherboard
 */
function checkMemoryCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { CPU, Motherboard, RAM } = build;

  if (RAM && RAM.length > 0) {
    const ramType = RAM[0].ramType;

    // Check CPU memory support
    if (CPU && CPU.extraCompatibility) {
      const cpuCompat = CPU.extraCompatibility as Record<string, unknown>;
      const ddr4Support = cpuCompat.ddr4_support;
      const ddr5Support = cpuCompat.ddr5_support;

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
    if (ramTypes.size > 1) {
      issues.push({
        type: "error",
        message: "Cannot mix different RAM types in the same build",
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
    totalPower += POWER_ESTIMATES.Cooler.base;
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

  return issues;
}

/**
 * Estimate power usage for components without explicit wattage
 */
function estimatePowerUsage(
  type: string,
  component: ComponentResponse
): number {
  const name = component.name?.toLowerCase() || "";

  switch (type) {
    case "CPU":
      if (name.includes("i9") || name.includes("ryzen 9"))
        return POWER_ESTIMATES.CPU.extreme;
      if (name.includes("i7") || name.includes("ryzen 7"))
        return POWER_ESTIMATES.CPU.high;
      return POWER_ESTIMATES.CPU.base;

    case "GPU":
      if (name.includes("4090") || name.includes("7900"))
        return POWER_ESTIMATES.GPU.extreme;
      if (
        name.includes("4080") ||
        name.includes("4070") ||
        name.includes("7800")
      )
        return POWER_ESTIMATES.GPU.high;
      return POWER_ESTIMATES.GPU.base;

    default:
      return 0;
  }
}

/**
 * Check if motherboard and case form factors are compatible
 */
function isFormFactorCompatible(
  mbFormFactor: string,
  caseFormFactor: string
): boolean {
  const compatibility: Record<string, string[]> = {
    ATX: ["ATX", "Full Tower", "Mid Tower"],
    "Micro-ATX": ["ATX", "Micro-ATX", "Full Tower", "Mid Tower", "Mini Tower"],
    "Mini-ITX": [
      "ATX",
      "Micro-ATX",
      "Mini-ITX",
      "Full Tower",
      "Mid Tower",
      "Mini Tower",
      "SFF",
    ],
  };

  return (
    compatibility[mbFormFactor]?.includes(caseFormFactor) ||
    compatibility[caseFormFactor]?.includes(mbFormFactor) ||
    mbFormFactor === caseFormFactor
  );
}

/**
 * Get component suggestions based on current build
 */
export function getComponentSuggestions(
  build: BuildSlots,
  targetType: keyof BuildSlots,
  allComponents: ComponentResponse[],
  priceRange?: { min: number; max: number }
): ComponentResponse[] {
  const suggestions = allComponents
    .filter((component) => {
      // Filter by component type
      if (component.type !== targetType) return false;

      // Filter by price range
      if (priceRange) {
        const price = Number(component.price) || 0;
        if (price < priceRange.min || price > priceRange.max) return false;
      }

      // Filter by compatibility
      const testBuild = { ...build, [targetType]: component };
      const compatibility = checkBuildCompatibility(testBuild);

      // Only suggest if it doesn't introduce errors
      return (
        compatibility.issues.filter((i) => i.type === "error").length === 0
      );
    })
    .sort((a, b) => {
      // Sort by price (ascending)
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    });

  return suggestions.slice(0, 5); // Return top 5 suggestions
}
