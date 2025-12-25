export default async function handler(req, res) {
  // Get code and state from query params
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body>
          <h1>Authorization Failed</h1>
          <p>${error}</p>
          <script>window.close()</script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  // Return HTML that sends the code back to the opener window
  return res.send(`
    <html>
      <body>
        <h1>Authorization Successful!</h1>
        <p>Redirecting back to app...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth-callback', code: '${code}' }, '*');
            window.close();
          } else {
            window.location.href = '/?code=${code}';
          }
        </script>
      </body>
    </html>
  `);
}
