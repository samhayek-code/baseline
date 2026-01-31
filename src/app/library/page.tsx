import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GridLibrary from "@/components/library/GridLibrary";

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: grids } = await supabase
    .from("saved_grids")
    .select("*")
    .order("created_at", { ascending: false });

  return <GridLibrary initialGrids={grids ?? []} />;
}
