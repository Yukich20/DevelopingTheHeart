function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="Developing The Hart Preview", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export default async (request, context) => {
  const expectedUser = Netlify.env.get("PREVIEW_USER");
  const expectedPass = Netlify.env.get("PREVIEW_PASS");

  if (!expectedUser || !expectedPass) {
    console.error("PREVIEW_USER or PREVIEW_PASS is missing");

    return new Response("Preview authentication is not configured.", {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const auth = request.headers.get("authorization");

  if (!auth || !auth.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(auth.slice(6));
    const separator = decoded.indexOf(":");

    if (separator === -1) {
      return unauthorized();
    }

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);

    if (username !== expectedUser || password !== expectedPass) {
      return unauthorized();
    }

    return context.next();
  } catch (error) {
    console.error("Authentication error:", error);
    return unauthorized();
  }
};
