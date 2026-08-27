"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CostItemDraft } from "@/lib/types/cost-draft";
import type { CurrencyCode } from "@/lib/currency";

export interface TripDraftCustomer {
  mode: "existing" | "new";
  customerId: string | null;
  name: string;
  whatsapp: string;
  email: string;
  notes: string;
}

export interface TripDraftTraveler {
  adults: number;
  children: number;
  infants: number;
}

export interface TripDraftDetails {
  destination: string;
  country: string;
  city: string;
  departureCity: string;
  tripType: string;
  departureDate: string;
  returnDate: string;
  travelStyle: "BUDGET" | "STANDARD" | "PREMIUM" | "LUXURY";
  currency: CurrencyCode;
  customerBudget: number | null;
}

export interface TripDraftPricing {
  contingencyPercent: number;
  serviceFeeType: "FIXED" | "PERCENTAGE";
  serviceFeeValue: number;
  markupPercentage: number;
}

interface TripDraftState {
  step: number;
  templateId: string | null;
  customer: TripDraftCustomer;
  traveler: TripDraftTraveler;
  details: TripDraftDetails;
  costItems: CostItemDraft[];
  pricing: TripDraftPricing;
  setStep: (step: number) => void;
  setCustomer: (customer: Partial<TripDraftCustomer>) => void;
  setTraveler: (traveler: Partial<TripDraftTraveler>) => void;
  setDetails: (details: Partial<TripDraftDetails>) => void;
  setCostItems: (items: CostItemDraft[]) => void;
  setPricing: (pricing: Partial<TripDraftPricing>) => void;
  loadFromTemplate: (template: {
    id: string;
    destination: string;
    country: string | null;
    city: string | null;
    duration: number;
    travelStyle: string;
    defaultMarkup: number;
    defaultContingency: number;
    costItems: Array<Omit<CostItemDraft, "key">>;
  }) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  templateId: null,
  customer: {
    mode: "existing" as const,
    customerId: null,
    name: "",
    whatsapp: "",
    email: "",
    notes: "",
  },
  traveler: { adults: 2, children: 0, infants: 0 },
  details: {
    destination: "",
    country: "",
    city: "",
    departureCity: "",
    tripType: "Leisure",
    departureDate: "",
    returnDate: "",
    travelStyle: "STANDARD" as const,
    currency: "IDR" as CurrencyCode,
    customerBudget: null,
  },
  costItems: [] as CostItemDraft[],
  pricing: {
    contingencyPercent: 5,
    serviceFeeType: "PERCENTAGE" as const,
    serviceFeeValue: 0,
    markupPercentage: 15,
  },
};

export const useTripDraftStore = create<TripDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setCustomer: (customer) => set((s) => ({ customer: { ...s.customer, ...customer } })),
      setTraveler: (traveler) => set((s) => ({ traveler: { ...s.traveler, ...traveler } })),
      setDetails: (details) => set((s) => ({ details: { ...s.details, ...details } })),
      setCostItems: (costItems) => set({ costItems }),
      setPricing: (pricing) => set((s) => ({ pricing: { ...s.pricing, ...pricing } })),
      loadFromTemplate: (template) =>
        set((s) => ({
          templateId: template.id,
          details: {
            ...s.details,
            destination: template.destination,
            country: template.country ?? "",
            city: template.city ?? "",
            travelStyle: template.travelStyle as TripDraftDetails["travelStyle"],
          },
          pricing: {
            ...s.pricing,
            markupPercentage: template.defaultMarkup,
            contingencyPercent: template.defaultContingency,
          },
          costItems: template.costItems.map((item, index) => ({
            ...item,
            key: `template-${index}-${Date.now()}`,
          })),
        })),
      reset: () => set({ ...initialState, costItems: [] }),
    }),
    { name: "trip-draft-storage" },
  ),
);
