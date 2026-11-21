import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/src/lib/supabase/server";
import Dashboard from "./pages/Dashboard";

export default async function Page() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/welcome");
  return <Dashboard />;
}
