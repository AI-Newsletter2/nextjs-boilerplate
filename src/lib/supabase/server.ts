import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

type ClientOptions = {
  writeCookies?: boolean;
};

export async function createSupabaseServerClient(
  { writeCookies = false }: ClientOptions = {},
) {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!writeCookies) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (
    error &&
    !["AuthSessionMissingError", "AuthApiError"].includes(error.name)
  ) {
    throw new Error(`Unable to verify your session: ${error.message}`);
  }
  return data.user;
}
