# ShowTime - A Cinematic Streaming Guide

[![CI](https://github.com/Rishikapurbey/ShowTime/actions/workflows/ci.yml/badge.svg)](https://github.com/Rishikapurbey/ShowTime/actions/workflows/ci.yml)


A fully responsive, single-page movie discovery application built with React. Inspired by modern streaming services, this app allows users to browse, search, and manage a personalized watchlist in a clean and modern interface.

Live Deployed App: [https://harmonious-maamoul-e4854c.netlify.app/](https://harmonious-maamoul-e4854c.netlify.app/)

---

 Key Features

-  Dynamic Homepage: Displays multiple, horizontally-scrolling rows of movies categorized by genre.
-   Real-Time Search: Dynamically fetches and displays results from the OMDb API as the user types.
-   Detailed Movie Pages: Clicking a movie card navigates to a dedicated page with detailed information like plot, actors, and ratings.
-   User Accounts & Synced Watchlist: Email/password and Google sign-in with Firebase Auth. Each user's watchlist is stored in Firestore, so it follows them across devices.
-   Responsive Design: A clean and modern user interface that works seamlessly on desktop and mobile devices.

---

 Technologies Used

-   Frontend: React, JavaScript (ES6+), CSS3
-   Routing: React Router
-   API Calls: Axios + TanStack Query
-   Auth & Database: Firebase Authentication, Cloud Firestore
-   State Management: React Hooks (`useState`, `useEffect`, `useContext`)
-   Build Tool: Vite
-   Testing: Vitest, React Testing Library

---

## How to Run Locally

To run this project on your own machine:

1.  Clone the repository:
    ```bash
    git clone https://github.com/Rishikapurbey/ShowTime.git
    ```
2.  Navigate into the project directory:
    ```bash
    cd ShowTime
    ```
3.  Install the necessary dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env.local` file with your OMDb API key (get one free at https://www.omdbapi.com/apikey.aspx):
    ```bash
    cp .env.example .env.local
    # then edit VITE_OMDB_KEY in .env.local
    ```
5.  Set up Firebase (free):
    - Create a project at https://console.firebase.google.com and add a **Web app**. Copy its config values into the `VITE_FIREBASE_*` lines in `.env.local`.
    - **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
    - **Firestore Database:** create a database, then paste the contents of `firestore.rules` into the **Rules** tab and publish.
    - **Authentication → Settings → Authorized domains:** add your deployed domain (e.g. your Netlify URL) so Google sign-in works there.
6.  Start the development server:
    ```bash
    npm run dev
    ```


## Running Tests

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), and don't need Firebase or an OMDb key:

```bash
npm test             # run once
npm run test:watch   # re-run on every change
```
