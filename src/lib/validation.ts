import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export const managementSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});
export type ManagementInput = z.infer<typeof managementSchema>;

export const applicationSchema = z.object({
  // Just require a selection — the DB foreign key guarantees it's a real
  // employee. (Don't enforce UUID formatting here: sample/seed ids may not be
  // RFC-4122 compliant, and the picker only ever supplies real employee ids.)
  employee_id: z.string().min(1, "Select an employee"),
  management_id: z.string().uuid().nullable().optional(),
  management_name: z.string().trim().max(120).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required"),
  application_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const feedbackSchema = z.object({
  feedback_text: z.string().trim().min(1, "Feedback is required"),
  feedback_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
