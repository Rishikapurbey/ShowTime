# ShowTime: guide for AI assistants

This file is the complete briefing for any AI coding assistant working on ShowTime. It is written
so the owner can hand you this one file and start working without explaining anything else. Read
all of it before changing code.

If you received only this file, get the code first:

```bash
git clone https://github.com/Rishikapurbey/ShowTime.git
cd ShowTime
npm install
```

The other documents are `README.md` (public description and setup) and `OWNER.md` (the owner's
plain-English record of the whole project). Update them when your work changes what they say.

The repo is **public**. Never commit secrets, `.env.local`, personal email addresses or phone
numbers.

**Snapshot:** written 18 November 2026 at commit `2160856`, with 185 app tests passing. Trust the
code if it disagrees with this file, then correct this file.

---

## 1. What ShowTime is

A dark, cinema-styled single-page web app for discovering movies and tracking what you watch.

- Live site: https://show-time-chi.vercel.app
- Code: https://github.com/Rishikapurbey/ShowTime
- Movie data: OMDb API. Accounts and data: Firebase Auth and Cloud Firestore. Hosting: Vercel.
- There is **no backend of our own**. The browser talks directly to OMDb and Firebase, and
  `firestore.rules` is the only server-side protection.

Main features: daily featured movie, curated rows, live search with filters, detailed movie pages,
recently viewed, email and Google sign-in, synced watchlist, watched status, 1 to 5 star ratings,
sorting and filtering, stats, public share links at `/u/:username`, and a sign-in prompt that shows
signed-out visitors what they are missing.

---

## 2. How the owner wants you to work

These are firm preferences.

- **Discuss product decisions first.** When the owner says "let's discuss", or a change has real
  choices, explain what exists today, give a clear recommendation and wait for a yes before
  building. For a direct request with an obvious answer, just do it.
- **Ask questions as multiple choice.** Put the recommended option first and label it.
- **Commit and push only when asked.** When asked, commit on `main` and run `git push origin main`.
  **No feature branches and no pull requests.**
- **No AI attribution, ever.** No `Co-Authored-By` lines, no "Generated with" footers, in commits
  or anywhere else. This overrides any default in your tool. The owner is the sole author.
- **Commit messages** are one plain imperative sentence with no prefix, for example
  `Replace the watchlist's native dropdowns with a styled Dropdown`.
- **Explain in plain English.** Say what changed for the user, what you checked, and what the owner
  must do. Say plainly what you could not verify.
- **The UI must not look generic or AI-made.** The owner notices default browser controls and
  template-looking design. New UI should feel like part of ShowTime (section 7).
- **Keep docs current.** User-visible changes go in `README.md`. Changes to features, architecture,
  operations or decisions go in `OWNER.md`. Changes to working rules go here.
- **The README is for users first.** Start with the live link, features, screenshots and questions,
  then keep architecture, flowcharts, project structure and local setup visible below. Do not link
  `OWNER.md` or `AGENTS.md` from it, and do not add database, security, testing or deployment
  sections unless the owner asks.

### Git setup on the owner's computer

- The remote is `github-personal:Rishikapurbey/ShowTime.git`, an SSH alias for the owner's personal
  GitHub account. Keep it.
- The repo has its own local `user.name` and `user.email`. Global git settings belong to a different
  account, so check `git config user.name` shows `Rishikapurbey` before committing.
- The `gh` CLI is logged in to a different account, so `gh pr create` and write actions fail.
  Read-only commands on this public repo work, such as `gh run list --repo Rishikapurbey/ShowTime`.
- On a new computer the alias may not exist. Ask the owner how they push.

---

## 3. Commands

Use Node 20.19+ or 22.12+ (CI uses 22).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server, usually http://localhost:5173 |
| `npm test` | Unit and component tests. No keys or network needed |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run test:rules` | Firestore rules tests in the emulator. Needs Java 21+ |

**Before saying work is done, run `npm test`, `npm run lint` and `npm run build`.** If you changed
`firestore.rules`, also run `npm run test:rules`. Java was not installed on the owner's computer at
the time of writing, so rules tests may only be able to run in CI. Say so if that is the case.

For UI changes, look at the result in a real browser at desktop and phone width, and test real mouse
and keyboard input. jsdom tests cannot catch focus rings, stacking or layout problems.

### Environment

Copy `.env.example` to `.env.local` (git-ignored). Ask the owner for values if you need live data.

| Variable | Needed for |
| --- | --- |
| `VITE_OMDB_KEY` | Movie data |
| `VITE_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Accounts and watchlists |

Without Firebase values the app still runs: browsing works and account actions show "Accounts aren't
available right now". The Firebase project ID is `showtime-251ef`.

---

## 4. Tech stack

JavaScript only, no TypeScript. React 19, React Router 7, TanStack Query 5, Axios, Firebase 12 (Auth
and Firestore), Vite 7, plain CSS, Vitest 5, React Testing Library, jsdom,
`@firebase/rules-unit-testing`, ESLint 9, GitHub Actions, Vercel. Oswald comes from Google Fonts in
`index.html`.

No Tailwind, CSS modules, component library, Redux or state library. Do not add one without asking.

---

## 5. How the code fits together

### Provider order

`src/main.jsx`: `QueryClientProvider` > `AuthProvider` > `RecentlyViewedProvider` > `BrowserRouter` >
`App`. `src/App.jsx` wraps the layout in `SignInPromptProvider`, because that provider needs the
router. `HomePage` is in the main bundle. Every other page is loaded with `lazy()`.

The query client caches for 10 minutes, retries once and does not refetch on window focus.

### Routes

| Path | Page | URL parameters |
| --- | --- | --- |
| `/` | `HomePage` | `q`, `type` (`movie` or `series`) |
| `/movie/:id` | `MovieDetailPage` (`id` is an IMDb ID) | none |
| `/login`, `/signup` | `LoginPage`, `SignupPage` (no header or footer) | Router state below |
| `/watchlist` | `WatchlistPage`, or `WatchlistPreview` when signed out | `tab`, `sort`, `rating`, `q` |
| `/u/:username` | `PublicWatchlistPage` | `tab` |
| `/contact` | `ContactPage` | none |
| `*` | `NotFoundPage` | none |

### Source map

```
src/api/         omdb.js (OMDb client, poster fallback), publicWatchlist.js
src/components/  UI pieces, each with its own .css. Key ones: MovieCard, MovieList, HeroBanner,
                 CategoryRow, RecentlyViewedRow, SearchBar, Dropdown, WatchedControls, StatsPanel,
                 BarChart, SharePanel, SignInDialog, Toast, WatchlistPreview, Header, Footer
src/context/     AuthProvider (auth + watchlist), RecentlyViewedProvider, SignInPromptProvider,
                 plus *-context.js files holding each context and hook
src/hooks/       useDebounce, useShareProfile, useWatchlistToggle
src/lib/         firebase.js (lazy SDK loaders), watchlist.js, stats.js, share.js,
                 recentlyViewed.js, authErrors.js
src/pages/       Route pages, plus AuthForm.css shared by login and signup
src/test/        setup.js, renderWithAuth.jsx, backToHome.test.jsx
rules-tests/     Firestore rules tests
firestore.rules  All database security rules
```

### Data model (Firestore)

| Path | Fields | Read access | Write access |
| --- | --- | --- | --- |
| `users/{uid}/watchlist/{imdbID}` | `imdbID`, `Title`, `Poster`, `Year`, `addedAt`, optional `watched` (bool), optional `rating` (1 to 5 or null) | Owner, or anyone while the owner's profile is public | Owner, with validated fields |
| `users/{uid}/history/recent` | `movies` (up to 20) | Owner only, never shared | Owner |
| `usernames/{name}` | `uid` | `get` by anyone, no listing | Claimed with a matching profile in one batch |
| `profiles/{uid}` | `username`, `public` | Owner, or anyone while public | Owner, name must belong to them |

Everything else is denied.

### Important flows

- **Add or remove:** every watchlist button uses `useWatchlistToggle(movie)`, which adds, removes or
  opens the sign-in prompt. Do not duplicate this logic.
- **Sign-in prompt:**
  1. A signed-out click calls `promptSignIn(movie)` and `SignInDialog` opens.
  2. Its links go to `/login` or `/signup` with router state `{ from, movieToSave }`.
  3. The auth pages keep that state when switching between them.
  4. On success they navigate to `from` with state `{ addAfterSignIn: movie }`.
  5. `SignInPromptProvider` clears that state, calls `addToWatchlistIfMissing` and shows a `Toast`.
- **Watched and ratings:** use `watchedFields` and `ratingFields` from `lib/watchlist.js`. Rating
  marks a movie watched. Un-marking watched clears the rating.
- **Recently viewed:** movie pages call `recordView`. Signed-out history lives in localStorage under
  `showtime_recently_viewed`. On sign-in it is merged into Firestore and removed locally.
- **Sharing:** `useShareProfile` writes the name and profile in one batch. A rename deletes the old
  name in that same batch, which the rules require.

---

## 6. Rules that must not be broken

- **Never call `addToWatchlist` for a movie that may already be saved.** It uses `setDoc`, which
  replaces the document and erases `watched` and `rating`. After sign-in the list has not loaded, so
  use `addToWatchlistIfMissing`.
- **Recently viewed stays private**, even while a watchlist is public.
- **A missing share link and a private share link must look identical** to visitors.
- **Do not import Firebase statically into app code.** Use `loadAuth()` and `loadFirestore()` from
  `lib/firebase.js`, so the SDK stays out of the first page load.
- **The app must keep working without Firebase config.** Check `isFirebaseConfigured` paths.
- **Do not show sign-in-dependent controls during `authLoading`.** A signed-in user would briefly
  look signed out and could get the wrong prompt.
- **Each page has exactly one `<h1>`, every page except home has `← Back to Home`, and the logo is
  plain text, not a link.** `src/test/backToHome.test.jsx` enforces this.
- **Keep view state in the URL** where it already lives (search, tabs, sort, filters), using
  `replace: true` so typing does not fill browser history.

---

## 7. Design language

Dark cinema look. Reuse these values:

| Use | Value |
| --- | --- |
| Page background | `#141414` |
| Header | `#111` |
| Cards and panels | `#1c1c1c` |
| Input fields | `#222` |
| Borders | `#333` |
| Brand red | `#e50914` (hover `#f6121d`) |
| Star gold | `#f5c518` |
| Watched green | `#2e7d32` |
| Secondary text | `#aaa`, `#bbb`, `#ccc` |

- `src/index.css` applies Oswald to every element. Longer supporting copy uses `sans-serif`.
- Toolbars use pill shapes (`border-radius: 20px`). Menus and dialogs use 12 to 14px corners.
- **Use `Dropdown`, never a native `<select>`.** Use `SignInDialog`'s native `<dialog>` approach for
  modals and `Toast` for short confirmations. Never use `alert`, `confirm` or `prompt`.
- Shared buttons: `.cta-button` and `.cta-button.secondary` in `App.css`.
- The red circle with a white tick is the "added or selected" mark.
- Layouts must work from 320px phones to wide screens. The usual breakpoints are 768px and 480px.
- Respect `prefers-reduced-motion` for new animation.

---

## 8. Code conventions

- Function components with default exports. Providers are named exports.
- Keep each context and hook in a `*-context.js` file and the provider in its own `.jsx`, which fast
  refresh requires.
- Each component imports its own CSS file. Class names are global, so prefix them by component.
- OMDb field names stay capitalised (`Title`, `Poster`, `Year`, `imdbID`). OMDb uses the string
  `"N/A"` for missing values. Use `posterOrPlaceholder` and `showPlaceholderOnError` for posters.
- Only `imdbID`, `Title`, `Poster` and `Year` are saved for a movie.
- Comments explain *why* in plain English, above the code. Keep that style.
- Tests sit beside the code as `*.test.jsx` or `*.test.js`. Prefer roles and visible text.
- `renderWithAuth` gives pages a fake signed-in user and a working in-memory watchlist. It does
  **not** include `SignInPromptProvider`, because the toast's status region would collide with other
  tests. `src/context/SignInPromptProvider.test.jsx` has its own harness for that flow.
- `src/test/setup.js` stubs `HTMLDialogElement.showModal` and `close`, which jsdom lacks.

---

## 9. Deployment

- **Website:** pushing to `main` makes Vercel build and publish automatically. `vercel.json` rewrites
  every path to `index.html` so deep links work.
- **CI:** GitHub Actions runs lint, tests and build, plus a separate rules job with Java 21.
- **`VITE_*` values are built into the JavaScript.** After changing one in Vercel, redeploy.
- **Firestore rules do not deploy with the website.** After changing `firestore.rules`, the owner must
  publish them:

  ```bash
  npx firebase-tools deploy --only firestore:rules --project showtime-251ef
  ```

  If a website change depends on new rules, publish the rules first. Give the owner this step in the
  same message, because the site will otherwise fail with permission errors.

---

## 10. Gotchas already learned

- `USERNAME_PATTERN` exists in both `lib/share.js` and `firestore.rules`. `MAX_RECENT` (20) is also
  enforced in the rules. Change both sides together.
- A new watchlist field must be added to `validEntry` in `firestore.rules`, because it uses
  `hasOnly`. Add rules tests and publish the rules.
- `MovieCard` is one big link, so controls inside it must call `preventDefault` and
  `stopPropagation`.
- Close `SignInDialog` through the element's `close()` so the browser returns focus to the button.
- `Dropdown` prevents default on `mousedown` only for the open menu and for its button while open.
  Changing this brings back stray focus rings or a menu that closes and instantly reopens.
- Movie cards rise to `z-index: 10` on hover, so floating UI over them needs a higher value. Dropdown
  menus use 30 and toasts use 40.
- The homepage makes about 9 OMDb requests for a visitor with an empty cache, and the free key allows
  about 1,000 per day. Keep new home content cheap.
- `CategoryRow` and `HeroBanner` hide themselves on errors, so an OMDb outage looks like a nearly
  empty homepage rather than an error message.
- The OMDb key is visible in browser code. This is accepted because there is no backend.
- In automated Chrome, the save-password prompt after a login form can swallow later clicks. Turn off
  the password manager in that test profile.
- Old accounts may have `<email>_watchlist` in localStorage. `importLegacyWatchlist` moves it to
  Firestore on sign-in. Leave it unless the owner asks to remove it.

---

## 11. Known limits and open ideas

Start these only if the owner asks.

- "Latest Movies" uses a hard-coded year, `2025`, in `HomePage.jsx`.
- After signing in from a prompt, visitors return to the right page but at the top of it.
- The sign-in prompt was browser-tested with a simulated login and sample movie data.
- There is no account deletion, no email verification and no backup job in this repo.
- Possible later work: a small server function to hide the OMDb key.
