<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>FOS Bar - Login</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #e24614 0%, #c93d12 100%);
            margin: 0;
            padding: 1rem;
            box-sizing: border-box;
        }

        .login-container {
            background: #ffffff;
            border-radius: 1rem;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid #f5ede9;
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-header h1 {
            color: #e24614;
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
        }

        .login-header p {
            color: #666666;
            margin: 0;
        }

        .login-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group label {
            color: #333333;
            font-weight: 500;
        }

        .form-group input {
            padding: 1rem;
            border: 2px solid #f5ede9;
            border-radius: 0.5rem;
            background: #f8f9fa;
            color: #333333;
            font-size: 1.1rem;
            transition: border-color 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #e24614;
        }

        .login-btn {
            padding: 1rem;
            background: #e24614;
            color: #ffffff;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
        }

        .login-btn:hover {
            background: #c93d12;
        }

        .login-btn:active {
            transform: scale(0.98);
        }

        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            text-align: center;
            display: none;
        }

        .error-message.show {
            display: block;
        }

        .user-info {
            text-align: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border, #333);
            color: var(--text-muted, #888);
            font-size: 0.9rem;
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 1.5rem;
            }

            .login-header h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>FOS Bar</h1>
            <p>Bitte anmelden</p>
        </div>

        <form class="login-form" id="login-form">
            <div class="error-message" id="error-message">
                Falscher Benutzername oder Passwort
            </div>

            <div class="form-group">
                <label for="username">Benutzername</label>
                <input type="text" id="username" name="username" required autofocus autocomplete="username">
            </div>

            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>

            <button type="submit" class="login-btn">Anmelden</button>
        </form>

        <div class="user-info" id="user-info" style="display: none;">
            Angemeldet als: <span id="current-user"></span>
        </div>
    </div>

    <script>
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('error-message');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const userInfo = document.getElementById('user-info');
        const currentUserSpan = document.getElementById('current-user');

        // Redirect-URL aus Query-Parameter oder Standard
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || 'index.html';

        // Prüfen ob bereits eingeloggt
        async function checkAuth() {
            try {
                const response = await fetch('api/?action=me');
                const data = await response.json();
                if (data.authenticated && data.user) {
                    // Bereits eingeloggt - direkt weiterleiten
                    window.location.href = redirectTo;
                }
            } catch (e) {
                console.log('Auth-Check fehlgeschlagen');
            }
        }
        checkAuth();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.classList.remove('show');

            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('api/?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Erfolgreicher Login
                    window.location.href = redirectTo;
                } else {
                    errorMsg.textContent = data.error || 'Anmeldung fehlgeschlagen';
                    errorMsg.classList.add('show');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Login-Fehler:', error);
                errorMsg.textContent = 'Verbindungsfehler';
                errorMsg.classList.add('show');
            }
        });
    </script>
</body>
</html>
