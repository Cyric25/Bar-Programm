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
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            margin: 0;
            padding: 1rem;
            box-sizing: border-box;
        }

        .login-container {
            background: var(--card-bg, #1e1e2e);
            border-radius: 1rem;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-header h1 {
            color: var(--primary, #4ecdc4);
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
        }

        .login-header p {
            color: var(--text-muted, #888);
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
            color: var(--text, #e0e0e0);
            font-weight: 500;
        }

        .form-group input {
            padding: 1rem;
            border: 2px solid var(--border, #333);
            border-radius: 0.5rem;
            background: var(--input-bg, #2a2a3a);
            color: var(--text, #e0e0e0);
            font-size: 1.1rem;
            transition: border-color 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary, #4ecdc4);
        }

        .login-btn {
            padding: 1rem;
            background: var(--primary, #4ecdc4);
            color: #000;
            border: none;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
        }

        .login-btn:hover {
            background: var(--primary-hover, #3dbdb5);
        }

        .login-btn:active {
            transform: scale(0.98);
        }

        .error-message {
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid var(--danger, #ff6b6b);
            color: var(--danger, #ff6b6b);
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            text-align: center;
            display: none;
        }

        .error-message.show {
            display: block;
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
            <p>Bitte Passwort eingeben</p>
        </div>

        <form class="login-form" id="login-form">
            <div class="error-message" id="error-message">
                Falsches Passwort
            </div>

            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" name="password" required autofocus>
            </div>

            <button type="submit" class="login-btn">Anmelden</button>
        </form>
    </div>

    <script>
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('error-message');
        const passwordInput = document.getElementById('password');

        // Redirect-URL aus Query-Parameter oder Standard
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || 'index.html';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.classList.remove('show');

            const password = passwordInput.value;

            try {
                const response = await fetch('api/?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    window.location.href = redirectTo;
                } else {
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
