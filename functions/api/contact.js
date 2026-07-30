export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const name = formData.get("name") || "";
    const company = formData.get("company") || "";
    const email = formData.get("email") || "";
    const phone = formData.get("phone") || "";
    const service = formData.get("service") || "";
    const message = formData.get("message") || "";

    const turnstileToken = formData.get("cf-turnstile-response");

    if (!turnstileToken) {
      return Response.json(
        { success: false, message: "Please complete the CAPTCHA." },
        { status: 400 }
      );
    }

    // Verify Turnstile
    const verify = await fetch(
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

    const verifyResult = await verify.json();

    if (!verifyResult.success) {
      return Response.json(
        { success: false, message: "CAPTCHA verification failed." },
        { status: 403 }
      );
    }

    // Get Graph access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: env.GRAPH_CLIENT_ID,
          client_secret: env.GRAPH_CLIENT_SECRET,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials"
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return Response.json(
        {
          success: false,
          message: "Unable to obtain Microsoft Graph token.",
          details: tokenData
        },
        { status: 500 }
      );
    }

    // Send the email
    const graphResponse = await fetch(
      "https://graph.microsoft.com/v1.0/users/web@siuslawtech.com/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            subject: `Website Contact Form - ${name}`,
            body: {
              contentType: "HTML",
              content: `
                <h2>New Website Contact Form Submission</h2>

                <table style="border-collapse:collapse">
                  <tr><td><strong>Name</strong></td><td>${name}</td></tr>
                  <tr><td><strong>Company</strong></td><td>${company}</td></tr>
                  <tr><td><strong>Email</strong></td><td>${email}</td></tr>
                  <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
                  <tr><td><strong>Service</strong></td><td>${service}</td></tr>
                </table>

                <h3>Message</h3>

                <p>${message.replace(/\n/g, "<br>")}</p>
              `
            },
            toRecipients: [
              {
                emailAddress: {
                  address: "support@siuslawtech.com"
                }
              }
            ],
            replyTo: [
              {
                emailAddress: {
                  address: email,
                  name: name
                }
              }
            ]
          },
          saveToSentItems: true
        })
      }
    );

    if (!graphResponse.ok) {
      const error = await graphResponse.text();

      return Response.json(
        {
          success: false,
          message: "Graph sendMail failed.",
          details: error
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Your message has been sent."
    });

  } catch (err) {

    return Response.json(
      {
        success: false,
        message: err.message
      },
      { status: 500 }
    );

  }
}