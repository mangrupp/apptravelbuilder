import Link from "next/link";
import { LayoutTemplate, Plus, MapPin, Calendar } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TemplateRowActions } from "@/components/templates/template-row-actions";
import { TRAVEL_STYLE_LABELS } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { toNumber, toNumberOrNull } from "@/lib/decimal";
import { calculateBaseCostFromItems } from "@/lib/calculations/pricing";

export default async function TemplatesPage() {
  const templates = await prisma.tripTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { costItems: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trip Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reuse a saved itinerary so you never build the same trip from scratch twice.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="h-4 w-4" /> Create Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Save a common itinerary as a template to speed up quoting."
          actionLabel="Create Template"
          actionHref="/templates/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const baseCost = calculateBaseCostFromItems(
              template.costItems.map((item) => ({
                category: item.category,
                unitPrice: toNumber(item.unitPrice),
                quantity: toNumber(item.quantity),
                participants: item.participants,
                days: toNumberOrNull(item.days),
                nights: toNumberOrNull(item.nights),
              })),
            );
            return (
              <Card key={template.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {template.destination}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.isDemo && <Badge variant="muted">Demo</Badge>}
                    <TemplateRowActions id={template.id} name={template.name} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {template.duration}D{template.duration - 1}N
                    </span>
                    <Badge variant="secondary">{TRAVEL_STYLE_LABELS[template.travelStyle]}</Badge>
                  </div>
                  {template.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base cost ({template.costItems.length} items)</span>
                    <span className="font-medium">{formatIDR(baseCost)}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/trips/new?templateId=${template.id}`}>Use Template</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
