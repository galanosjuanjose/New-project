import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { FoodsBrowser } from "@/components/foods/FoodsBrowser";

export default async function FoodsPage() {
  const { self } = await getProfileContext();
  const supabase = await createClient();
  const { data: foods } = await supabase.from("foods").select("*").order("name");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-4">Foods</h1>
      <FoodsBrowser initialFoods={foods ?? []} selfId={self.id} householdId={self.household_id} />
    </div>
  );
}
