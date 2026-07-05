# INote

INote is a personal software engineering interview learning dashboard for saving notes, code examples, flashcards, mistakes, quizzes, mock interviews, resources, diagrams, and review sessions in one private workspace.

The app is a Vite single-page frontend with hash routing, Firebase Firestore, Firebase Storage, Bootstrap 5, Bootstrap Icons, Chart.js, CodeMirror, and SortableJS. It is designed to deploy cleanly to GitHub Pages.

## Run Locally

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Firebase Setup

Create a Firebase project, then copy your web app config values into a local `.env` file using `.env.example` as the template.

Firebase Console gives values like:

```js
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
```

Map them to:

```env
VITE_FIREBASE_API_KEY=apiKey
VITE_FIREBASE_AUTH_DOMAIN=authDomain
VITE_FIREBASE_PROJECT_ID=projectId
VITE_FIREBASE_STORAGE_BUCKET=storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=messagingSenderId
VITE_FIREBASE_APP_ID=appId
VITE_PERSONAL_WORKSPACE_ID=personal
```

All data is stored under:

```txt
workspaces/personal
```

## Personal-Use Warning

This project is configured as a personal no-auth app. The demo rules allow open read/write access to the workspace path. This is convenient for private learning projects, but it is not suitable for storing sensitive information or sharing publicly. For a public production app, add authentication and stricter Firebase rules.

## GitHub Pages Deployment

The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` and deploys `dist` with the official GitHub Pages Actions flow.

Replace:

```txt
/REPLACE_WITH_REPOSITORY_NAME/
```

with your GitHub repository name. If the repo is called `inote`, use:

```txt
VITE_GITHUB_PAGES_BASE=/inote/
```

Add these GitHub repository secrets:

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

In repository settings, enable GitHub Pages with **GitHub Actions** as the source.

## Routes

```txt
#/dashboard
#/knowledge
#/notes
#/notes/:id
#/flashcards
#/review
#/coding
#/coding/:id
#/canvas
#/quizzes
#/mock-interview
#/mistakes
#/analytics
#/resources
#/settings
```
