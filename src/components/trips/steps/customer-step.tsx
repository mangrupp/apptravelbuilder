"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTripDraftStore } from "@/store/trip-draft";
import { UserPlus, Search } from "lucide-react";

export interface CustomerOption {
  id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
}

export function CustomerStep({ customers }: { customers: CustomerOption[] }) {
  const { customer, traveler, setCustomer, setTraveler } = useTripDraftStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      customers.filter((c) =>
        search ? c.name.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [customers, search],
  );

  const totalTravelers = traveler.adults + traveler.children + traveler.infants;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={customer.mode === "existing" ? "default" : "outline"}
              onClick={() => setCustomer({ mode: "existing" })}
            >
              <Search className="h-4 w-4" /> Existing Customer
            </Button>
            <Button
              type="button"
              variant={customer.mode === "new" ? "default" : "outline"}
              onClick={() => setCustomer({ mode: "new", customerId: null })}
            >
              <UserPlus className="h-4 w-4" /> New Customer
            </Button>
          </div>

          {customer.mode === "existing" ? (
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Search customers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No matching customers. Switch to &ldquo;New Customer&rdquo; to add one.
                  </p>
                )}
                {filtered.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCustomer({ customerId: c.id, name: c.name })}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      customer.customerId === c.id
                        ? "border-primary bg-secondary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.whatsapp || c.email || "—"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Customer Name</Label>
                <Input
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ name: e.target.value })}
                  placeholder="Sarah Wijaya"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>WhatsApp</Label>
                <Input
                  value={customer.whatsapp}
                  onChange={(e) => setCustomer({ whatsapp: e.target.value })}
                  placeholder="+62 812 3456 7890"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ email: e.target.value })}
                  placeholder="sarah@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ notes: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traveler Composition</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Adults</Label>
            <Input
              type="number"
              min={1}
              value={traveler.adults}
              onChange={(e) => setTraveler({ adults: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Children</Label>
            <Input
              type="number"
              min={0}
              value={traveler.children}
              onChange={(e) => setTraveler({ children: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Infants</Label>
            <Input
              type="number"
              min={0}
              value={traveler.infants}
              onChange={(e) => setTraveler({ infants: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-3">
            <p className="text-sm text-muted-foreground">
              Total Travelers: <span className="font-semibold text-foreground">{totalTravelers}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
