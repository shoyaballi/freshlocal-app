import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const todayStr = today.toISOString().split('T')[0];

    // Get all active meals with recurring days that include today
    const { data: recurringMeals, error: fetchError } = await supabase
      .from('meals')
      .select('*')
      .eq('is_active', true)
      .contains('recurring_days', [dayOfWeek]);

    if (fetchError) {
      throw fetchError;
    }

    if (!recurringMeals || recurringMeals.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recurring meals for today', generated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let generated = 0;

    for (const meal of recurringMeals) {
      // Skip if this meal's available_date is already today
      if (meal.available_date === todayStr) {
        continue;
      }

      // Check if a meal already exists for today from this vendor with same name
      const { data: existing } = await supabase
        .from('meals')
        .select('id')
        .eq('vendor_id', meal.vendor_id)
        .eq('name', meal.name)
        .eq('available_date', todayStr)
        .limit(1);

      if (existing && existing.length > 0) {
        continue;
      }

      // Create new meal entry for today
      const { error: insertError } = await supabase.from('meals').insert({
        vendor_id: meal.vendor_id,
        name: meal.name,
        description: meal.description,
        emoji: meal.emoji,
        image_url: meal.image_url,
        price: meal.price,
        dietary: meal.dietary,
        allergens: meal.allergens,
        spice_level: meal.spice_level,
        stock: meal.max_stock,
        max_stock: meal.max_stock,
        fulfilment_type: meal.fulfilment_type,
        prep_time: meal.prep_time,
        available_date: todayStr,
        recurring_days: meal.recurring_days,
        is_active: true,
      });

      if (!insertError) {
        generated++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Generated ${generated} meals for ${todayStr}`,
        generated,
        dayOfWeek,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
