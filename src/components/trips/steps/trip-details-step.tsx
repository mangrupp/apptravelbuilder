"use client";

import { useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTripDraftStore } from "@/store/trip-draft";
import { CURRENCY_OPTIONS, TRAVEL_STYLE_LABELS } from "@/lib/constants";
import type { CurrencyCode } from "@/lib/currency";

export function TripDetailsStep() {
  const { details, setDetails } = useTripDraftStore();

  const { days, nights } = useMemo(() => {
    if (!details.departureDate || !details.returnDate) return { days: 0, nights: 0 };
    const start = new Date(details.departureDate);
    const end = new Date(details.returnDate);
    const diff = differenceInCalendarDays(end, start);
    if (diff <= 0) return { days: 0, nights: 0 };
    return { days: diff + 1, nights: diff };
  }, [details.departureDate, details.returnDate]);

  const dateError =
    details.departureDate && details.returnDate && new Date(details.returnDate) <= new Date(details.departureDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Destination</Label>
          <Input
            required
            value={details.destination}
            onChange={(e) => setDetails({ destination: e.target.value })}
            placeholder="Kuala Lumpur"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Country</Label>
          <Input value={details.country} onChange={(e) => setDetails({ country: e.target.value })} placeholder="Malaysia" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>City</Label>
          <Input value={details.city} onChange={(e) => setDetails({ city: e.target.value })} placeholder="Kuala Lumpur" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Departure City</Label>
          <Input
            value={details.departureCity}
            onChange={(e) => setDetails({ departureCity: e.target.value })}
            placeholder="Jakarta (CGK)"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Trip Type</Label>
          <Input value={details.tripType} onChange={(e) => setDetails({ tripType: e.target.value })} placeholder="Leisure, Honeymoon, MICE..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Departure Date</Label>
          <Input
            type="date"
            required
            value={details.departureDate}
            onChange={(e) => setDetails({ departureDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Return Date</Label>
          <Input
            type="date"
            required
            value={details.returnDate}
            onChange={(e) => setDetails({ returnDate: e.target.value })}
          />
          {dateError && <p className="text-xs text-destructive">Return date must be after departure date</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Duration</Label>
          <Input disabled value={days > 0 ? `${days}D${nights}N` : "—"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Travel Style</Label>
          <Select value={details.travelStyle} onValueChange={(v) => setDetails({ travelStyle: v as never })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRAVEL_STYLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Select value={details.currency} onValueChange={(v) => setDetails({ currency: v as CurrencyCode })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Customer Budget (IDR)</Label>
          <Input
            type="number"
            min={0}
            value={details.customerBudget ?? ""}
            onChange={(e) =>
              setDetails({ customerBudget: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="30000000"
          />
        </div>
      </CardContent>
    </Card>
  );
}
