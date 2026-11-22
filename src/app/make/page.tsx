import { redirect } from "next/navigation";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { MakeHero } from "./MakeHero";

export const metadata = { title: "Make my hero · COSME" };
export const dynamic = "force-dynamic";

export default async function MakePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/make");
  const supabase = await supabaseServer();
  const { data: profile } = await supabase.from("profiles").select("consent_at").eq("id", user.id).single();
  return <MakeHero userId={user.id} hasConsent={!!profile?.consent_at} imageServiceReady={!!process.env.OPENAI_API_KEY} />;
}
