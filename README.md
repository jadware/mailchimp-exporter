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


### ✅ Campaigns
- Folder per campaign under `campaigns/`
- For each campaign:
  - Metadata (`metadata.json`)
  - HTML body (`content.html`) if available
  - Plain text body (`content.txt`) if available
  - Report data (`report.json`) if available
  - Email activity (`email-activity.json`) if available

### ✅ Automations
- Folder per automation under `automations/`
- For each automation:
  - Workflow metadata (`automation.json`)
  - Associated emails (`emails.json`)

### ✅ Audience Metadata
- Folder per list under `audience_metadata/`
- For each list:
  - Tags (`tags.json`)
  - Segments (`segments.json`)

### ✅ Audience Members
- Folder per list under `audience_members/`
- For each list:
  - All members in `members.json` (up to 1000 per page with pagination)

### ✅ Landing Pages
- Folder per landing page under `landing_pages/`
- For each landing page:
  - Metadata (`metadata.json`)
  - HTML body (`content.html`) if available

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

## 📁 Output Folder Structure (under `/export`)

```
export
├── assets/
│ └── files.json
├── audience_members/
│ └── My_List-abc123/
│ └── members.json
├── audience_metadata/
│ └── My_List-abc123/
│ ├── segments.json
│ └── tags.json
├── automations/
│ └── My_Automation-xyz789/
│ ├── automation.json
│ └── emails.json
├── campaigns/
│ └── My_Campaign-def456/
│ ├── metadata.json
│ ├── content.html
│ ├── content.txt
│ ├── report.json
│ └── email-activity.json
├── ecommerce/
│ └── stores/
│ └── My_Store-ghi321/
│ ├── store.json
│ └── orders.json
├── landing_pages/
│ └── My_Landing-xyz123/
│ ├── metadata.json
│ └── content.html
├── surveys/
│ └── surveys.json
├── templates/
│ └── My_Template-456/
│ ├── template.html
│ └── template.json
└── mailchimp-api-key.json *edit this
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