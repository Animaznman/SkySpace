# SkySpace Frontend

A modern, AI-powered profile customization platform inspired by MySpace with a dark Excalidraw-style theme.

## Features

- **Dark Theme UI**: Modern dark interface with Excalidraw-inspired styling
- **Profile Editing**: Edit your profile information (name, bio, location, website)
- **AI Theme Generation**: Use natural language prompts to generate custom themes via Gemini API
- **Manual Customization**: Direct HTML/CSS editing for advanced users
- **Template System**: Pre-built themes and custom template uploads
- **Feed Updates**: Display chronological updates on your profile

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page component
│   ├── components/
│   │   ├── ProfilePage.tsx        # Profile display component
│   │   ├── EditProfileModal.tsx   # Profile editing modal
│   │   └── EditHomepageModal.tsx  # Homepage/theme editing modal
│   └── styles/
│       └── globals.css     # Global dark theme styles
├── package.json
└── README.md
```

## Key Components

### EditHomepageModal
- **AI Theme Tab**: Natural language theme generation
- **Manual Code Tab**: Direct HTML/CSS editing
- **Templates Tab**: Pre-made themes and file uploads

### Color Scheme
- Primary Background: `#0d1117`
- Secondary Background: `#161b22` 
- Tertiary Background: `#21262d`
- Text Primary: `#f0f6fc`
- Accent: `#238636` (GitHub green)
- Borders: `#30363d`

## Future Integrations

- Gemini API for AI theme generation
- File upload system for custom assets
- Theme preview system
- Social feed integration