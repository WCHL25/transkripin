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

## 🔧 Tools Integration
Transkripin uses [FFmpeg](https://ffmpeg.org/) to handle media processing, such as converting uploaded files into audio formats.
### Install FFmpeg
```bash
sudo apt update
sudo apt install ffmpeg -y
```






### Install Whisper
Transkripin contains AI models required for transcription and summarization.

The model is required for transcription using Whisper.  
You can download it directly from Hugging Face.

### Steps:

```bash
# Navigate to the models directory
cd backend/assets/models

# Download the model
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

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
```