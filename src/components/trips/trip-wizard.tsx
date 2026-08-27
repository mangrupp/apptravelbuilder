"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "@/components/trips/wizard-stepper";
import { CustomerStep, type CustomerOption } from "@/components/trips/steps/customer-step";
import { TripDetailsStep } from "@/components/trips/steps/trip-details-step";
import { CostsStep } from "@/components/trips/steps/costs-step";
import { PricingStep } from "@/components/trips/steps/pricing-step";
import { LiveCostSummary } from "@/components/pricing/live-cost-summary";
import type { CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { useTripDraftStore } from "@/store/trip-draft";
import { createTrip } from "@/lib/actions/trips";
import { calculateCategoryTotals } from "@/lib/calculations/costItems";
import { calculatePricing } from "@/lib/calculations/pricing";
import { convertToIDR, type CurrencyRates } from "@/lib/currency";
import { toast } from "@/store/toast";

export function TripWizard({
  customers,
  costDatabaseItems,
  currencyRates,
}: {
  customers: CustomerOption[];
  costDatabaseItems: CostDatabaseOption[];
  currencyRates: CurrencyRates;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useTripDraftStore();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const templateId = searchParams.get("templateId");
    const customerId = searchParams.get("customerId");

    if (templateId && store.templateId !== templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((res) => res.json())
        .then((template) => {
          if (!template.error) store.loadFromTemplate(template);
        })
        .catch(() => {});
    }

    if (customerId && store.customer.customerId !== customerId) {
      const found = customers.find((c) => c.id === customerId);
      if (found) {
        store.setCustomer({ mode: "existing", customerId: found.id, name: found.name });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryTotalsIDR = calculateCategoryTotals(
    store.costItems.map((item) => ({
      category: item.category,
      unitPrice: convertToIDR(item.unitPrice, item.currency, currencyRates),
      quantity: item.quantity,
      participants: item.participants,
      days: item.days,
      nights: item.nights,
    })),
  );
  const baseCost = Object.values(categoryTotalsIDR).reduce((a, b) => a + b, 0);
  const pricingResult = calculatePricing({ baseCost, ...store.pricing });

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (store.customer.mode === "existing" && !store.customer.customerId) {
        return "Select a customer to continue.";
      }
      if (store.customer.mode === "new" && store.customer.name.trim().length < 2) {
        return "Enter the customer's name to continue.";
      }
      if (store.traveler.adults < 1) {
        return "At least one adult traveler is required.";
      }
    }
    if (step === 2) {
      if (!store.details.destination.trim()) return "Destination is required.";
      if (!store.details.departureDate || !store.details.returnDate) {
        return "Departure and return dates are required.";
      }
      if (new Date(store.details.returnDate) <= new Date(store.details.departureDate)) {
        return "Return date must be after departure date.";
      }
    }
    if (step === 3) {
      if (store.costItems.length === 0) return "Add at least one cost item to continue.";
    }
    return null;
  }

  function handleNext() {
    const validationError = validateStep(store.step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    store.setStep(Math.min(store.step + 1, 4));
  }

  function handleBack() {
    setError(null);
    store.setStep(Math.max(store.step - 1, 1));
  }

  function handleSave() {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    startTransition(async () => {
      const payload = {
        customer:
          store.customer.mode === "existing"
            ? { mode: "existing" as const, customerId: store.customer.customerId }
            : {
                mode: "new" as const,
                name: store.customer.name,
                whatsapp: store.customer.whatsapp,
                email: store.customer.email,
                notes: store.customer.notes,
              },
        traveler: store.traveler,
        details: store.details,
        costItems: store.costItems.map(({ key: _key, ...rest }) => rest),
        pricing: store.pricing,
      };

      const result = await createTrip(payload);
      if (!result.success) {
        setError(result.error ?? "Could not save the trip.");
        return;
      }

      toast({ title: "Trip saved", description: "Now configure scenarios, AI, and quotation.", variant: "success" });
      store.reset();
      router.push(`/trips/${result.id}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <WizardStepper step={store.step} />

        {store.step === 1 && <CustomerStep customers={customers} />}
        {store.step === 2 && <TripDetailsStep />}
        {store.step === 3 && <CostsStep costDatabaseItems={costDatabaseItems} />}
        {store.step === 4 && <PricingStep />}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={store.step === 1}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {store.step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Trip
            </Button>
          )}
        </div>
      </div>

      <div>
        <LiveCostSummary
          categoryTotals={categoryTotalsIDR}
          baseCost={pricingResult.baseCost}
          contingencyAmount={pricingResult.contingencyAmount}
          serviceFee={pricingResult.serviceFee}
          totalCost={pricingResult.totalCost}
          sellingPrice={pricingResult.sellingPrice}
          profit={pricingResult.profit}
          margin={pricingResult.margin}
          customerBudget={store.details.customerBudget}
        />
      </div>
    </div>
  );
}
