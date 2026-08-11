# MyCycle V2 Web Prototype

A responsive menstrual wellness tracker that runs entirely in the browser.

## Features
- Period start/end logging
- Next-period estimate from cycle history
- Monthly calendar with actual and predicted period days
- Daily mood, symptom, flow, pain, and notes logging
- Cycle statistics and common symptom/mood insights
- Local data export and deletion
- Installable PWA shell when served over localhost/HTTPS

## Run it
Option 1: open `index.html` directly in a browser.

Option 2 (recommended for PWA/service worker):
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.

## Privacy
This prototype uses browser localStorage only. It has no user accounts or cloud backend.

## Important
Predictions are estimates for wellness tracking only. Do not use this app for contraception, pregnancy confirmation, diagnosis, or emergency medical decisions.
