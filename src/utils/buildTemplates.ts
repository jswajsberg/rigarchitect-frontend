// src/utils/buildTemplates.ts
import type { ComponentResponse } from "../api/model";
import type { BuildSlots } from "./compatibilityChecker";

export interface ComponentPreference {
  brands?: string[];
  maxPrice?: number;
  minSpecs?: Record<string, number | string>;
  features?: string[];
}

export interface BuildTemplate {
  id: string;
  name: string;
  description: string;
  targetPrice: { min: number; max: number };
  category: "budget" | "mid-range" | "high-end" | "enthusiast";
  useCase: string[];
  priority: {
    performance: number; // 1-5 scale
    budget: number;
    efficiency: number;
    futureProof: number;
  };
  componentPreferences: {
    [K in keyof BuildSlots]?: ComponentPreference;
  };
}

export const BUILD_TEMPLATES: BuildTemplate[] = [
  {
    id: "budget-gaming",
    name: "Budget Gaming",
    description: "Affordable gaming build for 1080p gaming",
    targetPrice: { min: 700, max: 1000 },
    category: "budget",
    useCase: ["Gaming", "General Use"],
    priority: {
      performance: 3,
      budget: 5,
      efficiency: 4,
      futureProof: 2,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD"],
        maxPrice: 250,
        minSpecs: { cores: 4, threads: 8 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 250,
        features: ["1080p_gaming"],
      },
      RAM: {
        maxPrice: 120, // Increased budget for DDR5
        minSpecs: { capacity: 16, speed: 5000 }, // DDR5 speeds
      },
      Motherboard: {
        maxPrice: 120,
        features: ["budget_friendly", "basic_features"],
      },
      PSU: {
        maxPrice: 80,
        minSpecs: { wattage: 600, efficiency: "80_plus" },
      },
      Case: {
        maxPrice: 60,
        features: ["basic", "good_airflow"],
      },
      SSD: {
        maxPrice: 80,
        minSpecs: { capacity: 500 },
      },
      Cooler: {
        maxPrice: 40,
        features: ["basic_cooling"],
      },
    },
  },
  {
    id: "mid-range-gaming",
    name: "Mid-Range Gaming",
    description: "Balanced gaming build for 1440p gaming",
    targetPrice: { min: 1000, max: 1600 },
    category: "mid-range",
    useCase: ["Gaming", "Streaming", "Content Creation"],
    priority: {
      performance: 4,
      budget: 3,
      efficiency: 3,
      futureProof: 4,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 350,
        minSpecs: { cores: 6, threads: 12 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 550,
        features: ["1440p_gaming", "ray_tracing"],
      },
      RAM: {
        maxPrice: 120,
        minSpecs: { capacity: 16, speed: 3600 },
      },
      Motherboard: {
        maxPrice: 200,
        features: ["overclocking", "good_connectivity"],
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 750, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 100,
        features: ["tempered_glass", "rgb", "good_airflow"],
      },
      SSD: {
        maxPrice: 150,
        minSpecs: { capacity: 1000 },
      },
      Cooler: {
        maxPrice: 100,
        features: ["good_cooling"],
      },
    },
  },
  {
    id: "high-end-gaming",
    name: "High-End Gaming",
    description: "Premium gaming build for 4K and high refresh rates",
    targetPrice: { min: 2000, max: 3500 },
    category: "high-end",
    useCase: ["Gaming", "Content Creation", "Streaming", "VR"],
    priority: {
      performance: 5,
      budget: 2,
      efficiency: 3,
      futureProof: 5,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 500,
        minSpecs: { cores: 8, threads: 16 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 1200,
        features: ["4k_gaming", "ray_tracing", "dlss"],
      },
      RAM: {
        maxPrice: 200,
        minSpecs: { capacity: 32, speed: 3600 },
      },
      Motherboard: {
        maxPrice: 300,
        features: ["overclocking", "premium_features", "wifi"],
      },
      PSU: {
        maxPrice: 180,
        minSpecs: { wattage: 850, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 200,
        features: ["premium", "rgb", "excellent_airflow"],
      },
      SSD: {
        maxPrice: 300,
        minSpecs: { capacity: 1000 },
      },
      HDD: {
        maxPrice: 120,
        minSpecs: { capacity: 2000 },
      },
      Cooler: {
        maxPrice: 180,
        features: ["premium_cooling", "quiet"],
      },
    },
  },
  {
    id: "workstation",
    name: "Workstation Build",
    description:
      "Professional workstation for content creation and productivity",
    targetPrice: { min: 1500, max: 2500 },
    category: "high-end",
    useCase: ["Content Creation", "Video Editing", "3D Rendering", "CAD"],
    priority: {
      performance: 5,
      budget: 3,
      efficiency: 4,
      futureProof: 4,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 600,
        minSpecs: { cores: 12, threads: 24 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 800,
        features: ["content_creation", "cuda_cores"],
      },
      RAM: {
        maxPrice: 300,
        minSpecs: { capacity: 32, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 250,
        features: ["workstation_features", "ecc_support"],
      },
      PSU: {
        maxPrice: 150,
        minSpecs: { wattage: 750, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 150,
        features: ["professional", "quiet", "good_airflow"],
      },
      SSD: {
        maxPrice: 400,
        minSpecs: { capacity: 2000 },
      },
      HDD: {
        maxPrice: 150,
        minSpecs: { capacity: 4000 },
      },
      Cooler: {
        maxPrice: 200,
        features: ["premium_cooling", "quiet"],
      },
    },
  },
  {
    id: "compact-gaming",
    name: "Compact Gaming",
    description: "Small form factor gaming build",
    targetPrice: { min: 1200, max: 2000 },
    category: "mid-range",
    useCase: ["Gaming", "Compact", "Living Room"],
    priority: {
      performance: 4,
      budget: 3,
      efficiency: 4,
      futureProof: 3,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 300,
        minSpecs: { cores: 6, threads: 12 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 400,
        features: ["compact_size"],
      },
      RAM: {
        maxPrice: 120,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 200,
        features: ["mini_itx", "wifi", "compact"],
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 600, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 150,
        features: ["mini_itx", "compact", "good_airflow"],
      },
      SSD: {
        maxPrice: 120,
        minSpecs: { capacity: 500 },
      },
      Cooler: {
        maxPrice: 100,
        features: ["compact_cooling"],
      },
    },
  },
  {
    id: "silent-build",
    name: "Silent & Quiet Build",
    description: "Ultra-quiet build for noise-sensitive environments",
    targetPrice: { min: 900, max: 1500 },
    category: "mid-range",
    useCase: ["Gaming", "Work", "Quiet Operation", "Home Office"],
    priority: {
      performance: 3,
      budget: 3,
      efficiency: 5,
      futureProof: 3,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 350,
        minSpecs: { cores: 6, threads: 12 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 450,
        features: ["quiet_cooling", "efficient"],
      },
      RAM: {
        maxPrice: 100,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 150,
        features: ["good_vrm", "efficient"],
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 600, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 120,
        features: ["sound_dampening", "quiet_fans"],
      },
      Cooler: {
        maxPrice: 80,
        features: ["quiet_operation", "low_noise"],
      },
      SSD: {
        maxPrice: 100,
        minSpecs: { capacity: 500 },
      },
    },
  },
];

export interface MissingComponentInfo {
  componentType: keyof BuildSlots;
  reason: 'no_stock' | 'budget_constraint' | 'compatibility_issue' | 'no_matching_components';
  details: string;
  suggestedBudget?: number;
  compatibilityConstraints?: string[];
}

/**
 * Enhanced template application with metadata-aware component selection
 */
export function applyBuildTemplate(
  template: BuildTemplate,
  availableComponents: ComponentResponse[] | { data: ComponentResponse[] }
): {
  suggestedBuild: BuildSlots;
  totalPrice: number;
  matchQuality: number;
  budgetWarnings: string[];
  missingComponents: MissingComponentInfo[];
} {
  console.log(`[DEBUG] Applying template: ${template.name}`);
  // Handle both data structures
  const components = Array.isArray(availableComponents)
    ? availableComponents
    : availableComponents?.data || [];

  console.log(`[DEBUG] Total components available: ${components.length}`);
  const componentsByType = components.reduce((acc, comp) => {
    acc[comp.type || 'unknown'] = (acc[comp.type || 'unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[DEBUG] Components by type:`, componentsByType);

  if (!components || components.length === 0) {
    return {
      suggestedBuild: {},
      totalPrice: 0,
      matchQuality: 0,
      budgetWarnings: ["No components available"],
      missingComponents: [],
    };
  }

  const suggestedBuild: BuildSlots = {};
  let totalPrice = 0;
  let matchedPreferences = 0;
  let totalPreferences = 0;
  const budgetWarnings: string[] = [];
  const missingComponents: MissingComponentInfo[] = [];

  // Define build order for dependencies - Case before Motherboard for form factor compatibility
  const buildOrder: (keyof BuildSlots)[] = [
    "CPU",
    "Case",
    "Motherboard",
    "RAM",
    "GPU",
    "SSD",
    "HDD", 
    "PSU",
    "Cooler",
  ];

  for (const componentType of buildOrder) {
    const preference = template.componentPreferences[componentType];
    
    // Ensure at least one storage component is selected even without explicit preference
    if (!preference && (componentType === "SSD" || componentType === "HDD")) {
      if (!suggestedBuild.SSD && !suggestedBuild.HDD) {
        // Create basic storage preference within remaining budget
        const basicStoragePreference = {
          maxPrice: Math.min(100, template.targetPrice.max - totalPrice),
          minSpecs: { capacity: componentType === "SSD" ? 500 : 1000 }
        };
        
        const selectedComponent = selectBestComponentForSlot(
          components,
          componentType,
          basicStoragePreference,
          template,
          suggestedBuild,
          template.targetPrice.max - totalPrice
        );
        
        if (selectedComponent) {
          suggestedBuild[componentType] = [selectedComponent] as any;
          totalPrice += Number(selectedComponent.price) || 0;
        }
      }
      continue;
    }
    
    if (!preference) continue;

    totalPreferences++;

    console.log(`[DEBUG] Selecting ${componentType} with budget ${template.targetPrice.max - totalPrice}`);
    const selectedComponent = selectBestComponentForSlot(
      components,
      componentType,
      preference,
      template,
      suggestedBuild,
      template.targetPrice.max - totalPrice
    );
    console.log(`[DEBUG] ${componentType} selected:`, selectedComponent ? selectedComponent.name : 'NONE');

    if (selectedComponent) {
      matchedPreferences++;

      // Handle arrays vs single components
      if (
        componentType === "RAM" ||
        componentType === "SSD" ||
        componentType === "HDD"
      ) {
        suggestedBuild[componentType] = [selectedComponent] as any;
      } else {
        suggestedBuild[componentType] = selectedComponent;
      }

      const componentPrice = Number(selectedComponent.price) || 0;
      totalPrice += componentPrice;

      // Check individual component budget
      if (preference.maxPrice && componentPrice > preference.maxPrice) {
        budgetWarnings.push(
          `${componentType} exceeds preferred budget (${componentPrice} > ${preference.maxPrice})`
        );
      }
    } else {
      // Track missing component with detailed reason
      const missingInfo = analyzeMissingComponent(
        components,
        componentType,
        preference,
        suggestedBuild,
        template.targetPrice.max - totalPrice
      );
      missingComponents.push(missingInfo);
    }
  }

  // Final budget validation
  if (totalPrice > template.targetPrice.max) {
    budgetWarnings.push(
      `Total build cost (${totalPrice}) exceeds template maximum (${template.targetPrice.max})`
    );
  }

  const matchQuality =
    totalPreferences > 0 ? matchedPreferences / totalPreferences : 0;

  console.log(`[DEBUG] Template application complete:`);
  console.log(`[DEBUG] - Total Price: ${totalPrice}`);
  console.log(`[DEBUG] - Match Quality: ${matchQuality}`);
  console.log(`[DEBUG] - Budget Warnings: ${budgetWarnings.length}`);
  console.log(`[DEBUG] - Missing Components: ${missingComponents.length}`, missingComponents);
  console.log(`[DEBUG] - Final Build:`, Object.keys(suggestedBuild).filter(k => suggestedBuild[k as keyof BuildSlots]));

  return {
    suggestedBuild,
    totalPrice,
    matchQuality,
    budgetWarnings,
    missingComponents,
  };
}

/**
 * Analyze why a component couldn't be selected and provide detailed feedback
 */
function analyzeMissingComponent(
  components: ComponentResponse[],
  componentType: keyof BuildSlots,
  preference: ComponentPreference,
  currentBuild: BuildSlots,
  remainingBudget: number
): MissingComponentInfo {
  const compatibilityConstraints: string[] = [];
  const typeComponents = components.filter(c => c.type === componentType);

  if (typeComponents.length === 0) {
    return {
      componentType,
      reason: 'no_matching_components',
      details: `No ${componentType} components available in database`,
      compatibilityConstraints,
    };
  }

  const inStockComponents = typeComponents.filter(c => c.stockQuantity && c.stockQuantity > 0);
  if (inStockComponents.length === 0) {
    return {
      componentType,
      reason: 'no_stock',
      details: `No ${componentType} components currently in stock`,
      compatibilityConstraints,
    };
  }

  // Check budget constraints
  const affordableComponents = inStockComponents.filter(c => {
    const price = Number(c.price) || 0;
    return price <= (preference.maxPrice || remainingBudget);
  });

  if (affordableComponents.length === 0) {
    const cheapestPrice = Math.min(...inStockComponents.map(c => Number(c.price) || Infinity));
    return {
      componentType,
      reason: 'budget_constraint',
      details: `No ${componentType} within budget. Cheapest available: $${cheapestPrice}`,
      suggestedBudget: Math.ceil(cheapestPrice),
      compatibilityConstraints,
    };
  }

  // Check compatibility constraints
  let compatibleComponents = affordableComponents;

  // Socket compatibility
  if (componentType === 'Motherboard' && currentBuild.CPU) {
    const cpuSocket = currentBuild.CPU.socket;
    compatibilityConstraints.push(`Must be compatible with ${cpuSocket} socket`);
    compatibleComponents = compatibleComponents.filter(c => c.socket === cpuSocket);
  }
  if (componentType === 'CPU' && currentBuild.Motherboard) {
    const motherboardSocket = currentBuild.Motherboard.socket;
    compatibilityConstraints.push(`Must be compatible with ${motherboardSocket} socket`);
    compatibleComponents = compatibleComponents.filter(c => c.socket === motherboardSocket);
  }

  // Form factor compatibility
  if (componentType === 'Motherboard' && currentBuild.Case) {
    compatibilityConstraints.push(`Must fit in ${currentBuild.Case.formFactor} case`);
    compatibleComponents = compatibleComponents.filter(c => 
      isFormFactorCompatible(c.formFactor || '', currentBuild.Case!.formFactor || '')
    );
  }

  // PSU wattage requirements
  if (componentType === 'PSU' && preference.minSpecs?.wattage) {
    const requiredWattage = preference.minSpecs.wattage as number;
    compatibilityConstraints.push(`Must provide at least ${requiredWattage}W`);
    compatibleComponents = compatibleComponents.filter(c => (c.wattage || 0) >= requiredWattage);
  }

  // RAM compatibility
  if (componentType === 'RAM' && currentBuild.Motherboard) {
    compatibilityConstraints.push(`Must be ${currentBuild.Motherboard.ramType} compatible`);
    compatibleComponents = compatibleComponents.filter(c => c.ramType === currentBuild.Motherboard!.ramType);
  }

  if (compatibleComponents.length === 0) {
    return {
      componentType,
      reason: 'compatibility_issue',
      details: `No compatible ${componentType} found within budget and requirements`,
      compatibilityConstraints,
    };
  }

  // Should not reach here, but just in case
  return {
    componentType,
    reason: 'no_matching_components',
    details: `No suitable ${componentType} found despite available options`,
    compatibilityConstraints,
  };
}


/**
 * Enhanced component selection using metadata for better template matching
 */
function selectBestComponentForSlot(
  components: ComponentResponse[],
  componentType: keyof BuildSlots,
  preference: ComponentPreference,
  template: BuildTemplate,
  currentBuild: BuildSlots,
  remainingBudget: number
): ComponentResponse | null {
  const filtered = components.filter((c) => {
    // Basic filters
    if (c.type !== componentType) return false;
    if (!c.stockQuantity || c.stockQuantity <= 0) return false;

    const price = Number(c.price) || 0;
    if (price > remainingBudget) return false;
    if (preference.maxPrice && price > preference.maxPrice) return false;

    // Enhanced PSU wattage filtering - ensure PSU meets minimum wattage requirement
    if (componentType === "PSU" && preference.minSpecs?.wattage) {
      const requiredWattage = preference.minSpecs.wattage as number;
      const psuWattage = c.wattage || 0;
      if (psuWattage < requiredWattage) return false;
    }

    // Brand preference
    if (preference.brands && !preference.brands.includes(c.brand || ""))
      return false;

    // Enhanced compatibility checks - ensure components can actually work together
    if (!isCompatibleWithBuild(c, componentType, currentBuild)) return false;

    // Additional socket compatibility check for CPUs - ensure there are compatible motherboards available
    if (componentType === "CPU") {
      const cpuSocket = c.socket;
      const hasCompatibleMotherboard = components.some(mb => 
        mb.type === "Motherboard" && 
        mb.socket === cpuSocket && 
        mb.stockQuantity && mb.stockQuantity > 0
      );
      if (!hasCompatibleMotherboard) return false;
    }

    // Additional RAM type compatibility check - ensure RAM matches available motherboards
    if (componentType === "RAM") {
      const ramType = c.ramType;
      const hasCompatibleMotherboard = components.some(mb => 
        mb.type === "Motherboard" && 
        mb.ramType === ramType && 
        mb.stockQuantity && mb.stockQuantity > 0
      );
      if (!hasCompatibleMotherboard) return false;
    }

    // Additional cooler height compatibility check - ensure cooler fits in selected case
    if (componentType === "Cooler" && currentBuild.Case) {
      const coolerHeight = c.coolerHeightMm;
      const caseMaxHeight = currentBuild.Case.coolerHeightMm;
      if (coolerHeight && caseMaxHeight && coolerHeight > caseMaxHeight) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length === 0) {
    // Fallback: try with relaxed constraints if no components found
    const relaxedFiltered = components.filter((c) => {
      // Basic filters only
      if (c.type !== componentType) return false;
      if (!c.stockQuantity || c.stockQuantity <= 0) return false;

      const price = Number(c.price) || 0;
      // Moderately relax budget constraint - allow up to 20% over for critical components
      const maxAllowedPrice = (preference.maxPrice || remainingBudget) * 1.2;
      
      if (price > maxAllowedPrice) return false;

      // PSU wattage still enforced
      if (componentType === "PSU" && preference.minSpecs?.wattage) {
        const requiredWattage = preference.minSpecs.wattage as number;
        const psuWattage = c.wattage || 0;
        if (psuWattage < requiredWattage) return false;
      }

      // Skip brand and feature requirements in fallback
      // Compatibility checks with existing build (but more lenient)
      if (componentType === "Motherboard" && currentBuild.CPU) {
        return c.socket === currentBuild.CPU.socket;
      }
      if (componentType === "CPU" && currentBuild.Motherboard) {
        return c.socket === currentBuild.Motherboard.socket;
      }

      return true;
    });

    if (relaxedFiltered.length === 0) return null;

    // Use relaxed filtered components
    return relaxedFiltered.reduce((best, current) => {
      const bestScore = calculateComponentScore(
        best,
        template,
        preference,
        componentType
      );
      const currentScore = calculateComponentScore(
        current,
        template,
        preference,
        componentType
      );
      return currentScore > bestScore ? current : best;
    });
  }

  // Score and select best component using metadata
  return filtered.reduce((best, current) => {
    const bestScore = calculateComponentScore(
      best,
      template,
      preference,
      componentType
    );
    const currentScore = calculateComponentScore(
      current,
      template,
      preference,
      componentType
    );
    return currentScore > bestScore ? current : best;
  });
}

/**
 * Enhanced component scoring using metadata
 */
function calculateComponentScore(
  component: ComponentResponse,
  template: BuildTemplate,
  preference: ComponentPreference,
  componentType: keyof BuildSlots
): number {
  let score = 0;
  const price = Number(component.price) || 0;

  // Base price scoring (favor reasonable pricing)
  score += Math.max(0, 100 - price / 10);

  // Metadata-based scoring with proper type guards
  if (component.metadata) {
    // Performance score from metadata
    const performanceScore = component.metadata.performance_score;
    if (typeof performanceScore === "number") {
      const normalizedPerformance = performanceScore / 100; // Convert to 0-100 scale
      score += normalizedPerformance * template.priority.performance * 10;
    }

    // Template tier matching
    const templateTier = component.metadata.template_tier;
    if (typeof templateTier === "string") {
      const targetTier = getTargetTierForTemplate(template);
      if (templateTier === targetTier) {
        score += 20; // Strong bonus for tier match
      } else if (isAdjacentTier(templateTier, targetTier)) {
        score += 10; // Partial bonus for adjacent tiers
      }
    }

    // Use case alignment from metadata
    const useCases = component.metadata.use_cases;
    if (Array.isArray(useCases)) {
      const matches = useCases.filter(
        (uc: unknown) =>
          typeof uc === "string" &&
          template.useCase.some(
            (tuc) =>
              uc.toLowerCase().includes(tuc.toLowerCase()) ||
              tuc.toLowerCase().includes(uc.toLowerCase())
          )
      ).length;
      score += (matches / Math.max(template.useCase.length, 1)) * 15;
    }

    // Efficiency rating from metadata
    const efficiency = component.metadata.efficiency_rating;
    if (typeof efficiency === "number" && template.priority.efficiency > 3) {
      score += efficiency * template.priority.efficiency * 2;
    }

    // Feature matching from metadata
    const features = component.metadata.features;
    if (features && typeof features === "object" && preference.features) {
      const featureMatches = preference.features.filter(
        (f) => (features as Record<string, unknown>)[f] === true
      ).length;
      score += (featureMatches / preference.features.length) * 10;
    }
  }

  // Budget preference scoring
  if (template.priority.budget > 3) {
    const budgetScore = preference.maxPrice
      ? Math.max(0, ((preference.maxPrice - price) / preference.maxPrice) * 20)
      : 0;
    score += budgetScore;
  }

  // Future-proofing preference with type guards
  if (template.priority.futureProof > 3) {
    // Favor newer, higher-spec components for future-proofing
    if (componentType === "CPU" || componentType === "GPU") {
      const performanceBonus = component.metadata?.performance_score;
      if (typeof performanceBonus === "number" && performanceBonus > 7000) {
        score += 15; // Bonus for high-performance components
      }
    }
  }

  return score;
}

/**
 * Determine target performance tier based on template priorities
 */
function getTargetTierForTemplate(template: BuildTemplate): string {
  const perfPriority = template.priority.performance;

  if (perfPriority >= 5) return "enthusiast";
  if (perfPriority >= 4) return "high";
  if (perfPriority >= 3) return "mid";
  return "entry";
}

/**
 * Check if two performance tiers are adjacent
 */
function isAdjacentTier(tier1: string, tier2: string): boolean {
  const tiers = ["entry", "mid", "high", "enthusiast"];
  const index1 = tiers.indexOf(tier1);
  const index2 = tiers.indexOf(tier2);

  return Math.abs(index1 - index2) === 1;
}

/**
 * Check component compatibility with existing build
 */
function isCompatibleWithBuild(
  component: ComponentResponse,
  componentType: keyof BuildSlots,
  currentBuild: BuildSlots
): boolean {
  // Socket compatibility
  if (componentType === "CPU" && currentBuild.Motherboard) {
    return component.socket === currentBuild.Motherboard.socket;
  }

  if (componentType === "Motherboard" && currentBuild.CPU) {
    return component.socket === currentBuild.CPU.socket;
  }

  // RAM type compatibility
  if (componentType === "RAM" && currentBuild.Motherboard) {
    return component.ramType === currentBuild.Motherboard.ramType;
  }

  // Form factor compatibility
  if (componentType === "Motherboard" && currentBuild.Case) {
    return isFormFactorCompatible(
      component.formFactor || "",
      currentBuild.Case.formFactor || ""
    );
  }

  // Cooler socket compatibility with type guards
  if (componentType === "Cooler" && currentBuild.CPU) {
    const supportedSockets = component.extraCompatibility?.socket_support;
    if (Array.isArray(supportedSockets)) {
      const socketCompatible = supportedSockets.includes(currentBuild.CPU.socket || "");
      if (!socketCompatible) return false;
    }
  }

  // Cooler height compatibility
  if (componentType === "Cooler" && currentBuild.Case) {
    const coolerHeight = component.coolerHeightMm;
    const caseMaxHeight = currentBuild.Case.coolerHeightMm;
    if (coolerHeight && caseMaxHeight && coolerHeight > caseMaxHeight) {
      return false;
    }
  }

  return true; // Default to compatible
}

/**
 * Helper function to check form factor compatibility
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

  // Case compatibility rules (what motherboards each case supports)
  const caseCompatibility: Record<string, string[]> = {
    "mini tower": ["mini-itx", "micro-atx"],
    "mid tower": ["mini-itx", "micro-atx", "atx"],
    "full tower": ["mini-itx", "micro-atx", "atx", "e-atx"],
    "super tower": ["mini-itx", "micro-atx", "atx", "e-atx"],
    "sff": ["mini-itx"],
    "htpc": ["mini-itx"],
    "atx": ["mini-itx", "micro-atx", "atx"],
    "micro-atx": ["mini-itx", "micro-atx"],
    "mini-itx": ["mini-itx"],
  };

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
    "atx": ["atx", "full tower", "mid tower"],
    "e-atx": ["full tower", "super tower"],
  };

  // Check both directions with improved matching
  return (
    mbCompatibility[mbFF]?.some((c) => caseFF.includes(c)) ||
    caseCompatibility[caseFF]?.some((m) => mbFF.includes(m)) ||
    mbFF === caseFF
  );
}

/**
 * Get build template by ID
 */
export function getBuildTemplate(
  templateId: string
): BuildTemplate | undefined {
  return BUILD_TEMPLATES.find((template) => template.id === templateId);
}

/**
 * Filter templates by budget range
 */
export function getTemplatesByBudget(maxBudget: number): BuildTemplate[] {
  return BUILD_TEMPLATES.filter(
    (template) =>
      template.targetPrice.min <= maxBudget &&
      template.targetPrice.max <= maxBudget * 1.2 // Allow some flexibility
  );
}

/**
 * Get recommended template based on use case
 */
export function getRecommendedTemplate(
  useCase: string[]
): BuildTemplate | undefined {
  // Score each template based on use case overlap
  const scoredTemplates = BUILD_TEMPLATES.map((template) => {
    const overlap = template.useCase.filter((uc) =>
      useCase.some(
        (userUC) =>
          uc.toLowerCase().includes(userUC.toLowerCase()) ||
          userUC.toLowerCase().includes(uc.toLowerCase())
      )
    );

    return {
      template,
      score: overlap.length / template.useCase.length,
    };
  });

  // Return template with highest score
  scoredTemplates.sort((a, b) => b.score - a.score);
  return scoredTemplates[0]?.score > 0
    ? scoredTemplates[0].template
    : undefined;
}

/**
 * Validate template configuration
 */
export function validateTemplate(template: BuildTemplate): string[] {
  const errors: string[] = [];

  if (template.targetPrice.min >= template.targetPrice.max) {
    errors.push("Min price must be less than max price");
  }

  if (template.targetPrice.min < 0 || template.targetPrice.max < 0) {
    errors.push("Prices cannot be negative");
  }

  const prioritySum = Object.values(template.priority).reduce(
    (sum, val) => sum + val,
    0
  );
  if (prioritySum === 0) {
    errors.push("At least one priority must be set");
  }

  if (template.useCase.length === 0) {
    errors.push("At least one use case must be specified");
  }

  return errors;
}
