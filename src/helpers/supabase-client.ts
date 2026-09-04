import { createClient } from "@supabase/supabase-js";

export const client = createClient(
  process.env.SUPABASE_HOST || "",
  process.env.SUPABASE_PASSWORD || ""
);
/// esto nose en que momento se puso pero no funciona att Jonathan :D
// export const client = createClient(
//   process.env.SUPABASE_URL || "",
//   process.env.SUPABASE_KEY || ""
// );
