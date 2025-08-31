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
    targetPrice: { min: 600, max: 900 },
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
        brands: ["AMD", "Intel"],
        maxPrice: 200,
        minSpecs: { cores: 4, threads: 8 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 250,
        features: ["1080p_gaming"],
      },
      RAM: {
        maxPrice: 80,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 120,
        features: ["budget_friendly", "basic_features"],
      },
      PSU: {
        maxPrice: 80,
        minSpecs: { wattage: 500, efficiency: "80_plus" },
      },
      Case: {
        maxPrice: 60,
        features: ["basic", "good_airflow"],
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
        minSpecs: { wattage: 650, efficiency: "80_plus_gold" },
      },
      Case: {
        maxPrice: 100,
        features: ["tempered_glass", "rgb", "good_airflow"],
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
    },
  },
];

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
} {
  // Handle both data structures
  const components = Array.isArray(availableComponents)
    ? availableComponents
    : availableComponents?.data || [];

  if (!components || components.length === 0) {
    return {
      suggestedBuild: {},
      totalPrice: 0,
      matchQuality: 0,
      budgetWarnings: ["No components available"],
    };
  }

  const suggestedBuild: BuildSlots = {};
  let totalPrice = 0;
  let matchedPreferences = 0;
  let totalPreferences = 0;
  const budgetWarnings: string[] = [];

  // Define build order for dependencies
  const buildOrder: (keyof BuildSlots)[] = [
    "CPU",
    "Motherboard",
    "RAM",
    "GPU",
    "PSU",
    "Case",
    "Cooler",
    "SSD",
    "HDD",
  ];

  for (const componentType of buildOrder) {
    const preference = template.componentPreferences[componentType];
    if (!preference) continue;

    totalPreferences++;

    const selectedComponent = selectBestComponentForSlot(
      components,
      componentType,
      preference,
      template,
      suggestedBuild,
      template.targetPrice.max - totalPrice
    );

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

  return {
    suggestedBuild,
    totalPrice,
    matchQuality,
    budgetWarnings,
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

    // Brand preference
    if (preference.brands && !preference.brands.includes(c.brand || ""))
      return false;

    // Compatibility checks with existing build
    if (!isCompatibleWithBuild(c, componentType, currentBuild)) return false;

    return true;
  });

  if (filtered.length === 0) return null;

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
      return supportedSockets.includes(currentBuild.CPU.socket || "");
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
