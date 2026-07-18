import { redirect } from "next/navigation";

/** Legacy path — unified manage hub lives at /manage. */
export default function AccountBookingsRedirect() {
  redirect("/manage");
}
