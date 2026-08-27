-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('FLIGHT', 'ACCOMMODATION', 'TRANSPORTATION', 'ACTIVITY', 'MEAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TravelStyle" AS ENUM ('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR', 'MYR', 'SGD', 'THB', 'JPY', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "ServiceFeeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "AIRecommendationStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "departureCity" TEXT,
    "tripType" TEXT,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "travelStyle" "TravelStyle" NOT NULL DEFAULT 'STANDARD',
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "customerBudget" DECIMAL(14,2),
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "baseCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "contingencyPercent" DECIMAL(6,3) NOT NULL DEFAULT 5,
    "contingencyAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "serviceFeeType" "ServiceFeeType" NOT NULL DEFAULT 'PERCENTAGE',
    "serviceFeeValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "markupPercentage" DECIMAL(6,3) NOT NULL DEFAULT 15,
    "sellingPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "margin" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCost" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "participants" INTEGER,
    "days" INTEGER,
    "nights" INTEGER,
    "total" DECIMAL(14,2) NOT NULL,
    "baseAmountIDR" DECIMAL(14,2) NOT NULL,
    "exchangeRate" DECIMAL(14,6) NOT NULL DEFAULT 1,
    "notes" TEXT,
    "costDatabaseItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostDatabaseItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "destination" TEXT,
    "supplier" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "cost" DECIMAL(14,2) NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostDatabaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "duration" INTEGER NOT NULL,
    "travelStyle" "TravelStyle" NOT NULL DEFAULT 'STANDARD',
    "description" TEXT,
    "defaultMarkup" DECIMAL(6,3) NOT NULL DEFAULT 15,
    "defaultContingency" DECIMAL(6,3) NOT NULL DEFAULT 5,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTemplateCostItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'IDR',
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "participants" INTEGER,
    "days" INTEGER,
    "nights" INTEGER,
    "notes" TEXT,

    CONSTRAINT "TripTemplateCostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "contingency" DECIMAL(14,2) NOT NULL,
    "serviceFee" DECIMAL(14,2) NOT NULL,
    "sellingPrice" DECIMAL(14,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "showInternalFinancials" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "question" TEXT,
    "responseJson" JSONB NOT NULL,
    "status" "AIRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "potentialSavings" DECIMAL(14,2),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'My Travel Agency',
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'IDR',
    "defaultMarkup" DECIMAL(6,3) NOT NULL DEFAULT 15,
    "defaultContingency" DECIMAL(6,3) NOT NULL DEFAULT 5,
    "defaultServiceFeeType" "ServiceFeeType" NOT NULL DEFAULT 'PERCENTAGE',
    "defaultServiceFeeValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quotationTerms" TEXT,
    "showInternalFinancials" BOOLEAN NOT NULL DEFAULT false,
    "currencyRates" JSONB NOT NULL DEFAULT '{"IDR":1,"MYR":3600,"SGD":12000,"THB":440,"JPY":105,"USD":16000,"EUR":17500}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Trip_customerId_idx" ON "Trip"("customerId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Traveler_tripId_key" ON "Traveler"("tripId");

-- CreateIndex
CREATE INDEX "TripCost_tripId_idx" ON "TripCost"("tripId");

-- CreateIndex
CREATE INDEX "TripCost_category_idx" ON "TripCost"("category");

-- CreateIndex
CREATE INDEX "CostDatabaseItem_category_idx" ON "CostDatabaseItem"("category");

-- CreateIndex
CREATE INDEX "CostDatabaseItem_destination_idx" ON "CostDatabaseItem"("destination");

-- CreateIndex
CREATE INDEX "TripTemplateCostItem_templateId_idx" ON "TripTemplateCostItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_tripId_idx" ON "Quotation"("tripId");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "AIRecommendation_tripId_idx" ON "AIRecommendation"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCost" ADD CONSTRAINT "TripCost_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCost" ADD CONSTRAINT "TripCost_costDatabaseItemId_fkey" FOREIGN KEY ("costDatabaseItemId") REFERENCES "CostDatabaseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateCostItem" ADD CONSTRAINT "TripTemplateCostItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TripTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
