import { prisma } from "@/lib/db/prisma";
import { TemplateForm } from "@/components/templates/template-form";
import { toNumber } from "@/lib/decimal";

export default async function NewTemplatePage() {
  const costDatabaseItems = await prisma.costDatabaseItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Template</h1>
        <p className="text-sm text-muted-foreground">
          Save a reusable itinerary with default costs, markup, and contingency.
        </p>
      </div>
      <TemplateForm
        costDatabaseItems={costDatabaseItems.map((item) => ({ ...item, cost: toNumber(item.cost) }))}
      />
    </div>
  );
}
