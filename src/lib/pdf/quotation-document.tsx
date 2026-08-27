import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatIDR, formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#10121a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 16, fontWeight: 700 },
  muted: { color: "#676c7b" },
  quoteTitle: { fontSize: 20, fontWeight: 700, textAlign: "right" },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#4f46e5" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  col: { width: "48%" },
  table: { borderTopWidth: 1, borderTopColor: "#e5e7ef", marginTop: 8 },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7ef",
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 8 },
  totalLabel: { fontSize: 13, fontWeight: 700 },
  totalValue: { fontSize: 13, fontWeight: 700, color: "#4f46e5" },
  footer: { marginTop: 32, fontSize: 8, color: "#9497b8", textAlign: "center" },
  termsText: { fontSize: 9, color: "#676c7b", lineHeight: 1.5 },
});

export interface QuotationPDFData {
  company: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  quotationNumber: string;
  createdAt: Date;
  validUntil: Date;
  status: string;
  customer: { name: string; whatsapp: string | null; email: string | null };
  trip: {
    destination: string;
    country: string | null;
    days: number;
    nights: number;
    departureDate: Date;
    returnDate: Date;
    travelStyle: string;
  };
  travelers: { adults: number; children: number; infants: number; total: number };
  items: Array<{ category: string; description: string; amount: number }>;
  sellingPrice: number;
  subtotal: number;
  contingency: number;
  serviceFee: number;
  showInternalFinancials: boolean;
  internalBaseCost?: number;
  internalProfit?: number;
  internalMargin?: number;
  terms: string | null;
  notes: string | null;
}

export function QuotationDocument({ data }: { data: QuotationPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{data.company.name}</Text>
            {data.company.address && <Text style={styles.muted}>{data.company.address}</Text>}
            {data.company.phone && <Text style={styles.muted}>{data.company.phone}</Text>}
            {data.company.email && <Text style={styles.muted}>{data.company.email}</Text>}
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <Text style={styles.muted}>{data.quotationNumber}</Text>
            <Text style={styles.muted}>{formatDate(data.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Prepared For</Text>
            <Text>{data.customer.name}</Text>
            {data.customer.whatsapp && <Text style={styles.muted}>{data.customer.whatsapp}</Text>}
            {data.customer.email && <Text style={styles.muted}>{data.customer.email}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Trip</Text>
            <Text>
              {data.trip.destination}
              {data.trip.country ? `, ${data.trip.country}` : ""}
            </Text>
            <Text style={styles.muted}>
              {data.trip.days}D{data.trip.nights}N · {formatDate(data.trip.departureDate)} -{" "}
              {formatDate(data.trip.returnDate)}
            </Text>
            <Text style={styles.muted}>
              {data.travelers.total} travelers ({data.travelers.adults} adults, {data.travelers.children}{" "}
              children, {data.travelers.infants} infants)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Summary</Text>
          <View style={styles.table}>
            {data.items.map((item, i) => (
              <View style={styles.tableRow} key={i}>
                <Text>{CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.description}</Text>
                <Text>{formatIDR(item.amount)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Package Price</Text>
            <Text style={styles.totalValue}>{formatIDR(data.sellingPrice)}</Text>
          </View>
        </View>

        {data.showInternalFinancials && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internal Financials (not for customer)</Text>
            <View style={styles.row}>
              <Text>Base Cost</Text>
              <Text>{formatIDR(data.internalBaseCost ?? 0)}</Text>
            </View>
            <View style={styles.row}>
              <Text>Profit</Text>
              <Text>{formatIDR(data.internalProfit ?? 0)}</Text>
            </View>
            <View style={styles.row}>
              <Text>Margin</Text>
              <Text>{(data.internalMargin ?? 0).toFixed(1)}%</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity & Payment Terms</Text>
          <Text style={styles.termsText}>Valid until {formatDate(data.validUntil)}.</Text>
          {data.terms && <Text style={styles.termsText}>{data.terms}</Text>}
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.termsText}>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated by {data.company.name} · This quotation is not a confirmed booking until deposit is received.
        </Text>
      </Page>
    </Document>
  );
}
