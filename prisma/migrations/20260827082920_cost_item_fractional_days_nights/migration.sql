-- Allow fractional days/nights on cost line items (e.g. 3.5 days of meals)
ALTER TABLE "TripCost" ALTER COLUMN "days" TYPE DECIMAL(6,2) USING "days"::decimal(6,2);
ALTER TABLE "TripCost" ALTER COLUMN "nights" TYPE DECIMAL(6,2) USING "nights"::decimal(6,2);
ALTER TABLE "TripTemplateCostItem" ALTER COLUMN "days" TYPE DECIMAL(6,2) USING "days"::decimal(6,2);
ALTER TABLE "TripTemplateCostItem" ALTER COLUMN "nights" TYPE DECIMAL(6,2) USING "nights"::decimal(6,2);
