export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const turnstileToken = formData.get("cf-turnstile-response");

    if (!turnstileToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Turnstile verification is required."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Verify the Turnstile token with Cloudflare
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: turnstileToken
        })
      }
    );

    const result = await verifyResponse.json();

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Turnstile verification failed.",
          errors: result["error-codes"]
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Success (for now)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Turnstile verification passed."
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        success: false,
        message: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }
}