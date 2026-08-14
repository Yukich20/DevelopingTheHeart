/**
 * Private-preview password wall.
 *
 * Runs in front of every request (see the [[edge_functions]] block in
 * netlify.toml) and demands HTTP Basic credentials before Netlify serves
 * anything at all — pages, stylesheets, images, the lot.
 *
 * WHY THIS EXISTS
 * ---------------
 * Ashley is not registered with OBLPCT yet. Until the Board approves her, a
 * site that names her as a Marriage and Family Therapist Associate and lists
 * services and fees should not be reachable by the public. `noindex` keeps a
 * page out of Google; it does not keep anyone out of the page. This does.
 *
 * SETTING THE CREDENTIALS
 * -----------------------
 * Netlify → Site configuration → Environment variables → Add a variable:
 *
 *   PREVIEW_USER   e.g.  ashley
 *   PREVIEW_PASS   a long random string — generate one, don't invent one
 *
 * Then redeploy (Deploys → Trigger deploy → Deploy site). Environment
 * variables are read at request time, but a deploy is the reliable way to be
 * sure the function picks them up.
 *
 * These are a shared doorkey between two people, not per-user accounts. Send
 * the password to Ashley over something that isn't email if you can.
 *
 * FAILURE MODE IS CLOSED, ON PURPOSE
 * ----------------------------------
 * If either variable is missing, this returns 503 rather than letting the
 * request through. A misconfiguration that silently publishes the site is a
 * much worse outcome than a preview that is briefly down.
 *
 * WHAT THIS DOES NOT BREAK
 * ------------------------
 * The consult form POSTs directly to the Apps Script endpoint on
 * script.google.com, not to Netlify, so it keeps working normally from behind
 * this wall. Note that means test submissions land in the real practice inbox
 * and the real inquiry log — use an obvious fake name so Ashley can spot them,
 * and delete the rows afterward.
 *
 * AT LAUNCH
 * ---------
 * Delete this file and the [[edge_functions]] block in netlify.toml, then
 * deploy. That is the whole removal.
 */

export default async (request, context) => {
  const user = Deno.env.get("PREVIEW_USER");
  const pass = Deno.env.get("PREVIEW_PASS");

  // Fail closed. Never serve the site because config is missing.
  if (!user || !pass) {
    return new Response(
      "This preview is not configured yet. Set PREVIEW_USER and PREVIEW_PASS " +
        "in the Netlify site's environment variables, then redeploy.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const supplied = request.headers.get("authorization") || "";
  const expected = "Basic " + btoa(`${user}:${pass}`);

  if (safeEqual(supplied, expected)) {
    return context.next();
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      // The realm string is what the browser shows above the password box.
      "WWW-Authenticate":
        'Basic realm="Developing The Heart — private preview", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8",
      // Belt and braces: a 401 should never be cached or indexed.
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow"
    }
  });
};

/**
 * Length-independent comparison, so the time taken to reject a guess does not
 * leak how many leading characters were correct. Almost certainly unnecessary
 * against a network attacker at this scale, but it costs three lines.
 */
function safeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
