import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const travelerSchema = z
  .object({
    adults: z.coerce.number().int().min(1, "At least 1 adult is required"),
    children: z.coerce.number().int().min(0).default(0),
    infants: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.adults + data.children + data.infants > 0, {
    message: "At least one traveler is required",
  });

export type TravelerInput = z.infer<typeof travelerSchema>;
