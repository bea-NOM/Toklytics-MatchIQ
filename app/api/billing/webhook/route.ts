export async function POST() {
  return new Response(null, { status: 503, statusText: 'Stripe integration disabled' })
}
