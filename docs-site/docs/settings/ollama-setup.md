---
id: ollama-setup
title: Ollama (Local AI) Setup
sidebar_position: 5
---

# Using Ollama with YesBill

Ollama lets you run AI models **locally on your own machine** — completely free, no API keys, no usage limits. YesBill connects to your local Ollama instance through a secure tunnel so the cloud backend can reach it.

---

## Step 1 — Install Ollama

1. Go to [https://ollama.com/download](https://ollama.com/download)
2. Download the **Windows** installer and run it
3. Ollama installs silently and adds a tray icon

**Verify installation:**
```cmd
ollama --version
```

---

## Step 2 — Pull a Model

Download a model before starting the server. Some good options:

| Model | Command | Size | Best for |
|---|---|---|---|
| Gemma 4 | `ollama pull gemma4:latest` | ~5 GB | General use |
| Llama 3.2 | `ollama pull llama3.2` | ~2 GB | Fast responses |
| Qwen3 Coder | `ollama pull qwen3-coder:latest` | ~4 GB | Code & analysis |
| Gemma 3 | `ollama pull gemma3:latest` | ~3 GB | Balanced |

```cmd
ollama pull gemma4:latest
```

List your installed models anytime:
```cmd
ollama list
```

---

## Step 3 — Start Ollama with Tunnel Support

The Ollama tray app binds to `127.0.0.1` only, which blocks external tunnel traffic. You must start it manually with `0.0.0.0` binding.

**First, quit the Ollama tray app** (right-click the tray icon → Quit, or run):
```cmd
taskkill /F /IM "ollama app.exe" /T
taskkill /F /IM ollama.exe /T
```

**Then start Ollama with the correct settings:**
```cmd
set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe" serve
```

You should see in the output:
```
OLLAMA_HOST:http://0.0.0.0:11434
Listening on [::]:11434
```

Keep this window open — Ollama must stay running while you use YesBill.

---

## Step 4 — Install Cloudflare Tunnel

YesBill's backend is hosted in the cloud. It cannot reach `localhost` on your machine. Cloudflare Tunnel creates a secure public URL that forwards traffic to your local Ollama.

**Install via winget:**
```cmd
winget install Cloudflare.cloudflared
```

If `cloudflared` isn't recognized after install, use the full path:
```
C:\Program Files (x86)\cloudflared\cloudflared.exe
```

**Add to PATH permanently (run once in PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files (x86)\cloudflared", "User")
```
Restart any terminal after this.

---

## Step 5 — Start the Tunnel

In a **new** CMD or PowerShell window (keep the Ollama window open):

```cmd
cloudflared tunnel --url http://localhost:11434
```

Or with full path if not in PATH:
```cmd
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:11434
```

After a few seconds you'll see:
```
Your quick Tunnel has been created! Visit it at:
https://some-words-here.trycloudflare.com
```

Copy that URL — you'll need it in the next step.

:::caution
The tunnel URL changes every time you start cloudflared. You must update it in YesBill Settings each session.
:::

---

## Step 6 — Configure YesBill

1. Open **YesBill → Settings → AI**
2. Select the **Ollama** provider tile
3. Paste your `https://xxxx.trycloudflare.com` URL in the **Ollama Base URL** field
4. Click **Fetch Models** — your installed models will appear
5. Select a model from the list
6. Click **Save Changes**

The selected model is now used in **Ask AI** and the **YesBill Agent**.

---

## Every Session Checklist

Each time you restart your computer or want to use Ollama with YesBill:

- [ ] Quit the Ollama tray app (if it auto-started)
- [ ] Run: `set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe" serve`
- [ ] Run cloudflared in a new window: `cloudflared tunnel --url http://localhost:11434`
- [ ] Copy the new tunnel URL → paste in YesBill Settings → Fetch Models → Save

---

## Troubleshooting

### "Cannot connect to Ollama"
- Make sure Ollama is running (Step 3)
- Make sure cloudflared is running (Step 5)
- Make sure the tunnel URL in Settings matches the one printed by cloudflared
- The tunnel URL changes each session — update it in Settings

### "Ollama returned 403"
Ollama is blocking the request. Run it with `OLLAMA_HOST=0.0.0.0` and `OLLAMA_ORIGINS=*` as shown in Step 3.

### "bind: Only one usage of each socket address"
Another Ollama process is using port 11434. Kill it:
```cmd
taskkill /F /IM ollama.exe /T
taskkill /F /IM "ollama app.exe" /T
```
Then retry Step 3.

### "Unable to reach the origin service"
Cloudflare can't reach Ollama. Make sure Ollama started with `OLLAMA_HOST=0.0.0.0:11434` (not `127.0.0.1`). Restart both services.

### No models appear after Fetch Models
You may not have any models installed. Run:
```cmd
ollama pull llama3.2
```
Then click Fetch Models again.

---

:::tip Make it easier
Create a batch file `start-ollama.bat` on your Desktop with:
```bat
@echo off
taskkill /F /IM ollama.exe /T 2>nul
taskkill /F /IM "ollama app.exe" /T 2>nul
timeout /t 1 >nul
start "Ollama" cmd /k "set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe serve"
timeout /t 3 >nul
start "Cloudflared" cmd /k "C:\Program Files (x86)\cloudflared\cloudflared.exe tunnel --url http://localhost:11434"
```
Double-click it to start both services at once. Copy the tunnel URL from the cloudflared window into YesBill Settings.
:::
