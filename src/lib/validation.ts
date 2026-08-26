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

export const eventSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(300),
  month: z.string().trim().max(120).optional().or(z.literal("")),
  period: z.string().trim().max(120).optional().or(z.literal("")),
  target_group: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  // A real employee id or empty for unassigned. Not UUID-validated (seed ids
  // may not be RFC-4122 compliant); the picker only supplies real ids.
  employee_id: z.string().nullable().optional().or(z.literal("")),
});
export type EventInput = z.infer<typeof eventSchema>;

// Empty date string is allowed and stored as NULL.
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  .optional()
  .or(z.literal(""))
  .nullable();

export const eventVisitSchema = z.object({
  school_name: z.string().trim().min(1, "School is required").max(300),
  visit_date: optionalDate,
  attendance_count: z
    .number()
    .int()
    .min(0, "Must be 0 or more")
    .max(1000000)
    .nullable()
    .optional(),
  status: z.enum(["pending", "done"]).optional(),
});
export type EventVisitInput = z.infer<typeof eventVisitSchema>;

export const feedbackSchema = z.object({
  feedback_text: z.string().trim().min(1, "Feedback is required"),
  feedback_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
