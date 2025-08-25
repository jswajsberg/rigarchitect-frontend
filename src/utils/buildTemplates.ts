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
    };
  };
}

export const BUILD_TEMPLATES: BuildTemplate[] = [
  {
    id: "budget-gaming",
    name: "Budget Gaming Build",
    description:
      "Entry-level gaming PC for 1080p gaming at medium-high settings",
    targetPrice: { min: 600, max: 1000 },
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
        maxPrice: 200,
        minSpecs: { cores: 4, threads: 8 },
      },
      GPU: {
        brands: ["NVIDIA", "AMD"],
        maxPrice: 300,
        features: ["ray_tracing_basic"],
      },
      RAM: {
        maxPrice: 80,
        minSpecs: { capacity: 16, speed: 3200 },
      },
      Motherboard: {
        maxPrice: 120,
        features: ["wifi_optional"],
      },
      PSU: {
        maxPrice: 80,
        minSpecs: { wattage: 500, efficiency: "80_plus" },
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
      GPU: {
        brands: ["Integrated"],
        maxPrice: 0, // Integrated graphics
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
];

/**
 * Apply a build template to suggest components from available inventory
 */
export function applyBuildTemplate(
  template: BuildTemplate,
  availableComponents: ComponentResponse[]
): {
  suggestedBuild: Partial<BuildSlots>;
  totalPrice: number;
  matchQuality: number; // 0-1 score
} {
  const suggestedBuild: Partial<BuildSlots> = {};
  let totalPrice = 0;
  let matchedPreferences = 0;
  let totalPreferences = 0;

  // Helper function to filter and sort components for a type
  const getFilteredComponents = (
    type: string,
    preference?: BuildTemplate["componentPreferences"][keyof BuildTemplate["componentPreferences"]]
  ) => {
    return availableComponents
      .filter((comp) => {
        if (comp.type !== type) return false;
        if (!comp.stockQuantity || comp.stockQuantity <= 0) return false;

        const price = Number(comp.price) || 0;
        if (preference?.maxPrice && price > preference.maxPrice) return false;
        if (price < template.targetPrice.min * 0.1) return false; // Sanity check

        return true;
      })
      .sort((a, b) => {
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
          scoreA +=
            Math.min(
              priceA / (preference?.maxPrice || template.targetPrice.max),
              1
            ) * 5;
          scoreB +=
            Math.min(
              priceB / (preference?.maxPrice || template.targetPrice.max),
              1
            ) * 5;
        }

        return scoreB - scoreA;
      });
  };

  // Select CPU
  if (template.componentPreferences.CPU) {
    const cpuOptions = getFilteredComponents(
      "CPU",
      template.componentPreferences.CPU
    );
    if (cpuOptions.length > 0) {
      suggestedBuild.CPU = cpuOptions[0];
      totalPrice += Number(cpuOptions[0].price) || 0;
      matchedPreferences++;
    }
    totalPreferences++;
  }

  // Select GPU (if not office build)
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

  // Select Motherboard
  if (template.componentPreferences.Motherboard) {
    const mbOptions = getFilteredComponents(
      "Motherboard",
      template.componentPreferences.Motherboard
    );
    // Filter by CPU compatibility if CPU is selected
    const compatibleMb = suggestedBuild.CPU
      ? mbOptions.filter((mb) => mb.socket === suggestedBuild.CPU?.socket)
      : mbOptions;

    if (compatibleMb.length > 0) {
      suggestedBuild.Motherboard = compatibleMb[0];
      totalPrice += Number(compatibleMb[0].price) || 0;
      matchedPreferences++;
    }
    totalPreferences++;
  }

  // Select RAM
  if (template.componentPreferences.RAM) {
    const ramOptions = getFilteredComponents(
      "RAM",
      template.componentPreferences.RAM
    );
    // Filter by motherboard/CPU compatibility
    const compatibleRam = ramOptions.filter((ram) => {
      if (suggestedBuild.CPU?.extraCompatibility) {
        const cpuCompat = suggestedBuild.CPU.extraCompatibility as Record<string, unknown>;
        if (ram.ramType === "DDR4" && cpuCompat.ddr4_support === false)
          return false;
        if (ram.ramType === "DDR5" && cpuCompat.ddr5_support === false)
          return false;
      }
      if (
        suggestedBuild.Motherboard?.ramType &&
        suggestedBuild.Motherboard.ramType !== ram.ramType
      )
        return false;
      return true;
    });

    if (compatibleRam.length > 0) {
      const selectedRam = compatibleRam[0];
      // For higher-end builds, suggest 2 sticks for dual channel
      const stickCount = template.category === "budget" ? 1 : 2;
      suggestedBuild.RAM = Array(stickCount).fill(selectedRam);
      totalPrice += (Number(selectedRam.price) || 0) * stickCount;
      matchedPreferences++;
    }
    totalPreferences++;
  }

  // Select PSU
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

  // Select Storage (SSD preferred)
  const storageOptions = availableComponents.filter(
    (comp) =>
      (comp.type === "SSD" || comp.type === "HDD") &&
      (comp.stockQuantity || 0) > 0
  );

  if (storageOptions.length > 0) {
    // Prefer SSD for all builds except ultra-budget
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

  // Select Case
  const caseOptions = availableComponents.filter(
    (comp) => comp.type === "Case" && (comp.stockQuantity || 0) > 0
  );

  if (caseOptions.length > 0) {
    suggestedBuild.Case = caseOptions[0];
    totalPrice += Number(caseOptions[0].price) || 0;
  }

  // Select Cooler
  const coolerOptions = availableComponents.filter(
    (comp) => comp.type === "Cooler" && (comp.stockQuantity || 0) > 0
  );

  if (coolerOptions.length > 0) {
    // Filter by CPU socket compatibility if available
    const compatibleCoolers = suggestedBuild.CPU
      ? coolerOptions.filter((cooler) => {
          if (!cooler.extraCompatibility?.socket_support) return true;
          const supportedSockets = cooler.extraCompatibility
            .socket_support as unknown as string[];
          return (
            Array.isArray(supportedSockets) &&
            supportedSockets.includes(suggestedBuild.CPU?.socket || "")
          );
        })
      : coolerOptions;

    if (compatibleCoolers.length > 0) {
      suggestedBuild.Cooler = compatibleCoolers[0];
      totalPrice += Number(compatibleCoolers[0].price) || 0;
    }
  }

  const matchQuality =
    totalPreferences > 0 ? matchedPreferences / totalPreferences : 0;

  return {
    suggestedBuild,
    totalPrice,
    matchQuality,
  };
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
      template.targetPrice.min <= maxBudget * 1.2 // Allow some flexibility
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
