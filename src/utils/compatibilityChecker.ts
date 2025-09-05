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

      if (ramType === "DDR4" && ddr4Support === false) {
        issues.push({
          type: "error",
          message: `CPU does not support DDR4 memory`,
          affectedComponents: [
            CPU.name || "CPU",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      } else if (ramType === "DDR5" && ddr5Support === false) {
        issues.push({
          type: "error",
          message: `CPU does not support DDR5 memory`,
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
        message: `Motherboard supports ${Motherboard.ramType}, but RAM is ${ramType}`,
        affectedComponents: [
          Motherboard.name || "Motherboard",
          ...RAM.map((r) => r.name || "RAM"),
        ],
        category: "memory",
      });
    }

    // Check for mixing different RAM types
    const ramTypes = [...new Set(RAM.map((r) => r.ramType))];
    if (ramTypes.length > 1) {
      issues.push({
        type: "error",
        message: `Mixed RAM types detected: ${ramTypes.join(", ")}`,
        affectedComponents: RAM.map((r) => r.name || "RAM"),
        category: "memory",
      });
    }

    // Check RAM speed compatibility (warning)
    if (firstRamSpeed && Motherboard?.extraCompatibility) {
      const mbCompat = Motherboard.extraCompatibility as Record<
        string,
        unknown
      >;
      const supportedSpeeds = mbCompat.memory_speeds as number[];

      if (
        Array.isArray(supportedSpeeds) &&
        !supportedSpeeds.includes(firstRamSpeed)
      ) {
        issues.push({
          type: "warning",
          message: `RAM speed ${firstRamSpeed}MHz may not be fully supported by motherboard`,
          affectedComponents: [
            Motherboard.name || "Motherboard",
            ...RAM.map((r) => r.name || "RAM"),
          ],
          category: "memory",
        });
      }
    }
  }

  return issues;
}

/**
 * Check power requirements and PSU compatibility
 */
function checkPowerCompatibility(build: BuildSlots): {
  issues: CompatibilityIssue[];
  power: { total: number; recommended: number; psuWattage?: number };
} {
  const issues: CompatibilityIssue[] = [];

  // Calculate total power consumption
  let totalPower = 0;

  // Enhanced power estimation using metadata - exclude PSU as it provides power
  Object.entries(build).forEach(([componentType, component]) => {
    if (!component || componentType === "PSU") return; // PSU provides power, doesn't consume

    if (Array.isArray(component)) {
      // Handle RAM, SSD, HDD arrays
      component.forEach((comp) => {
        totalPower += estimateComponentPower(comp);
      });
    } else {
      // Handle single components
      totalPower += estimateComponentPower(component);
    }
  });

  const recommendedPower = Math.ceil(totalPower * 1.3); // 30% headroom
  const psuWattage = build.PSU?.wattage;

  const powerResult = {
    total: totalPower,
    recommended: recommendedPower,
    psuWattage,
  };

  // Check PSU adequacy
  if (build.PSU && psuWattage) {
    if (psuWattage < totalPower) {
      issues.push({
        type: "error",
        message: `PSU wattage (${psuWattage}W) is insufficient for total power consumption (${totalPower}W)`,
        affectedComponents: [build.PSU.name || "PSU"],
        category: "power",
      });
    } else if (psuWattage < recommendedPower) {
      issues.push({
        type: "warning",
        message: `PSU wattage (${psuWattage}W) is below recommended (${recommendedPower}W). Consider higher wattage for safety margin.`,
        affectedComponents: [build.PSU.name || "PSU"],
        category: "power",
      });
    }
  }

  return { issues, power: powerResult };
}

/**
 * Check physical compatibility (dimensions, form factors)
 */
function checkPhysicalCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { GPU, Case, Motherboard, Cooler } = build;

  // Check GPU clearance in case
  if (GPU && Case && GPU.gpuLengthMm && Case.gpuLengthMm) {
    if (GPU.gpuLengthMm > Case.gpuLengthMm) {
      issues.push({
        type: "error",
        message: `GPU length (${GPU.gpuLengthMm}mm) exceeds case clearance (${Case.gpuLengthMm}mm)`,
        affectedComponents: [GPU.name || "GPU", Case.name || "Case"],
        category: "size",
      });
    }
  }

  // Check cooler height clearance
  if (Cooler && Case && Cooler.coolerHeightMm && Case.coolerHeightMm) {
    if (Cooler.coolerHeightMm > Case.coolerHeightMm) {
      issues.push({
        type: "error",
        message: `CPU cooler height (${Cooler.coolerHeightMm}mm) exceeds case clearance (${Case.coolerHeightMm}mm)`,
        affectedComponents: [Cooler.name || "Cooler", Case.name || "Case"],
        category: "size",
      });
    }
  }

  // Check motherboard form factor compatibility with case
  if (Motherboard && Case && Motherboard.formFactor && Case.formFactor) {
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

  return issues;
}

/**
 * Check general component compatibility
 */
function checkGeneralCompatibility(build: BuildSlots): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const { CPU, GPU } = build;

  // Check if CPU has integrated graphics or if discrete GPU is required with type guard
  if (CPU && CPU.extraCompatibility) {
    const hasIntegratedGpu = CPU.extraCompatibility.integrated_graphics;

    if (
      typeof hasIntegratedGpu === "boolean" &&
      hasIntegratedGpu === false &&
      !GPU
    ) {
      issues.push({
        type: "error",
        message:
          "CPU does not have integrated graphics. A discrete GPU is required.",
        affectedComponents: [CPU.name || "CPU"],
        category: "general",
      });
    }
  }

  return issues;
}

/**
 * Enhanced power estimation using metadata field with proper type guards
 */
function estimateComponentPower(component: ComponentResponse): number {
  // First priority: actual wattage field
  if (component.wattage && component.wattage > 0) {
    return component.wattage;
  }

  // Second priority: metadata power tier with type checking
  const powerTier = component.metadata?.power_tier;
  if (typeof powerTier === "string") {
    const tierPower = {
      low: {
        CPU: 65,
        GPU: 120,
        RAM: 5,
        Motherboard: 30,
        SSD: 5,
        HDD: 8,
        Cooler: 5,
        Case: 10,
        default: 10,
      },
      moderate: {
        CPU: 105,
        GPU: 200,
        RAM: 8,
        Motherboard: 50,
        SSD: 5,
        HDD: 8,
        Cooler: 15,
        Case: 10,
        default: 20,
      },
      high: {
        CPU: 150,
        GPU: 300,
        RAM: 12,
        Motherboard: 80,
        SSD: 5,
        HDD: 8,
        Cooler: 15,
        Case: 15,
        default: 40,
      },
      extreme: {
        CPU: 250,
        GPU: 450,
        RAM: 15,
        Motherboard: 80,
        SSD: 5,
        HDD: 8,
        Cooler: 20,
        Case: 20,
        default: 60,
      },
    };

    const tierData = tierPower[powerTier as keyof typeof tierPower];
    if (tierData) {
      const typeKey = component.type as keyof typeof tierData;
      return tierData[typeKey] || tierData.default;
    }
  }

  // Third priority: fallback to hardcoded estimation
  return getHardcodedPowerEstimate(component);
}

/**
 * Fallback hardcoded power estimation (existing logic)
 */
function getHardcodedPowerEstimate(component: ComponentResponse): number {
  const name = component.name?.toLowerCase() || "";
  const price = component.price || 0;

  switch (component.type) {
    case "CPU":
      // High-end CPUs
      if (
        name.includes("7950x") ||
        name.includes("13900k") ||
        name.includes("12900k") ||
        price > 400
      )
        return POWER_ESTIMATES.CPU.extreme;
      if (
        name.includes("7700x") ||
        name.includes("13700k") ||
        name.includes("12700k") ||
        price > 250
      )
        return POWER_ESTIMATES.CPU.high;
      return POWER_ESTIMATES.CPU.base;

    case "GPU":
      // High-end GPUs
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

    case "RAM":
      // RAM power is usually consistent
      return POWER_ESTIMATES.RAM.perStick;

    case "SSD":
      return POWER_ESTIMATES.SSD.perUnit;

    case "HDD":
      return POWER_ESTIMATES.HDD.perUnit;

    case "Motherboard":
      // High-end motherboards consume more power
      if (name.includes("x670e") || name.includes("z790") || price > 200)
        return POWER_ESTIMATES.Motherboard.extreme;
      if (name.includes("b650e") || name.includes("b760") || price > 120)
        return POWER_ESTIMATES.Motherboard.high;
      return POWER_ESTIMATES.Motherboard.base;

    case "Cooler":
      // AIO/liquid coolers consume more power
      if (name.includes("liquid") || name.includes("aio"))
        return POWER_ESTIMATES.Cooler.liquid;
      return POWER_ESTIMATES.Cooler.base;

    case "Case":
      // Base case fan power
      return POWER_ESTIMATES.Case.fans;

    case "PSU":
      // PSU provides power, doesn't consume it
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
  // Normalize form factor names
  const mbFF = mbFormFactor.toLowerCase().trim();
  const caseFF = caseFormFactor.toLowerCase().trim();

  // Direct match
  if (mbFF === caseFF) return true;

  // Motherboard compatibility rules (what cases each motherboard fits in)
  const mbCompatibility: Record<string, string[]> = {
    "mini-itx": [
      "mini-itx",
      "micro-atx",
      "atx",
      "full tower",
      "mid tower",
      "mini tower",
      "sff",
      "htpc",
    ],
    "micro-atx": ["micro-atx", "atx", "full tower", "mid tower", "mini tower"],
    atx: ["atx", "full tower", "mid tower"],
    "e-atx": ["full tower", "super tower"],
  };

  // Case compatibility rules (what motherboards each case supports)
  const caseCompatibility: Record<string, string[]> = {
    "mini tower": ["mini-itx", "micro-atx"],
    "mid tower": ["mini-itx", "micro-atx", "atx"],
    "full tower": ["mini-itx", "micro-atx", "atx", "e-atx"],
    "super tower": ["mini-itx", "micro-atx", "atx", "e-atx"],
    sff: ["mini-itx"],
    htpc: ["mini-itx"],
  };

  // Check both directions
  return (
    mbCompatibility[mbFF]?.some((c) => caseFF.includes(c)) ||
    caseCompatibility[caseFF]?.some((m) => mbFF.includes(m)) ||
    mbFF === caseFF
  );
}

/**
 * Enhanced component suggestions with metadata-aware sorting
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
      if (!component.stockQuantity || component.stockQuantity <= 0) {
        return false;
      }

      // Filter by price range - consider build context
      if (priceRange) {
        const price = Number(component.price) || 0;
        
        // Calculate current build total (excluding the target component type if it exists)
        const currentBuildTotal = Object.entries(build).reduce((total, [slotType, slotComponent]) => {
          // Skip the target type we're suggesting for (we'll replace/add to it)
          if (slotType === targetType) return total;
          
          if (Array.isArray(slotComponent)) {
            return total + slotComponent.reduce((sum, comp) => sum + (Number(comp.price) || 0), 0);
          } else if (slotComponent) {
            return total + (Number(slotComponent.price) || 0);
          }
          return total;
        }, 0);
        
        // Calculate remaining budget for this component
        const totalBudget = priceRange.max;
        const remainingBudget = Math.max(0, totalBudget - currentBuildTotal);
        
        // For very tight budgets, be more flexible but still reasonable
        const minBudgetForComponent = Math.min(priceRange.min * 0.3, remainingBudget * 0.1);
        const maxBudgetForComponent = Math.max(remainingBudget * 1.2, priceRange.min);
        
        // Filter out components that are way outside the practical budget
        if (price > maxBudgetForComponent || price < minBudgetForComponent) {
          return false;
        }
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

      // If build is empty, be more lenient with compatibility
      const buildIsEmpty = Object.keys(build).length === 0;
      
      if (buildIsEmpty) {
        // For empty builds, only check basic compatibility (socket matching for CPU/Motherboard)
        if (targetType === "CPU" && build.Motherboard?.socket && component.socket) {
          if (component.socket !== build.Motherboard.socket) {
            return false;
          }
        }
        if (targetType === "Motherboard" && build.CPU?.socket && component.socket) {
          if (component.socket !== build.CPU.socket) {
            return false;
          }
        }
        // For empty builds, allow all other components
        return true;
      }

      const compatibility = checkBuildCompatibility(testBuild);
      const hasErrors = compatibility.issues.filter((i) => i.type === "error").length > 0;

      // Only suggest if it doesn't introduce errors
      return !hasErrors;
    })
    .sort((a, b) => {
      // Enhanced sorting algorithm with metadata support
      let scoreA = 0;
      let scoreB = 0;

      // Compatibility scoring
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
            a.extraCompatibility.socket_support.includes(build.CPU.socket);
          const bSupportsSocket =
            Array.isArray(b.extraCompatibility?.socket_support) &&
            b.extraCompatibility.socket_support.includes(build.CPU.socket);

          if (aSupportsSocket) scoreA += 8;
          if (bSupportsSocket) scoreB += 8;
        }
      }

      // Performance scoring using metadata with type guards
      const aPerformanceScore = a.metadata?.performance_score;
      const bPerformanceScore = b.metadata?.performance_score;

      if (
        typeof aPerformanceScore === "number" &&
        typeof bPerformanceScore === "number"
      ) {
        // Normalize performance scores to 0-5 range for sorting
        scoreA += aPerformanceScore / 2000;
        scoreB += bPerformanceScore / 2000;
      }

      // Price-to-performance ratio using metadata with type guards
      const aEfficiency = a.metadata?.efficiency_rating;
      const bEfficiency = b.metadata?.efficiency_rating;

      if (typeof aEfficiency === "number") scoreA += aEfficiency;
      if (typeof bEfficiency === "number") scoreB += bEfficiency;

      // Stock availability scoring
      const aStock = a.stockQuantity || 0;
      const bStock = b.stockQuantity || 0;
      if (aStock > bStock) scoreA += 2;
      if (bStock > aStock) scoreB += 2;

      // Budget-aware price scoring
      if (priceRange) {
        const aPrice = Number(a.price) || 0;
        const bPrice = Number(b.price) || 0;
        
        // Calculate current build cost (excluding target component type)
        const currentBuildTotal = Object.entries(build).reduce((total, [slotType, slotComponent]) => {
          if (slotType === targetType) return total;
          
          if (Array.isArray(slotComponent)) {
            return total + slotComponent.reduce((sum, comp) => sum + (Number(comp.price) || 0), 0);
          } else if (slotComponent) {
            return total + (Number(slotComponent.price) || 0);
          }
          return total;
        }, 0);
        
        const totalBudget = priceRange.max;
        const remainingBudget = Math.max(0, totalBudget - currentBuildTotal);
        
        // Score based on how well the price fits the remaining budget
        // Perfect fit (using 60-80% of remaining budget) gets highest score
        const idealSpend = remainingBudget * 0.7;
        
        const aPriceFit = Math.abs(aPrice - idealSpend) / remainingBudget;
        const bPriceFit = Math.abs(bPrice - idealSpend) / remainingBudget;
        
        // Better price fit gets higher score (lower distance from ideal)
        if (aPriceFit < bPriceFit) scoreA += 3;
        if (bPriceFit < aPriceFit) scoreB += 3;
        
        // Bonus for components that leave room for other components
        if (aPrice <= remainingBudget * 0.8) scoreA += 1;
        if (bPrice <= remainingBudget * 0.8) scoreB += 1;
      } else {
        // Fallback to simple price preference when no budget set
        const aPrice = Number(a.price) || 0;
        const bPrice = Number(b.price) || 0;
        if (aPrice < bPrice) scoreA += 1;
        if (bPrice < aPrice) scoreB += 1;
      }

      return scoreB - scoreA; // Higher score first
    })
    .slice(0, 8); // Limit suggestions

  return suggestions;
}
