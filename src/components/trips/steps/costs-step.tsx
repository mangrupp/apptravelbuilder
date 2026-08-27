"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostItemsEditor } from "@/components/trips/cost-items-editor";
import type { CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { useTripDraftStore } from "@/store/trip-draft";

export function CostsStep({ costDatabaseItems }: { costDatabaseItems: CostDatabaseOption[] }) {
  const { costItems, setCostItems } = useTripDraftStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <CostItemsEditor items={costItems} onChange={setCostItems} costDatabaseItems={costDatabaseItems} />
      </CardContent>
    </Card>
  );
}
