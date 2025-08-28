// src/utils/buildTemplates.ts
import type { ComponentResponse } from "../api/model";
import type { BuildSlots } from "./compatibilityChecker";

export interface BuildTemplate {
  id: string;
  name: string;
  description: string;
  targetPrice: {
    min: number;
    max: number;
  };
  category: "budget" | "mid-range" | "high-end" | "enthusiast";
  useCase: string[];
  priority: {
    performance: number; // 1-5
    budget: number; // 1-5
    efficiency: number; // 1-5
    futureProof: number; // 1-5
  };
  componentPreferences: {
    [K in keyof BuildSlots]?: {
      brands?: string[];
      features?: string[];
      minSpecs?: Record<string, unknown>;
      maxPrice?: number;
      fallbackMaxPrice?: number; // Extended budget when primary budget fails
      budgetFlexibility?: number; // 0-1, how much this component can borrow from others
    };
  };
}

export const BUILD_TEMPLATES: BuildTemplate[] = [
  {
    id: "budget-gaming",
    name: "Budget Gaming Build",
    description:
      "Entry-level gaming PC for 1080p gaming at medium-high settings",
    targetPrice: { min: 600, max: 1200 },
    category: "budget",
    useCase: ["Gaming", "1080p", "Esports"],
    priority: {
      performance: 3,
      budget: 5,
      efficiency: 4,
      futureProof: 2,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 280,
        fallbackMaxPrice: 350,
        minSpecs: { cores: 4, threads: 8 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 380,
        fallbackMaxPrice: 480,
        features: ["ray_tracing_basic"],
      },
      RAM: {
        maxPrice: 120,
        fallbackMaxPrice: 160,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 180,
        fallbackMaxPrice: 220,
        features: ["wifi_optional"],
      },
      PSU: {
        maxPrice: 120,
        fallbackMaxPrice: 150,
        minSpecs: { wattage: 500, efficiency: "80_plus" },
      },
    },
  },
  {
    id: "mid-range-gaming",
    name: "Mid-Range Gaming Build",
    description: "Solid 1440p gaming performance with good value balance",
    targetPrice: { min: 1000, max: 1600 },
    category: "mid-range",
    useCase: ["Gaming", "1440p", "Work", "Streaming"],
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
        maxPrice: 500,
        features: ["ray_tracing", "dlss_or_fsr"],
      },
      RAM: {
        maxPrice: 120,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 150,
        features: ["wifi"],
      },
      PSU: {
        maxPrice: 100,
        minSpecs: { wattage: 650, efficiency: "80_plus_bronze" },
      },
    },
  },
  {
    id: "gaming-enthusiast",
    name: "Gaming Enthusiast",
    description:
      "High-end gaming setup for 1440p/4K gaming with maximum settings",
    targetPrice: { min: 1800, max: 3000 },
    category: "high-end",
    useCase: ["Gaming", "1440p", "4K", "VR", "Streaming"],
    priority: {
      performance: 5,
      budget: 2,
      efficiency: 3,
      futureProof: 4,
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
        features: ["ray_tracing", "dlss_or_fsr"],
      },
      RAM: {
        maxPrice: 200,
        minSpecs: { capacity: 32, speed: 3600 },
      },
      Motherboard: {
        maxPrice: 250,
        features: ["wifi", "high_speed_storage"],
      },
      PSU: {
        maxPrice: 150,
        minSpecs: { wattage: 750, efficiency: "80_plus_gold" },
      },
    },
  },
  {
    id: "workstation-pro",
    name: "Professional Workstation",
    description:
      "Content creation and professional workloads with reliability focus",
    targetPrice: { min: 1500, max: 2500 },
    category: "high-end",
    useCase: ["Content Creation", "Video Editing", "CAD", "3D Rendering"],
    priority: {
      performance: 4,
      budget: 3,
      efficiency: 3,
      futureProof: 5,
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
        features: ["professional_drivers", "large_vram"],
      },
      RAM: {
        maxPrice: 300,
        minSpecs: { capacity: 64, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 300,
        features: ["ecc_support", "multiple_gpu_support"],
      },
      PSU: {
        maxPrice: 200,
        minSpecs: { wattage: 850, efficiency: "80_plus_platinum" },
      },
    },
  },
  {
    id: "office-basic",
    name: "Office & Basic Tasks",
    description: "Simple productivity machine for office work and web browsing",
    targetPrice: { min: 400, max: 700 },
    category: "budget",
    useCase: ["Office Work", "Web Browsing", "Light Productivity"],
    priority: {
      performance: 2,
      budget: 5,
      efficiency: 5,
      futureProof: 2,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 150,
        minSpecs: { cores: 4, threads: 4 },
      },
      RAM: {
        maxPrice: 60,
        minSpecs: { capacity: 8, speed: 2666 },
      },
      Motherboard: {
        maxPrice: 80,
        features: ["integrated_graphics_support"],
      },
      PSU: {
        maxPrice: 50,
        minSpecs: { wattage: 300, efficiency: "80_plus" },
      },
    },
  },
  {
    id: "streaming-content",
    name: "Streaming & Content Creation",
    description: "Optimized for streaming, video editing, and content creation",
    targetPrice: { min: 1200, max: 2000 },
    category: "mid-range",
    useCase: ["Streaming", "Video Editing", "Content Creation", "Gaming"],
    priority: {
      performance: 4,
      budget: 3,
      efficiency: 4,
      futureProof: 3,
    },
    componentPreferences: {
      CPU: {
        brands: ["AMD", "Intel"],
        maxPrice: 400,
        minSpecs: { cores: 8, threads: 16 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 600,
        features: ["hardware_encoding", "streaming_features"],
      },
      RAM: {
        maxPrice: 150,
        minSpecs: { capacity: 32, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 180,
        features: ["wifi", "good_connectivity"],
      },
      PSU: {
        maxPrice: 120,
        minSpecs: { wattage: 650, efficiency: "80_plus_gold" },
      },
    },
  },
  {
    id: "mini-itx-compact",
    name: "Compact Mini-ITX Build",
    description: "Small form factor build for space-constrained setups",
    targetPrice: { min: 800, max: 1400 },
    category: "mid-range",
    useCase: ["Gaming", "Compact", "HTPC", "Space-Saving"],
    priority: {
      performance: 3,
      budget: 3,
      efficiency: 5,
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
 * Enhanced template application with complete implementation and error handling
 */
export function applyBuildTemplate(
  template: BuildTemplate,
  availableComponents: ComponentResponse[] | { data: ComponentResponse[] }
): {
  suggestedBuild: BuildSlots;
  totalPrice: number;
  matchQuality: number; // 0-1 score
  budgetWarnings: string[]; // New: warnings about budget overruns
} {
  // Handle both data structures - API response vs direct array
  const components = Array.isArray(availableComponents)
    ? availableComponents
    : availableComponents?.data || [];

  if (!components || components.length === 0) {
    return {
      suggestedBuild: {},
      totalPrice: 0,
      matchQuality: 0,
      budgetWarnings: [],
    };
  }

  // Initialize empty build with all possible component slots to ensure proper clearing
  const suggestedBuild: BuildSlots = {
    CPU: undefined,
    GPU: undefined,
    Motherboard: undefined,
    RAM: [], // Array components need empty arrays, not undefined
    PSU: undefined,
    SSD: [], // Array components need empty arrays, not undefined
    HDD: [], // Array components need empty arrays, not undefined
    Case: undefined,
    Cooler: undefined,
  };
  let totalPrice = 0;
  let matchedPreferences = 0;
  let totalPreferences = 0;
  const budgetWarnings: string[] = [];
  let remainingBudget = template.targetPrice.max;

  // Enhanced helper function with dynamic budget allocation and fallback pricing
  const getFilteredComponents = (
    type: string,
    preference?: BuildTemplate["componentPreferences"][keyof BuildTemplate["componentPreferences"]],
    allocatedBudget?: number
  ) => {
    const effectiveMaxPrice =
      allocatedBudget || preference?.maxPrice || template.targetPrice.max;
    const fallbackMaxPrice =
      preference?.fallbackMaxPrice || effectiveMaxPrice * 1.5;

    // First pass: try to stay within allocated budget
    let filteredComponents = components.filter((comp) => {
      if (comp.type !== type) return false;
      if (!comp.stockQuantity || comp.stockQuantity <= 0) return false;

      const price = Number(comp.price) || 0;

      // Enhanced filtering logic with minSpecs validation
      if (preference?.minSpecs) {
        if (type === "CPU") {
          const cores = Number((comp as any).cores) || 0;
          const threads = Number((comp as any).threads) || 0;
          const minCores = Number(preference.minSpecs.cores) || 0;
          const minThreads = Number(preference.minSpecs.threads) || 0;
          if (minCores > 0 && cores < minCores) return false;
          if (minThreads > 0 && threads < minThreads) return false;
        }

        if (type === "RAM") {
          const capacity = Number((comp as any).capacity) || 0;
          const speed = Number((comp as any).speed) || 0;
          const minCapacity = Number(preference.minSpecs.capacity) || 0;
          const minSpeed = Number(preference.minSpecs.speed) || 0;
          if (minCapacity > 0 && capacity < minCapacity) return false;
          if (minSpeed > 0 && speed < minSpeed) return false;
        }

        if (type === "PSU") {
          const wattage = Number(comp.wattage) || 0;
          const minWattage = Number(preference.minSpecs.wattage) || 0;
          if (minWattage > 0 && wattage < minWattage) return false;
        }
      }

      return price <= effectiveMaxPrice;
    });

    // If no components found within budget, try fallback pricing
    if (filteredComponents.length === 0) {
      filteredComponents = components.filter((comp) => {
        if (comp.type !== type) return false;
        if (!comp.stockQuantity || comp.stockQuantity <= 0) return false;

        const price = Number(comp.price) || 0;
        return price <= fallbackMaxPrice;
      });
    }

    return filteredComponents.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Preferred brands get higher score
      if (preference?.brands?.includes(a.brand || "")) scoreA += 10;
      if (preference?.brands?.includes(b.brand || "")) scoreB += 10;

      // Price scoring based on template priority
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      if (template.priority.budget > template.priority.performance) {
        // Budget priority: prefer lower prices
        scoreA += (1 / (priceA + 1)) * 5;
        scoreB += (1 / (priceB + 1)) * 5;
      } else {
        // Performance priority: prefer higher-end (within budget)
        scoreA += Math.min(priceA / effectiveMaxPrice, 1) * 5;
        scoreB += Math.min(priceB / effectiveMaxPrice, 1) * 5;
      }

      // Stock quantity consideration
      scoreA += Math.min((a.stockQuantity || 0) / 10, 2);
      scoreB += Math.min((b.stockQuantity || 0) / 10, 2);

      return scoreB - scoreA;
    });
  };

  // Dynamic budget allocation system
  const allocateBudgetForComponent = (componentType: string): number => {
    const componentPriorities = {
      CPU: 0.25,
      GPU: 0.35,
      Motherboard: 0.15,
      RAM: 0.1,
      PSU: 0.08,
      Case: 0.05,
      Cooler: 0.02,
    } as const;

    const baseBudget =
      remainingBudget *
      (componentPriorities[componentType as keyof typeof componentPriorities] ||
        0.1);

    // Allow borrowing from remaining budget if component is high priority
    const borrowMultiplier =
      template.priority.performance > template.priority.budget ? 1.5 : 1.2;

    return Math.min(baseBudget * borrowMultiplier, remainingBudget * 0.6);
  };

  // Select CPU first (foundation component for compatibility)
  if (template.componentPreferences.CPU) {
    const allocatedBudget = allocateBudgetForComponent("CPU");
    const cpuOptions = getFilteredComponents(
      "CPU",
      template.componentPreferences.CPU,
      allocatedBudget
    );

    if (cpuOptions.length > 0) {
      const selectedCpu = cpuOptions[0];
      const cpuPrice = Number(selectedCpu.price) || 0;

      suggestedBuild.CPU = selectedCpu;
      totalPrice += cpuPrice;
      remainingBudget -= cpuPrice;
      matchedPreferences++;

      // Check for budget warning
      if (
        template.componentPreferences.CPU.maxPrice &&
        cpuPrice > template.componentPreferences.CPU.maxPrice
      ) {
        budgetWarnings.push(
          `CPU exceeds individual budget: ${cpuPrice} > ${template.componentPreferences.CPU.maxPrice}`
        );
      }
    }
    totalPreferences++;
  }

  // Select Motherboard (must be compatible with CPU socket)
  if (template.componentPreferences.Motherboard) {
    const allocatedBudget = allocateBudgetForComponent("Motherboard");
    const mbOptions = getFilteredComponents(
      "Motherboard",
      template.componentPreferences.Motherboard,
      allocatedBudget
    );

    // Filter by CPU socket compatibility if CPU is selected
    const compatibleMb = suggestedBuild.CPU
      ? mbOptions.filter((mb) => mb.socket === suggestedBuild.CPU?.socket)
      : mbOptions;

    if (compatibleMb.length > 0) {
      const selectedMb = compatibleMb[0];
      const mbPrice = Number(selectedMb.price) || 0;

      suggestedBuild.Motherboard = selectedMb;
      totalPrice += mbPrice;
      remainingBudget -= mbPrice;
      matchedPreferences++;

      // Check for budget warning
      if (
        template.componentPreferences.Motherboard.maxPrice &&
        mbPrice > template.componentPreferences.Motherboard.maxPrice
      ) {
        budgetWarnings.push(
          `Motherboard exceeds individual budget: ${mbPrice} > ${template.componentPreferences.Motherboard.maxPrice}`
        );
      }
    } else if (mbOptions.length > 0) {
      // Fallback to any available motherboard if no socket match found
      const selectedMb = mbOptions[0];
      const mbPrice = Number(selectedMb.price) || 0;

      suggestedBuild.Motherboard = selectedMb;
      totalPrice += mbPrice;
      remainingBudget -= mbPrice;
      matchedPreferences += 0.5; // Partial match since socket may not be compatible

      budgetWarnings.push(
        `Motherboard socket may not match CPU - compatibility issue possible`
      );

      if (
        template.componentPreferences.Motherboard.maxPrice &&
        mbPrice > template.componentPreferences.Motherboard.maxPrice
      ) {
        budgetWarnings.push(
          `Motherboard exceeds individual budget: ${mbPrice} > ${template.componentPreferences.Motherboard.maxPrice}`
        );
      }
    }
    totalPreferences++;
  }

  // Select RAM (must be compatible with CPU/Motherboard)
  if (template.componentPreferences.RAM) {
    const ramOptions = getFilteredComponents(
      "RAM",
      template.componentPreferences.RAM
    );

    // Filter by motherboard/CPU compatibility
    const compatibleRam = ramOptions.filter((ram) => {
      // Check CPU DDR support
      if (suggestedBuild.CPU?.extraCompatibility) {
        const cpuCompat = suggestedBuild.CPU.extraCompatibility as Record<
          string,
          unknown
        >;
        if (ram.ramType === "DDR4" && cpuCompat.ddr4_support === false)
          return false;
        if (ram.ramType === "DDR5" && cpuCompat.ddr5_support === false)
          return false;
      }

      // Check motherboard RAM type compatibility
      if (
        suggestedBuild.Motherboard?.ramType &&
        suggestedBuild.Motherboard.ramType !== ram.ramType
      )
        return false;

      return true;
    });

    if (compatibleRam.length > 0) {
      const selectedRam = compatibleRam[0];
      // For higher-end builds, suggest 2 sticks for dual channel performance
      const stickCount = template.category === "budget" ? 1 : 2;
      
      // Create separate component instances to avoid duplicate React keys
      suggestedBuild.RAM = Array(stickCount).fill(null).map(() => ({ ...selectedRam }));
      totalPrice += (Number(selectedRam.price) || 0) * stickCount;
      matchedPreferences++;
    } else if (ramOptions.length > 0) {
      // Fallback to first available RAM (may have compatibility issues)
      const selectedRam = ramOptions[0];
      suggestedBuild.RAM = [{ ...selectedRam }]; // Create copy to avoid reference issues
      totalPrice += Number(selectedRam.price) || 0;
      matchedPreferences += 0.5;
    } else {
      // No RAM found - explicitly set to empty array to clear previous RAM
      suggestedBuild.RAM = [];
    }
    totalPreferences++;
  } else {
    // Template has no RAM preferences - explicitly clear RAM
    suggestedBuild.RAM = [];
  }

  // Select GPU (skip for office builds that prefer integrated graphics)
  if (template.componentPreferences.GPU && template.id !== "office-basic") {
    const gpuOptions = getFilteredComponents(
      "GPU",
      template.componentPreferences.GPU
    );
    if (gpuOptions.length > 0) {
      suggestedBuild.GPU = gpuOptions[0];
      totalPrice += Number(gpuOptions[0].price) || 0;
      matchedPreferences++;
    }
    totalPreferences++;
  }

  // Select PSU (critical for power requirements)
  if (template.componentPreferences.PSU) {
    const psuOptions = getFilteredComponents(
      "PSU",
      template.componentPreferences.PSU
    );
    if (psuOptions.length > 0) {
      suggestedBuild.PSU = psuOptions[0];
      totalPrice += Number(psuOptions[0].price) || 0;
      matchedPreferences++;
    }
    totalPreferences++;
  }

  // Select Storage (prefer SSD for modern builds)
  const storageOptions = components.filter(
    (comp) =>
      (comp.type === "SSD" || comp.type === "HDD") &&
      (comp.stockQuantity || 0) > 0
  );

  if (storageOptions.length > 0) {
    const ssdOptions = storageOptions.filter((s) => s.type === "SSD");
    const storageChoice =
      ssdOptions.length > 0 ? ssdOptions[0] : storageOptions[0];

    if (storageChoice.type === "SSD") {
      suggestedBuild.SSD = [storageChoice];
    } else {
      suggestedBuild.HDD = [storageChoice];
    }
    totalPrice += Number(storageChoice.price) || 0;
  }

  // Select Case (with form factor compatibility)
  const caseOptions = components.filter(
    (comp) => comp.type === "Case" && (comp.stockQuantity || 0) > 0
  );

  if (caseOptions.length > 0) {
    // Filter by form factor compatibility with motherboard if available
    const compatibleCases = suggestedBuild.Motherboard
      ? caseOptions.filter((caseComp) => {
          if (!caseComp.formFactor || !suggestedBuild.Motherboard?.formFactor)
            return true; // If form factors aren't specified, assume compatibility
          return isFormFactorCompatible(
            suggestedBuild.Motherboard.formFactor,
            caseComp.formFactor
          );
        })
      : caseOptions;

    const selectedCase =
      compatibleCases.length > 0 ? compatibleCases[0] : caseOptions[0];
    suggestedBuild.Case = selectedCase;
    totalPrice += Number(selectedCase.price) || 0;
  }

  // Select Cooler (must be compatible with CPU socket)
  const coolerOptions = components.filter(
    (comp) => comp.type === "Cooler" && (comp.stockQuantity || 0) > 0
  );

  if (coolerOptions.length > 0 && suggestedBuild.CPU?.socket) {
    const compatibleCoolers = coolerOptions.filter((cooler) => {
      const supportedSockets = cooler.extraCompatibility?.socket_support;
      return (
        Array.isArray(supportedSockets) &&
        supportedSockets.includes(suggestedBuild.CPU?.socket || "")
      );
    });

    const selectedCooler =
      compatibleCoolers.length > 0 ? compatibleCoolers[0] : coolerOptions[0];
    suggestedBuild.Cooler = selectedCooler;
    totalPrice += Number(selectedCooler.price) || 0;
  }

  // Final budget check and overall warnings
  if (totalPrice > template.targetPrice.max) {
    budgetWarnings.push(
      `Build total (${totalPrice}) exceeds template budget (${template.targetPrice.max})`
    );
  }

  // Calculate match quality score
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
