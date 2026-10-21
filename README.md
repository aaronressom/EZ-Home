# EZ Home prototype

A clickable, medium-fidelity prototype of **EZ Home** (by EZ Day): a website where a customer books an unfamiliar provider for a small handyman job, sees the price and scope up front, approves any changes, and confirms or disputes the finished work. Built for user testing in a Johns Hopkins product management course.

Everything is fake: providers, prices, reviews, and photos. Nothing is booked, charged, or sent anywhere.

## Run it

- **Online:** open the GitHub Pages link for this repo.
- **Locally:** open `index.html` in a browser. No build step, no install.
  If your browser blocks local files, run a small server from this folder instead:

  ```
  py -3 -m http.server 8000
  ```

  then go to http://localhost:8000.

## The flow (shelf-mounting scenario)

1. Describe the job (required fields are checked)
2. Job matched to a category, or a friendly "we don't handle this yet" for plumbing, electrical, HVAC, or appliances
3. Compare 3 providers: experience with this job, reviews from similar jobs, availability, upfront estimate
4. Pick a 30-minute arrival window
5. Booking confirmation (the key value moment) + optional 1 to 5 confidence question
6. Day of the job: arrival update with one delay notice
7. Mid-job change request: approve or decline, with the original price shown next to the change
8. Completion record: photos, work done, final price vs. estimate
9. Report a problem (branch from step 8), sent to EZ Home support with the full job record
10. End screen + optional "what mattered most?" question

Each screen has its own URL (`#describe`, `#providers`, `#booked`, ...), so the browser back button works. Refreshing keeps your place. Use "Start over" in the footer to reset.

## Editing

| What | Where |
|---|---|
| Providers, prices, reviews, dates, scope, change request | `js/data.js` |
| Screen text and behavior | `js/app.js` (one render function per screen) |
| Colors, fonts, spacing | `css/styles.css` (tokens at the top) |
| "After" photos | `images/after-*.svg` |
| Logos in the header | `images/ez-home-logo.svg` (EZ Home house badge, letters outlined so no font is needed) and `images/ezday-logo.png` (parent brand) |

## Test answers

Answers to the optional questions (provider chosen, confidence, change decision, what mattered most) are written to the browser console and to `localStorage` under `ezhome-test-log`. To read them after a session, open the browser console and run:

```js
JSON.parse(localStorage.getItem("ezhome-test-log"))
```

Nothing is stored on a server.
