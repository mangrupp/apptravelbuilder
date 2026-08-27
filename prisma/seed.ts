import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeTripPricing } from "../src/lib/calculations/computeTrip";
import { DEFAULT_CURRENCY_RATES } from "../src/lib/currency";

const prisma = new PrismaClient();

const PRICING_DEFAULTS = {
  contingencyPercent: 5,
  serviceFeeType: "FIXED" as const,
  serviceFeeValue: 0,
  markupPercentage: 15,
};

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("travelbuilder123", 10);
  const user = await prisma.user.upsert({
    where: { email: "agent@travelbuilder.demo" },
    update: {},
    create: {
      name: "Demo Travel Agent",
      email: "agent@travelbuilder.demo",
      passwordHash,
    },
  });

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: "Nusantara Travel & Tours",
      companyAddress: "Jl. Sudirman No. 45, Jakarta Selatan, Indonesia",
      companyPhone: "+62 21 5551 2345",
      companyEmail: "hello@nusantaratravel.demo",
      defaultCurrency: "IDR",
      defaultMarkup: 15,
      defaultContingency: 5,
      defaultServiceFeeType: "PERCENTAGE",
      defaultServiceFeeValue: 0,
      quotationTerms:
        "50% deposit required to confirm booking. Balance due 14 days before departure. Prices subject to availability at time of booking.",
      showInternalFinancials: false,
      currencyRates: DEFAULT_CURRENCY_RATES,
    },
  });

  // --- Cost Database (demo) ---
  const costDatabaseSeed = [
    { name: "AirAsia Economy - Jakarta to Kuala Lumpur", category: "FLIGHT", destination: "Kuala Lumpur", supplier: "AirAsia", currency: "IDR", cost: 2500000, unit: "per ticket" },
    { name: "Grand Hyatt Kuala Lumpur - Deluxe Room", category: "ACCOMMODATION", destination: "Kuala Lumpur", supplier: "Grand Hyatt", currency: "IDR", cost: 1500000, unit: "per night" },
    { name: "Private Airport Transfer - KL", category: "TRANSPORTATION", destination: "Kuala Lumpur", supplier: "KL Transfers Co", currency: "IDR", cost: 500000, unit: "per trip" },
    { name: "Petronas Twin Towers + City Tour", category: "ACTIVITY", destination: "Kuala Lumpur", supplier: "KL City Tours", currency: "IDR", cost: 750000, unit: "per person" },
    { name: "Daily Meal Package - Standard", category: "MEAL", destination: "Kuala Lumpur", supplier: "Local Restaurants", currency: "IDR", cost: 200000, unit: "per person / day" },
    { name: "Travel Insurance - Standard", category: "OTHER", destination: "Kuala Lumpur", supplier: "AXA Travel", currency: "IDR", cost: 150000, unit: "per person" },
    { name: "Singapore Airlines Economy - Jakarta to Singapore", category: "FLIGHT", destination: "Singapore", supplier: "Singapore Airlines", currency: "IDR", cost: 3200000, unit: "per ticket" },
    { name: "Marina Bay Sands - Deluxe Room", category: "ACCOMMODATION", destination: "Singapore", supplier: "Marina Bay Sands", currency: "SGD", cost: 450, unit: "per night" },
    { name: "Universal Studios Singapore Ticket", category: "ACTIVITY", destination: "Singapore", supplier: "USS", currency: "SGD", cost: 80, unit: "per person" },
    { name: "Thai AirAsia Economy - Jakarta to Bangkok", category: "FLIGHT", destination: "Bangkok", supplier: "Thai AirAsia", currency: "IDR", cost: 2200000, unit: "per ticket" },
    { name: "Anantara Bangkok Riverside - Deluxe Room", category: "ACCOMMODATION", destination: "Bangkok", supplier: "Anantara", currency: "THB", cost: 4500, unit: "per night" },
    { name: "Grand Palace + Wat Arun Tour", category: "ACTIVITY", destination: "Bangkok", supplier: "Bangkok Local Tours", currency: "THB", cost: 1200, unit: "per person" },
    { name: "Garuda Indonesia Economy - Jakarta to Tokyo", category: "FLIGHT", destination: "Tokyo", supplier: "Garuda Indonesia", currency: "IDR", cost: 9500000, unit: "per ticket" },
    { name: "Shinjuku Granbell Hotel - Standard Room", category: "ACCOMMODATION", destination: "Tokyo", supplier: "Granbell Hotel", currency: "JPY", cost: 18000, unit: "per night" },
    { name: "Mount Fuji Day Tour", category: "ACTIVITY", destination: "Tokyo", supplier: "Japan Travel Co", currency: "JPY", cost: 12000, unit: "per person" },
    { name: "Garuda Indonesia Economy - Jakarta to Bali", category: "FLIGHT", destination: "Bali", supplier: "Garuda Indonesia", currency: "IDR", cost: 1800000, unit: "per ticket" },
    { name: "Ubud Village Resort - Pool Villa", category: "ACCOMMODATION", destination: "Bali", supplier: "Ubud Village Resort", currency: "IDR", cost: 1200000, unit: "per night" },
    { name: "Tanah Lot + Uluwatu Tour", category: "ACTIVITY", destination: "Bali", supplier: "Bali Local Tours", currency: "IDR", cost: 400000, unit: "per person" },
  ] as const;

  await prisma.costDatabaseItem.deleteMany({ where: { isDemo: true } });
  await prisma.costDatabaseItem.createMany({
    data: costDatabaseSeed.map((item) => ({ ...item, isDemo: true })),
  });

  // --- Templates (demo) ---
  await prisma.tripTemplate.deleteMany({ where: { isDemo: true } });

  const templateSeeds = [
    {
      name: "Kuala Lumpur 4D3N",
      destination: "Kuala Lumpur",
      country: "Malaysia",
      city: "Kuala Lumpur",
      duration: 4,
      travelStyle: "STANDARD" as const,
      description: "Classic KL city break with Petronas Towers, local cuisine, and a private transfer.",
      defaultMarkup: 15,
      defaultContingency: 5,
      costItems: [
        { category: "FLIGHT" as const, description: "Return economy flight", supplier: "AirAsia", currency: "IDR" as const, unitPrice: 2500000, quantity: 2 },
        { category: "ACCOMMODATION" as const, description: "Deluxe room, 3 nights", supplier: "Grand Hyatt", currency: "IDR" as const, unitPrice: 1500000, quantity: 1, nights: 3 },
        { category: "TRANSPORTATION" as const, description: "Airport transfers", supplier: "KL Transfers Co", currency: "IDR" as const, unitPrice: 500000, quantity: 2 },
        { category: "ACTIVITY" as const, description: "City tour + Petronas Towers", supplier: "KL City Tours", currency: "IDR" as const, unitPrice: 750000, quantity: 1, participants: 2 },
        { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "IDR" as const, unitPrice: 200000, quantity: 1, participants: 2, days: 4 },
      ],
    },
    {
      name: "Singapore 4D3N",
      destination: "Singapore",
      country: "Singapore",
      city: "Singapore",
      duration: 4,
      travelStyle: "PREMIUM" as const,
      description: "Marina Bay stay with Universal Studios and iconic sightseeing.",
      defaultMarkup: 18,
      defaultContingency: 5,
      costItems: [
        { category: "FLIGHT" as const, description: "Return economy flight", supplier: "Singapore Airlines", currency: "IDR" as const, unitPrice: 3200000, quantity: 2 },
        { category: "ACCOMMODATION" as const, description: "Deluxe room, 3 nights", supplier: "Marina Bay Sands", currency: "SGD" as const, unitPrice: 450, quantity: 1, nights: 3 },
        { category: "ACTIVITY" as const, description: "Universal Studios Singapore", supplier: "USS", currency: "SGD" as const, unitPrice: 80, quantity: 1, participants: 2 },
        { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "SGD" as const, unitPrice: 25, quantity: 1, participants: 2, days: 4 },
      ],
    },
    {
      name: "Bangkok 5D4N",
      destination: "Bangkok",
      country: "Thailand",
      city: "Bangkok",
      duration: 5,
      travelStyle: "BUDGET" as const,
      description: "Temples, street food, and riverside relaxation on a budget.",
      defaultMarkup: 12,
      defaultContingency: 5,
      costItems: [
        { category: "FLIGHT" as const, description: "Return economy flight", supplier: "Thai AirAsia", currency: "IDR" as const, unitPrice: 2200000, quantity: 2 },
        { category: "ACCOMMODATION" as const, description: "Deluxe room, 4 nights", supplier: "Anantara", currency: "THB" as const, unitPrice: 4500, quantity: 1, nights: 4 },
        { category: "ACTIVITY" as const, description: "Grand Palace + Wat Arun", supplier: "Bangkok Local Tours", currency: "THB" as const, unitPrice: 1200, quantity: 1, participants: 2 },
        { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "THB" as const, unitPrice: 350, quantity: 1, participants: 2, days: 5 },
      ],
    },
    {
      name: "Tokyo 7D6N",
      destination: "Tokyo",
      country: "Japan",
      city: "Tokyo",
      duration: 7,
      travelStyle: "LUXURY" as const,
      description: "A full week exploring Tokyo and a Mount Fuji day trip.",
      defaultMarkup: 20,
      defaultContingency: 7,
      costItems: [
        { category: "FLIGHT" as const, description: "Return economy flight", supplier: "Garuda Indonesia", currency: "IDR" as const, unitPrice: 9500000, quantity: 2 },
        { category: "ACCOMMODATION" as const, description: "Standard room, 6 nights", supplier: "Granbell Hotel", currency: "JPY" as const, unitPrice: 18000, quantity: 1, nights: 6 },
        { category: "ACTIVITY" as const, description: "Mount Fuji day tour", supplier: "Japan Travel Co", currency: "JPY" as const, unitPrice: 12000, quantity: 1, participants: 2 },
        { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "JPY" as const, unitPrice: 4000, quantity: 1, participants: 2, days: 7 },
      ],
    },
    {
      name: "Bali 4D3N",
      destination: "Bali",
      country: "Indonesia",
      city: "Ubud",
      duration: 4,
      travelStyle: "STANDARD" as const,
      description: "Ubud pool villa with temple tours - a favorite domestic getaway.",
      defaultMarkup: 15,
      defaultContingency: 5,
      costItems: [
        { category: "FLIGHT" as const, description: "Return economy flight", supplier: "Garuda Indonesia", currency: "IDR" as const, unitPrice: 1800000, quantity: 2 },
        { category: "ACCOMMODATION" as const, description: "Pool villa, 3 nights", supplier: "Ubud Village Resort", currency: "IDR" as const, unitPrice: 1200000, quantity: 1, nights: 3 },
        { category: "ACTIVITY" as const, description: "Tanah Lot + Uluwatu tour", supplier: "Bali Local Tours", currency: "IDR" as const, unitPrice: 400000, quantity: 1, participants: 2 },
        { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "IDR" as const, unitPrice: 150000, quantity: 1, participants: 2, days: 4 },
      ],
    },
  ];

  for (const template of templateSeeds) {
    await prisma.tripTemplate.create({
      data: {
        name: template.name,
        destination: template.destination,
        country: template.country,
        city: template.city,
        duration: template.duration,
        travelStyle: template.travelStyle,
        description: template.description,
        defaultMarkup: template.defaultMarkup,
        defaultContingency: template.defaultContingency,
        isDemo: true,
        costItems: { create: template.costItems },
      },
    });
  }

  // --- Customers (demo) ---
  const sarah = await prisma.customer.upsert({
    where: { id: "demo-customer-sarah" },
    update: {},
    create: {
      id: "demo-customer-sarah",
      name: "Sarah Wijaya",
      whatsapp: "+62 812 3456 7890",
      email: "sarah.wijaya@email.demo",
      notes: "Prefers direct flights. Travels with family of 4 adults.",
    },
  });

  const budi = await prisma.customer.upsert({
    where: { id: "demo-customer-budi" },
    update: {},
    create: {
      id: "demo-customer-budi",
      name: "Budi Santoso",
      whatsapp: "+62 813 9988 7766",
      email: "budi.santoso@email.demo",
      notes: "Honeymoon trip, looking for premium experiences.",
    },
  });

  await prisma.customer.upsert({
    where: { id: "demo-customer-lina" },
    update: {},
    create: {
      id: "demo-customer-lina",
      name: "Lina Hartono",
      whatsapp: "+62 811 2233 4455",
      email: "lina.hartono@email.demo",
      notes: "Corporate MICE trip organizer.",
    },
  });

  // --- Acceptance test trip: Sarah Wijaya / Kuala Lumpur 4D3N ---
  await prisma.trip.deleteMany({ where: { id: "demo-trip-sarah-kl" } });

  const acceptanceCostItems = [
    { category: "FLIGHT" as const, description: "Return economy flight for 4 adults", supplier: "AirAsia", currency: "IDR" as const, unitPrice: 2500000, quantity: 4 },
    { category: "ACCOMMODATION" as const, description: "Deluxe room x2, 3 nights", supplier: "Grand Hyatt Kuala Lumpur", currency: "IDR" as const, unitPrice: 1500000, quantity: 2, nights: 3 },
    { category: "TRANSPORTATION" as const, description: "Airport transfers + local transport", supplier: "KL Transfers Co", currency: "IDR" as const, unitPrice: 2000000, quantity: 1 },
    { category: "ACTIVITY" as const, description: "Petronas Towers + city tour", supplier: "KL City Tours", currency: "IDR" as const, unitPrice: 750000, quantity: 1, participants: 4 },
    { category: "MEAL" as const, description: "Daily meal package", supplier: "Local Restaurants", currency: "IDR" as const, unitPrice: 200000, quantity: 1, participants: 4, days: 3.5 },
    { category: "OTHER" as const, description: "Travel insurance + misc", supplier: "AXA Travel", currency: "IDR" as const, unitPrice: 250000, quantity: 4 },
  ];

  const pricing = PRICING_DEFAULTS;
  const computed = computeTripPricing(acceptanceCostItems, pricing, DEFAULT_CURRENCY_RATES);

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 30);
  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + 3);

  const trip = await prisma.trip.create({
    data: {
      id: "demo-trip-sarah-kl",
      customerId: sarah.id,
      destination: "Kuala Lumpur",
      country: "Malaysia",
      city: "Kuala Lumpur",
      departureCity: "Jakarta (CGK)",
      tripType: "Leisure",
      departureDate,
      returnDate,
      days: 4,
      nights: 3,
      travelStyle: "STANDARD",
      currency: "IDR",
      customerBudget: 30_000_000,
      status: "CONFIRMED",
      contingencyPercent: pricing.contingencyPercent,
      serviceFeeType: pricing.serviceFeeType,
      serviceFeeValue: pricing.serviceFeeValue,
      baseCost: computed.baseCost,
      contingencyAmount: computed.contingencyAmount,
      serviceFee: computed.serviceFee,
      markupPercentage: pricing.markupPercentage,
      sellingPrice: computed.sellingPrice,
      profit: computed.profit,
      margin: computed.margin,
      traveler: { create: { adults: 4, children: 0, infants: 0, total: 4 } },
      costs: {
        create: computed.items.map(({ item, total, baseAmountIDR, exchangeRate }) => ({
          category: item.category,
          description: item.description,
          supplier: item.supplier,
          currency: item.currency,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          participants: item.participants ?? null,
          days: item.days ?? null,
          nights: item.nights ?? null,
          total,
          baseAmountIDR,
          exchangeRate,
        })),
      },
    },
  });

  console.log(`Acceptance test trip base cost: ${computed.baseCost} (expected 27,800,000)`);
  console.log(`Acceptance test trip total cost: ${computed.totalCost} (expected 29,190,000)`);

  await prisma.quotation.create({
    data: {
      tripId: trip.id,
      quotationNumber: "QUO-2026-0001",
      customerId: sarah.id,
      status: "SENT",
      subtotal: computed.baseCost,
      contingency: computed.contingencyAmount,
      serviceFee: computed.serviceFee,
      sellingPrice: computed.sellingPrice,
      validUntil: new Date(Date.now() + 14 * 86_400_000),
      terms:
        "50% deposit required to confirm booking. Balance due 14 days before departure. Prices subject to availability.",
      showInternalFinancials: false,
      items: {
        create: [
          { category: "FLIGHT", description: "Flights", amount: Math.round(computed.baseCost > 0 ? (10_000_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 0 },
          { category: "ACCOMMODATION", description: "Accommodation", amount: Math.round(computed.baseCost > 0 ? (9_000_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 1 },
          { category: "TRANSPORTATION", description: "Local Transportation", amount: Math.round(computed.baseCost > 0 ? (2_000_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 2 },
          { category: "ACTIVITY", description: "Activities & Excursions", amount: Math.round(computed.baseCost > 0 ? (3_000_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 3 },
          { category: "MEAL", description: "Meals", amount: Math.round(computed.baseCost > 0 ? (2_800_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 4 },
          { category: "OTHER", description: "Other Arrangements", amount: Math.round(computed.baseCost > 0 ? (1_000_000 / computed.baseCost) * computed.sellingPrice : 0), sortOrder: 5 },
        ],
      },
    },
  });

  // --- Second demo trip: Budi Santoso / Singapore honeymoon (draft, no quotation yet) ---
  await prisma.trip.deleteMany({ where: { id: "demo-trip-budi-sg" } });
  const sgCostItems = [
    { category: "FLIGHT" as const, description: "Return economy flight for 2 adults", supplier: "Singapore Airlines", currency: "IDR" as const, unitPrice: 3200000, quantity: 2 },
    { category: "ACCOMMODATION" as const, description: "Marina Bay Sands, 3 nights", supplier: "Marina Bay Sands", currency: "SGD" as const, unitPrice: 450, quantity: 1, nights: 3 },
    { category: "ACTIVITY" as const, description: "Universal Studios Singapore", supplier: "USS", currency: "SGD" as const, unitPrice: 80, quantity: 1, participants: 2 },
    { category: "MEAL" as const, description: "Daily meals", supplier: "Local Restaurants", currency: "SGD" as const, unitPrice: 30, quantity: 1, participants: 2, days: 4 },
  ];
  const sgComputed = computeTripPricing(
    sgCostItems,
    { contingencyPercent: 5, serviceFeeType: "PERCENTAGE", serviceFeeValue: 3, markupPercentage: 18 },
    DEFAULT_CURRENCY_RATES,
  );
  const sgDeparture = new Date();
  sgDeparture.setDate(sgDeparture.getDate() + 60);
  const sgReturn = new Date(sgDeparture);
  sgReturn.setDate(sgReturn.getDate() + 3);

  await prisma.trip.create({
    data: {
      id: "demo-trip-budi-sg",
      customerId: budi.id,
      destination: "Singapore",
      country: "Singapore",
      city: "Singapore",
      departureCity: "Jakarta (CGK)",
      tripType: "Honeymoon",
      departureDate: sgDeparture,
      returnDate: sgReturn,
      days: 4,
      nights: 3,
      travelStyle: "PREMIUM",
      currency: "IDR",
      customerBudget: 25_000_000,
      status: "DRAFT",
      contingencyPercent: 5,
      serviceFeeType: "PERCENTAGE",
      serviceFeeValue: 3,
      baseCost: sgComputed.baseCost,
      contingencyAmount: sgComputed.contingencyAmount,
      serviceFee: sgComputed.serviceFee,
      markupPercentage: 18,
      sellingPrice: sgComputed.sellingPrice,
      profit: sgComputed.profit,
      margin: sgComputed.margin,
      traveler: { create: { adults: 2, children: 0, infants: 0, total: 2 } },
      costs: {
        create: sgComputed.items.map(({ item, total, baseAmountIDR, exchangeRate }) => ({
          category: item.category,
          description: item.description,
          supplier: item.supplier,
          currency: item.currency,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          participants: item.participants ?? null,
          days: item.days ?? null,
          nights: item.nights ?? null,
          total,
          baseAmountIDR,
          exchangeRate,
        })),
      },
    },
  });

  console.log("Seed complete.");
  console.log("Demo login: agent@travelbuilder.demo / travelbuilder123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
