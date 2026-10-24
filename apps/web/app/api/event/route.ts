/** The browser tells the site that a visitor opened some evidence or copied something (step 4.6): one more on a daily counter, nothing else is kept. */
import { isClientEvent, countUse } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = (body as { event?: unknown } | null)?.event;
  if (!isClientEvent(event)) return new Response(null, { status: 400 });
  await countUse(event);
  return new Response(null, { status: 204 });
}
