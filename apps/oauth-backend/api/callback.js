export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Authorization Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .icon-circle {
              width: 100px;
              height: 100px;
              margin: 0 auto 30px;
              background: rgba(255, 255, 255, 0.25);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .icon-circle img {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .container {
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              max-width: 400px;
            }
            .error-icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: #f44336;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              animation: errorPop 0.5s ease-out;
            }
            @keyframes errorPop {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
            .error-x {
              position: relative;
              width: 40px;
              height: 40px;
            }
            .error-x::before,
            .error-x::after {
              content: '';
              position: absolute;
              width: 40px;
              height: 5px;
              background: white;
              border-radius: 3px;
              top: 50%;
              left: 50%;
            }
            .error-x::before {
              transform: translate(-50%, -50%) rotate(45deg);
            }
            .error-x::after {
              transform: translate(-50%, -50%) rotate(-45deg);
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { font-size: 16px; opacity: 0.9; }
            .error { color: #ff6b6b; background: rgba(255, 107, 107, 0.2); padding: 12px; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div>
            <div class="icon-circle">
              <img src="/assets/splash-icon.png" alt="AccellaX" />
            </div>
            <div class="container">
              <div class="error-icon">
                <div class="error-x"></div>
              </div>
              <h1>Authorization Failed</h1>
              <div class="error">${error}</div>
              <p style="margin-top: 20px; font-size: 14px;">
                You can close this window and try again.
              </p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.close(); }, 3000);
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Missing Authorization Code</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .icon-circle {
              width: 100px;
              height: 100px;
              margin: 0 auto 30px;
              background: rgba(255, 255, 255, 0.25);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .icon-circle img {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .container {
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              max-width: 400px;
            }
            .warning-icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: #FF9800;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              animation: warningPop 0.5s ease-out;
            }
            @keyframes warningPop {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
            .warning-triangle {
              width: 0;
              height: 0;
              border-left: 25px solid transparent;
              border-right: 25px solid transparent;
              border-bottom: 43px solid white;
              position: relative;
            }
            .warning-exclamation {
              position: absolute;
              width: 4px;
              height: 20px;
              background: #FF9800;
              left: 50%;
              top: 8px;
              transform: translateX(-50%);
              border-radius: 2px;
            }
            .warning-exclamation::after {
              content: '';
              position: absolute;
              width: 5px;
              height: 5px;
              background: #FF9800;
              border-radius: 50%;
              left: 50%;
              bottom: -10px;
              transform: translateX(-50%);
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { font-size: 16px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div>
            <div class="icon-circle">
              <img src="/assets/splash-icon.png" alt="AccellaX" />
            </div>
            <div class="container">
              <div class="warning-icon">
                <div class="warning-triangle">
                  <div class="warning-exclamation"></div>
                </div>
              </div>
              <h1>No Authorization Code</h1>
              <p>Please try signing in again.</p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.close(); }, 3000);
          </script>
        </body>
      </html>
    `);
  }

  // Success! Redirect to app with authorization code
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Authorization Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .icon-circle {
            width: 100px;
            height: 100px;
            margin: 0 auto 30px;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
          }
          .icon-circle img {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .container {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
          }
          .checkmark-circle {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            animation: checkPop 0.5s ease-out;
          }
          @keyframes checkPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          .checkmark {
            width: 25px;
            height: 45px;
            border: solid white;
            border-width: 0 4px 4px 0;
            transform: rotate(45deg) translateX(-2px) translateY(-3px);
            animation: checkDraw 0.4s ease-out 0.2s backwards;
          }
          @keyframes checkDraw {
            0% { 
              height: 0;
              opacity: 0;
            }
            100% { 
              height: 45px;
              opacity: 1;
            }
          }
          h1 { 
            font-size: 28px; 
            margin-bottom: 16px;
            animation: fadeIn 0.5s ease-out 0.3s backwards;
          }
          p { 
            font-size: 16px; 
            opacity: 0.9;
            animation: fadeIn 0.5s ease-out 0.4s backwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .spinner {
            width: 50px;
            height: 50px;
            margin: 20px auto;
            position: relative;
            animation: fadeIn 0.5s ease-out 0.5s backwards;
          }
          .blade {
            position: absolute;
            width: 4px;
            height: 12px;
            background: white;
            border-radius: 2px;
            left: 50%;
            top: 50%;
            transform-origin: 2px 25px;
            margin-left: -2px;
            margin-top: -25px;
            animation: spinBlade 1s linear infinite;
          }
          .blade:nth-child(1) { transform: rotate(0deg); animation-delay: 0s; opacity: 1; }
          .blade:nth-child(2) { transform: rotate(30deg); animation-delay: -0.083s; opacity: 0.92; }
          .blade:nth-child(3) { transform: rotate(60deg); animation-delay: -0.166s; opacity: 0.84; }
          .blade:nth-child(4) { transform: rotate(90deg); animation-delay: -0.25s; opacity: 0.76; }
          .blade:nth-child(5) { transform: rotate(120deg); animation-delay: -0.333s; opacity: 0.68; }
          .blade:nth-child(6) { transform: rotate(150deg); animation-delay: -0.416s; opacity: 0.6; }
          .blade:nth-child(7) { transform: rotate(180deg); animation-delay: -0.5s; opacity: 0.52; }
          .blade:nth-child(8) { transform: rotate(210deg); animation-delay: -0.583s; opacity: 0.44; }
          .blade:nth-child(9) { transform: rotate(240deg); animation-delay: -0.666s; opacity: 0.36; }
          .blade:nth-child(10) { transform: rotate(270deg); animation-delay: -0.75s; opacity: 0.28; }
          .blade:nth-child(11) { transform: rotate(300deg); animation-delay: -0.833s; opacity: 0.2; }
          .blade:nth-child(12) { transform: rotate(330deg); animation-delay: -0.916s; opacity: 0.12; }
          @keyframes spinBlade {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div>
          <div class="icon-circle">
            <img src="/assets/splash-icon.png" alt="AccellaX" />
          </div>
          <div class="container">
            <div class="checkmark-circle">
              <div class="checkmark"></div>
            </div>
            <h1>Authorization Successful!</h1>
            <div class="spinner">
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
            </div>
            <p>Returning to AccellaX 361°...</p>
            <p style="font-size: 12px; margin-top: 20px; opacity: 0.7;">
              If the app doesn't open automatically, you can close this window.
            </p>
          </div>
        </div>
        <script>
          setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
              window.location.href = 'accellax361://oauth/callback?code=${encodeURIComponent(code)}';
              setTimeout(() => { window.close(); }, 500);
            }, 500);
          }, 1500);
        </script>
      </body>
      </html>
  `);
}