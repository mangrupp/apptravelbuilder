import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { TemplateForm } from "@/components/templates/template-form";
import { toNumber, toNumberOrNull } from "@/lib/decimal";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [template, costDatabaseItems] = await Promise.all([
    prisma.tripTemplate.findUnique({ where: { id }, include: { costItems: true } }),
    prisma.costDatabaseItem.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!template) notFound();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Template</h1>
        <p className="text-sm text-muted-foreground">{template.name}</p>
      </div>
      <TemplateForm
        initial={{
          id: template.id,
          name: template.name,
          destination: template.destination,
          country: template.country ?? "",
          city: template.city ?? "",
          duration: template.duration,
          travelStyle: template.travelStyle,
          description: template.description ?? "",
          defaultMarkup: toNumber(template.defaultMarkup),
          defaultContingency: toNumber(template.defaultContingency),
          costItems: template.costItems.map((item, index) => ({
            key: `existing-${index}`,
            category: item.category,
            description: item.description,
            supplier: item.supplier ?? "",
            currency: item.currency,
            unitPrice: toNumber(item.unitPrice),
            quantity: toNumber(item.quantity),
            participants: item.participants,
            days: toNumberOrNull(item.days),
            nights: toNumberOrNull(item.nights),
            notes: item.notes ?? "",
            costDatabaseItemId: null,
          })),
        }}
        costDatabaseItems={costDatabaseItems.map((item) => ({ ...item, cost: toNumber(item.cost) }))}
      />
    </div>
  );
}
