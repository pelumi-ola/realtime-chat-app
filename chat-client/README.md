# Chatterbox client (React + Vite + Tailwind)

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your server, e.g. http://localhost:5000
npm run dev            # http://localhost:5173
```

Your server's `CLIENT_URL` must be `http://localhost:5173` for CORS and Socket.IO.

## Where to adjust if your server differs
- `src/lib/api.js` – base URL, response-shape handling (`pick`), error text
- `src/context/AuthContext.jsx` – register payload fields (firstName, lastName, userName, email, password)
- `src/components/ChatWindow.jsx` – socket event names/payloads, message routes
