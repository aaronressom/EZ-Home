# EZ Home

A clickable demo of EZ Home, a product line of EZ Day. On the site, a customer books a provider they've never used for a small handyman job, sees the price and scope before anyone arrives, approves any changes, and then confirms or disputes the finished work. We built it for a Johns Hopkins product management course: first a medium-fidelity version for testing, then this polished version based on what testing showed.

The providers, prices, and reviews are made up, and the job photos are free stock photos (credits below). Nothing is booked, charged, or sent anywhere.

The version we tested is kept at https://aaronressom.github.io/EZ-Home/v1/ (git tag `medium-fidelity-v1`). Its screens are unchanged; a strip at the top marks it as the tested version and links back here.

## Run it

Online, open https://aaronressom.github.io/EZ-Home/.

To run it locally, open `index.html` in a browser; there's nothing to build or install. If your browser blocks local files, start a small server from this folder instead:

```
py -3 -m http.server 8000
```

then go to http://localhost:8000.

## The flow (shelf-mounting scenario)

1. Describe the job (required fields are checked)
2. Job matched to a category, or a friendly "we don't handle this yet" for plumbing, electrical, HVAC, or appliances
3. Compare 3 providers: experience with this job, reviews from similar jobs, availability, upfront estimate
4. Pick a 30-minute arrival window
5. Booking confirmation, where the customer sees who, what, when, and the price, plus an optional 1 to 5 confidence question
6. Day of the job: arrival update with one delay notice
7. Mid-job change request: approve or decline, with the original price shown next to the change
8. Completion record: photos, work done, final price vs. estimate
9. Report a problem (branch from step 8), sent to EZ Home support with the full job record
10. End screen with an optional "what mattered most?" question

Each screen has its own URL (`#describe`, `#providers`, `#booked`, ...), so the browser back button works and a refresh keeps your place. "Start over" in the footer resets everything.

To open one screen with the example job already filled in, add `?demo=` and the screen name, for example https://aaronressom.github.io/EZ-Home/?demo=change. Screen names: describe, match, providers, window, booked, arrival, change, complete, report, done.

## What changed after testing

- Stock photos with a time and photographer credit on the completion record, instead of drawings
- A visible rule for change requests: every change needs your OK, with a reason and a photo, and EZ Home support checks with you if changes would raise the total more than 20% above the estimate
- "Report a problem" is a calm outline button with a note saying nothing is cancelled
- Accessibility fixes (star labels, focus after a decision, error messages tied to choices, tap sizes) and a visual polish pass

## Editing

| What | Where |
|---|---|
| Providers, prices, reviews, dates, scope, change request | `js/data.js` |
| Screen text and behavior | `js/app.js` (one render function per screen) |
| Colors, fonts, spacing | `css/styles.css` (tokens at the top) |
| Job photos | `images/after-*.jpg` (1200px) and `images/after-*-600.jpg` (phones); captions and credits in `js/data.js` |
| Link preview image | `images/og-image.png` (1200x630) |
| Logos in the header | `images/ez-home-logo.svg` (EZ Home house badge, letters outlined so no font is needed) and `images/ezday-logo.png` (parent brand) |

Anything pushed to `main` goes live on the site within about a minute, so avoid pushing while a test session is running.

## Test answers

The site saves answers to the optional questions (provider chosen, confidence, change decision, what mattered most) in the tester's own browser, in the console and in `localStorage` under `ezhome-test-log`. To read them after a session, open the browser console and run:

```js
JSON.parse(localStorage.getItem("ezhome-test-log"))
```

## Photo credits

Free photos from [Unsplash](https://unsplash.com), used under the Unsplash License:

- Three floating shelves: Darren Richardson
- Level check: Louis Hansel
- Drilling into the wall: charlesdeluvio
