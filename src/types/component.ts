// src/types/component.ts
import type { ComponentResponse } from "../api/model";

export interface ComponentCardProps {
  component: ComponentResponse;
  onAddToBuildCart?: (component: ComponentResponse) => void;
  onAddToCheckoutCart?: (component: ComponentResponse) => void;
  showCartButtons?: boolean;
}

export interface StockStatus {
  text: string;
  color: string;
  bgColor: string;
}

export interface ComponentDetail {
  label: string;
  value: string | number | undefined;
  important?: boolean;
}
