import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const settings = await getSettingsForCurrentUser(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company details, pricing defaults, and currency rates used across every trip.
        </p>
      </div>
      <SettingsForm
        initial={{
          companyName: settings.companyName,
          companyAddress: settings.companyAddress ?? "",
          companyPhone: settings.companyPhone ?? "",
          companyEmail: settings.companyEmail ?? "",
          defaultCurrency: settings.defaultCurrency,
          defaultMarkup: Number(settings.defaultMarkup),
          defaultContingency: Number(settings.defaultContingency),
          defaultServiceFeeType: settings.defaultServiceFeeType,
          defaultServiceFeeValue: Number(settings.defaultServiceFeeValue),
          quotationTerms: settings.quotationTerms ?? "",
          showInternalFinancials: settings.showInternalFinancials,
          currencyRates: settings.currencyRates,
        }}
      />
    </div>
  );
}
