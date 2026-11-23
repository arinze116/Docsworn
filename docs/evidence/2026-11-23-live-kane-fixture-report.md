# Documentation Truth Report

- Repository: /home/ubuntu/projects/Docsworn/demo/fixture-app
- Live target: http://127.0.0.1:4173
- Generated: 2026-11-23T14:13:03.699Z
- Claim analysis: offline
- Kane evidence: live-kane
- Truth score: **25%** (1/4 executed claims verified)
- Totals: 5 claims; 3 false; 1 unverifiable; 0 errors; 0 pending

## ❌ claim-001: failed

> Open /register and click 'Submit' to create a new account.

- Source: `README.md:7`
- Flow type: web
- Kane flow: `../../../../tmp/live/flows/claim-001_test.md`
- Observation: The test uses an outdated button name. The page loaded normally and shows an Email field with a “Create account” button instead.
Update the test instruction and button locator to use “Create account,” then enter a valid test email and verify account creation.
- Kane session: https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BTA5W963JRX5MASB6W3KB/dashboard/share/US_PI1EL450XRLNIS9EYEJ0SJN16GVDD0C4L0V9ZIV5UTDMNZNCU6VBWJ62HDLPDFID?type=summary&agentView=true&fqdn=summary-page
- Suggested documentation: **Review this claim. Kane observed: The test uses an outdated button name. The page loaded normally and shows an Email field with a “Create account” button instead.
Update the test instruction and button locator to use “Create account,” then enter a valid test email and verify account creation.**

## ❌ claim-002: failed

> After registration, the page displays 'Welcome aboard'.

- Source: `README.md:8`
- Flow type: web
- Kane flow: `../../../../tmp/live/flows/claim-002_test.md`
- Observation: The registration flow is returning the wrong completion message. It places the new account in review rather than showing the required welcome confirmation.
Update the registration completion flow so a successful registration displays “Welcome aboard,” then add a check that prevents the review-queue message from replacing it.
evidence: objective_contradiction: Registration only displays “Account queued for review”; page code never produces “Welcome aboard”.
- Kane session: https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BVQ7MSJF758GRJ80QA7CH/dashboard/share/US_YDROK1GW58FVXLN9ELY6D0ZR1MDUD38N3US3H9NNKO6W00MXTZRMT1OU0YYWU3M0?type=summary&agentView=true&fqdn=summary-page
- Suggested documentation: **Review this claim. Kane observed: The registration flow is returning the wrong completion message. It places the new account in review rather than showing the required welcome confirmation.
Update the registration completion flow so a successful registration displays “Welcome aboard,” then add a check that prevents the review-queue message from replacing it.
evidence: objective_contradiction: Registration only displays “Account queued for review”; page code never produces “Welcome aboard”.**

## ✅ claim-003: passed

> The email field rejects addresses without an @ symbol.

- Source: `README.md:9`
- Flow type: web
- Kane flow: `../../../../tmp/live/flows/claim-003_test.md`
- Observation: Verified the account creation form as requested.
Checked the Email field and confirmed that it rejects an address that does not include an @ symbol.
The validation check completed successfully.
- Kane session: https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BZ1Z4MV43B902EC1VGXE5/dashboard/share/US_OVR3CSTH7QHAXGWQH4VV1HR42EFXR2M3N9C9X4NVY6XNEYD3I8Z7YTQXKU2K4TEB?type=summary&agentView=true&fqdn=summary-page

## ❌ claim-004: failed

> Registration automatically signs the user in and opens /dashboard.

- Source: `README.md:10`
- Flow type: web
- Kane flow: `../../../../tmp/live/flows/claim-004_test.md`
- Observation: The run labeled the page as the dashboard before entering an email or submitting the Create account form. The available evidence shows the browser still at the site root on the registration screen.
Update the test flow to enter a new valid email, select Create account, wait for navigation to /dashboard, and only then verify that the user is signed in.
- Kane session: https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84C0A4K72N852QW9G5ZMDHY/dashboard/share/US_PBGA2ESQEMMBRVBDU5FIEKCKGE9CIOB4LODT9DEJE79JK87Y5R66S9GX7JVDDH1E?type=summary&agentView=true&fqdn=summary-page
- Suggested documentation: **Review this claim. Kane observed: The run labeled the page as the dashboard before entering an email or submitting the Create account form. The available evidence shows the browser still at the site root on the registration screen.
Update the test flow to enter a new valid email, select Create account, wait for navigation to /dashboard, and only then verify that the user is signed in.**

## ⚠️ claim-005: unverifiable

> Registration will always be fast and easy.

- Source: `README.md:11`
- Flow type: web
- Kane flow: not generated
- Observation: Subjective wording has no observable pass condition
- Verifiability note: Subjective wording has no observable pass condition

---
Generated by Docsworn. Captured fallback results are labelled and are not live execution.
