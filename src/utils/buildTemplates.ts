// src/utils/buildTemplates.ts - Cleaned up and fixed template system
import type { ComponentResponse } from "../api/model";
import type { BuildSlots } from "./compatibilityChecker";

export interface ComponentPreference {
  brands?: string[];
  maxPrice?: number;
  minSpecs?: Record<string, number | string>;
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
        maxPrice: 200,
        minSpecs: { cores: 4, threads: 8 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 300,
      },
      RAM: {
        maxPrice: 100,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 120,
      },
      PSU: {
        maxPrice: 80,
        minSpecs: { wattage: 600 },
      },
      Case: {
        maxPrice: 70,
      },
      SSD: {
        maxPrice: 80,
        minSpecs: { capacity: 500 },
      },
      Cooler: {
        maxPrice: 50,
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
      },
      RAM: {
        maxPrice: 120,
        minSpecs: { capacity: 16, speed: 3600 },
      },
      Motherboard: {
        maxPrice: 200,
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 750 },
      },
      Case: {
        maxPrice: 100,
      },
      SSD: {
        maxPrice: 150,
        minSpecs: { capacity: 1000 },
      },
      Cooler: {
        maxPrice: 100,
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
      },
      RAM: {
        maxPrice: 200,
        minSpecs: { capacity: 32, speed: 3600 },
      },
      Motherboard: {
        maxPrice: 300,
      },
      PSU: {
        maxPrice: 180,
        minSpecs: { wattage: 850 },
      },
      Case: {
        maxPrice: 200,
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
      },
      RAM: {
        maxPrice: 300,
        minSpecs: { capacity: 32, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 250,
      },
      PSU: {
        maxPrice: 150,
        minSpecs: { wattage: 750 },
      },
      Case: {
        maxPrice: 150,
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
      },
      RAM: {
        maxPrice: 120,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 200,
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 600 },
      },
      Case: {
        maxPrice: 150,
      },
      SSD: {
        maxPrice: 120,
        minSpecs: { capacity: 500 },
      },
      Cooler: {
        maxPrice: 100,
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
      },
      RAM: {
        maxPrice: 100,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 150,
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 600 },
      },
      Case: {
        maxPrice: 120,
      },
      SSD: {
        maxPrice: 100,
        minSpecs: { capacity: 500 },
      },
      Cooler: {
        maxPrice: 80,
      },
    },
  },
];

export interface MissingComponentInfo {
  componentType: keyof BuildSlots;
  reason:
    | "no_stock"
    | "budget_constraint"
    | "compatibility_issue"
    | "no_matching_components";
  details: string;
}

/**
 * Apply build template with improved selection logic
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
  const components = Array.isArray(availableComponents)
    ? availableComponents
    : availableComponents?.data || [];

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

  // Build order for dependencies - CPU first, then case, then motherboard for socket compatibility
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

    // Ensure at least one storage component is selected
    if (!preference && (componentType === "SSD" || componentType === "HDD")) {
      if (!suggestedBuild.SSD && !suggestedBuild.HDD) {
        const basicPreference = {
          maxPrice: Math.min(100, template.targetPrice.max - totalPrice),
          minSpecs: { capacity: componentType === "SSD" ? 500 : 1000 },
        };

        const selectedComponent = selectBestComponent(
          components,
          componentType,
          basicPreference,
          template,
          suggestedBuild,
          template.targetPrice.max - totalPrice
        );

        if (selectedComponent) {
          (suggestedBuild[componentType] as ComponentResponse[]) = [
            selectedComponent,
          ];
          totalPrice += Number(selectedComponent.price) || 0;
        }
      }
      continue;
    }

    if (!preference) continue;

    totalPreferences++;

    const selectedComponent = selectBestComponent(
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
        (suggestedBuild[componentType] as ComponentResponse[]) = [
          selectedComponent,
        ];
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
      // Track missing component
      missingComponents.push({
        componentType,
        reason: "no_matching_components",
        details: `No suitable ${componentType} found within budget and requirements`,
      });
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
    missingComponents,
  };
}

/**
 * Improved component selection with better logic
 */
function selectBestComponent(
  components: ComponentResponse[],
  componentType: keyof BuildSlots,
  preference: ComponentPreference,
  template: BuildTemplate,
  currentBuild: BuildSlots,
  remainingBudget: number
): ComponentResponse | null {
  // Get all components of the correct type that are in stock
  let candidates = components.filter((component) => {
    return (
      component.type === componentType && 
      (component.stockQuantity || 0) > 0
    );
  });

  if (candidates.length === 0) return null;

  // Apply basic compatibility filtering
  candidates = candidates.filter((component) => {
    return isBasicCompatible(component, componentType, currentBuild);
  });

  if (candidates.length === 0) return null;

  // Apply strict budget filtering to prevent overages
  const maxBudget = Math.min(
    preference.maxPrice || 1000,
    remainingBudget * 0.6 // Only use 60% of remaining budget to leave room for other components
  );
  
  candidates = candidates.filter((component) => {
    const price = Number(component.price) || 0;
    return price <= maxBudget && price > 0; // Ensure valid price
  });

  // If no candidates after budget filtering, relax budget constraint
  if (candidates.length === 0) {
    candidates = components.filter((component) => {
      return (
        component.type === componentType && 
        (component.stockQuantity || 0) > 0 &&
        isBasicCompatible(component, componentType, currentBuild)
      );
    });
  }

  if (candidates.length === 0) return null;

  // Apply brand preference if specified
  if (preference.brands && preference.brands.length > 0) {
    const brandFiltered = candidates.filter((component) => {
      return preference.brands!.includes(component.brand || "");
    });
    if (brandFiltered.length > 0) {
      candidates = brandFiltered;
    }
  }

  // Apply minimum specs filtering
  if (preference.minSpecs) {
    const specsFiltered = candidates.filter((component) => {
      return meetsMinimumSpecs(component, componentType, preference);
    });
    if (specsFiltered.length > 0) {
      candidates = specsFiltered;
    }
  }

  // Select best component based on template priority
  if (template.priority.budget >= 4) {
    // Budget builds: pick cheapest
    return candidates.reduce((cheapest, current) =>
      (current.price || 0) < (cheapest.price || 0) ? current : cheapest
    );
  } else {
    // Performance builds: pick from top performers consistently
    const sortedByPrice = candidates.sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );
    // Pick from top 3 to avoid outliers, but do it consistently
    const topChoices = sortedByPrice.slice(0, Math.min(3, sortedByPrice.length));
    
    // Use deterministic selection instead of random to prevent cycling
    // Select based on template ID hash to ensure consistency
    const templateHash = template.id.length % topChoices.length;
    return topChoices[templateHash];
  }
}

/**
 * Basic compatibility check - only the most essential checks
 */
function isBasicCompatible(
  component: ComponentResponse,
  componentType: keyof BuildSlots,
  currentBuild: BuildSlots
): boolean {
  // Socket compatibility for CPU/Motherboard
  if (componentType === "CPU" && currentBuild.Motherboard?.socket && component.socket) {
    return component.socket === currentBuild.Motherboard.socket;
  }

  if (componentType === "Motherboard" && currentBuild.CPU?.socket && component.socket) {
    return component.socket === currentBuild.CPU.socket;
  }

  // RAM type compatibility
  if (componentType === "RAM" && currentBuild.Motherboard?.ramType && component.ramType) {
    return component.ramType === currentBuild.Motherboard.ramType;
  }

  // For everything else, assume compatible
  return true;
}

/**
 * Check if component meets minimum specifications
 */
function meetsMinimumSpecs(
  component: ComponentResponse,
  componentType: keyof BuildSlots,
  preference: ComponentPreference
): boolean {
  if (!preference.minSpecs) return true;

  // CPU specifications
  if (componentType === "CPU") {
    const minCores = preference.minSpecs.cores as number;
    const minThreads = preference.minSpecs.threads as number;

    const coreCount = Number(component.extraCompatibility?.cpu?.cores) || 0;
    const threadCount = Number(component.extraCompatibility?.cpu?.threads) || 0;

    if (minCores && coreCount > 0 && coreCount < minCores) return false;
    if (minThreads && threadCount > 0 && threadCount < minThreads) return false;
  }

  // RAM specifications
  if (componentType === "RAM") {
    const minCapacity = preference.minSpecs.capacity as number;
    const minSpeed = preference.minSpecs.speed as number;

    const memorySize = Number(component.extraCompatibility?.memory?.size_gb) || 0;
    const memorySpeed = Number(component.extraCompatibility?.memory?.speed_mhz) || 0;

    if (minCapacity && memorySize > 0 && memorySize < minCapacity) return false;
    if (minSpeed && memorySpeed > 0 && memorySpeed < minSpeed) return false;
  }

  // PSU specifications
  if (componentType === "PSU") {
    const minWattage = preference.minSpecs.wattage as number;
    const wattage = component.wattage || 0;

    if (minWattage && wattage > 0 && wattage < minWattage) return false;
  }

  // Storage specifications
  if (componentType === "SSD" || componentType === "HDD") {
    const minCapacity = preference.minSpecs.capacity as number;
    const storageCapacity = Number(component.extraCompatibility?.storage?.capacity_gb) || 0;

    if (minCapacity && storageCapacity > 0 && storageCapacity < minCapacity) return false;
  }

  return true;
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

  if (template.useCase.length === 0) {
    errors.push("At least one use case must be specified");
  }

  return errors;
}