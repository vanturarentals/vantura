/** Pre-set contact form subjects for common van-hire queries. */
export const CONTACT_SUBJECTS = [
  "Question about an existing booking",
  "Change pick-up or return time",
  "Cancel or refund enquiry",
  "Which van size do I need?",
  "Pricing or payment question",
  "Damage, insurance or excess",
  "Breakdown or roadside help",
  "Feedback about a recent hire",
  "Other",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export function isContactSubject(value: string): value is ContactSubject {
  return (CONTACT_SUBJECTS as readonly string[]).includes(value);
}
