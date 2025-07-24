# Transkripin

**Transkripin** is a decentralized application (dApp) built on the Internet Computer Protocol (ICP) that leverages AI to transcribe and summarize audio/video content into readable, searchable text — all while maintaining data integrity and user privacy on-chain.

---

## 🚀 Features

- 🎧 **AI-Powered Transcription**  
  Automatically converts audio/video into accurate text.

- 📝 **Smart Summarization**  
  Summarizes long transcripts into clear, concise bullet points or paragraphs.

- 🔍 **Searchable & Sharable**  
  Makes spoken content easy to navigate, copy, and share.

- 🌐 **Multi-language Support**  
  Understand and summarize content in multiple languages.

- 🛡️ **Built on ICP**  
  Runs securely and transparently on decentralized canisters.

---

## ⚙️ Tech Stack

- **Frontend**: [React.js](https://reactjs.org/)  
- **Backend (canisters)**: [Rust](https://www.rust-lang.org/) with [DFINITY SDK (DFX)](https://smartcontracts.org/docs/developers-guide/cli-reference/dfx.html)  
- **Blockchain Platform**: [Internet Computer Protocol (ICP)](https://internetcomputer.org/)  
- **AI Services**: OpenAI Whisper, ollama
- **Deployment**: `dfx deploy`, hosted on the IC network

---

## 📦 Use Cases

- Students auto-transcribing & summarizing lectures  
- Teams converting meetings into summaries  
- Journalists transcribing interviews  
- Podcast listeners creating digestible notes

---

## 📄 How to Run Locally

```bash
# Clone the repo
git clone https://github.com/WCHL25/transkripin.git
cd transkripin

# Start the local Internet Computer replica
dfx start --background

# Deploy the backend canisters
dfx deploy
