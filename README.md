# 📤 Mailchimp Export Script

This Node.js script exports various data from your Mailchimp account via the Mailchimp v3.0 API. It uses only built-in Node.js modules — no external dependencies.

---

## 🔧 Setup

1. **Create API Key File**

   Save your Mailchimp API key to a file named `mailchimp-api-key.json` in the same directory as the script:

   ```json
   {
     "apiKey": "YOUR_API_KEY-usX"
   }
   ```

   Replace `YOUR_API_KEY-usX` with your actual API key, including the datacenter suffix (e.g., `-us5`).

2. **Run the Script**

   ```bash
   node mailchimp-export.js
   ```

---

## 📦 What It Exports

Each dataset is saved into its own folder with structured JSON and HTML where applicable:

### ✅ Templates
- HTML source (`template.html`)
- Metadata (`template.json`)

### ✅ File Manager
- `assets/files.json` with all file metadata

### ✅ Surveys
- `surveys/surveys.json` containing all survey definitions

### ✅ Ecommerce
- One folder per store under `ecommerce/stores`
- For each store:
  - Metadata (`store.json`)
  - Orders (`orders.json`)

---

## 📁 Output Folder Structure

```
.
├── assets/
│   └── files.json
├── ecommerce/
│   └── stores/
│       ├── My_Store-abc123/
│       │   ├── store.json
│       │   └── orders.json
├── surveys/
│   └── surveys.json
├── templates/
│   └── My_Template-456/
│       ├── template.html
│       └── template.json
└── mailchimp-api-key.json
```

---

## 🛠 Notes

- Logging is enabled throughout. You’ll see console output for:
  - Start/end of exports
  - Folders created
  - Files saved or skipped
  - API errors or failures

- If any request fails, a warning will be printed but the script will continue with the next item.

---

## 🔒 Security

Do **not** commit your `mailchimp-api-key.json` to version control. Treat your API key like a password.

---

## 🧪 Tested With

- Node.js 18+
- Mailchimp API v3.0

---

## 📜 License

MIT — use at your own risk.