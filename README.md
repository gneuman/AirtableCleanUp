# Airtable Duplicate Cleaner 🚀

A universal, open-source tool to find and merge duplicates in any Airtable base using custom comparison fields and automated linking.

## 🌟 Features
- **Universal Fields**: Compare by Name, Website, Email, or any field you define.
- **Smart Normalization**: Automatically handles URLs (https/www) and text formatting.
- **Master Selection**: Manually choose which record stays as the "Master".
- **Airtable Integration**: Mark a checkbox on the Master and link all duplicates automatically.
- **Vercel Ready**: Deploy as a serverless app in seconds.

## 🛠️ Deployment

### Local Setup
1. Clone the repo.
2. Run `npm install`.
3. Start with `node server.js`.
4. Open `http://localhost:3000`.

### Deploy to Vercel
1. Push this code to a GitHub repository.
2. Connect the repository to Vercel.
3. No environment variables are strictly required for deployment, as the UI provides inputs for Airtable credentials (saved in the browser's LocalStorage).

## 👤 Created by Gabriel Neuman

This tool was born out of a real need to maintain data integrity in complex Airtable ecosystems. After dealing with thousands of duplicate records across multiple bases, I decided to build a universal solution that anyone could use to automate their cleanup workflows.

You can find more about my projects and work at [gabrielneuman.com](https://gabrielneuman.com).

## 📄 License
MIT
