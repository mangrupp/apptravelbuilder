import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getQuotationDetail } from "@/lib/queries/quotations";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { QuotationDocument, type QuotationPDFData } from "@/lib/pdf/quotation-document";
import { toNumber } from "@/lib/decimal";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotation = await getQuotationDetail(id);
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const settings = await getSettingsForCurrentUser(userId);

  try {
    const data: QuotationPDFData = {
      company: {
        name: settings.companyName,
        address: settings.companyAddress,
        phone: settings.companyPhone,
        email: settings.companyEmail,
      },
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      validUntil: quotation.validUntil,
      status: quotation.status,
      customer: {
        name: quotation.customer.name,
        whatsapp: quotation.customer.whatsapp,
        email: quotation.customer.email,
      },
      trip: {
        destination: quotation.trip.destination,
        country: quotation.trip.country,
        days: quotation.trip.days,
        nights: quotation.trip.nights,
        departureDate: quotation.trip.departureDate,
        returnDate: quotation.trip.returnDate,
        travelStyle: quotation.trip.travelStyle,
      },
      travelers: {
        adults: quotation.trip.traveler?.adults ?? 0,
        children: quotation.trip.traveler?.children ?? 0,
        infants: quotation.trip.traveler?.infants ?? 0,
        total: quotation.trip.traveler?.total ?? 0,
      },
      items: quotation.items.map((item) => ({
        category: item.category,
        description: item.description,
        amount: toNumber(item.amount),
      })),
      sellingPrice: toNumber(quotation.sellingPrice),
      subtotal: toNumber(quotation.subtotal),
      contingency: toNumber(quotation.contingency),
      serviceFee: toNumber(quotation.serviceFee),
      showInternalFinancials: quotation.showInternalFinancials,
      internalBaseCost: toNumber(quotation.trip.baseCost),
      internalProfit: toNumber(quotation.trip.profit),
      internalMargin: toNumber(quotation.trip.margin),
      terms: quotation.terms,
      notes: quotation.notes,
    };

    const buffer = await renderToBuffer(<QuotationDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotation.quotationNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json({ error: "Could not generate the PDF. Please try again." }, { status: 500 });
  }
}
