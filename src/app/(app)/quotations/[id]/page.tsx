import { notFound } from "next/navigation";
import { getQuotationDetail } from "@/lib/queries/quotations";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { QuotationPreview } from "@/components/quotation/quotation-preview";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [quotation, settings] = await Promise.all([
    getQuotationDetail(id),
    userId ? getSettingsForCurrentUser(userId) : null,
  ]);

  if (!quotation) notFound();

  return (
    <QuotationPreview
      quotation={quotation}
      company={{
        companyName: settings?.companyName ?? "My Travel Agency",
        companyAddress: settings?.companyAddress ?? "",
        companyPhone: settings?.companyPhone ?? "",
        companyEmail: settings?.companyEmail ?? "",
      }}
    />
  );
}
