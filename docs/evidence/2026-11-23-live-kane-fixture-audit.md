# Live Kane evidence — 2026-11-23

- Date: 2026-11-23 (run completed 14:13 UTC)
- Code state: commit `e69dcfa` ("fix: improve claim extraction precision on real-world READMEs"), built from that commit with `npm run build`.
- Kane CLI: 0.10.5, profile `default` / environment `prod`, authenticated user `maziceo4`, project `Docsworn` (`01M7MFHVXGYHHK9D40V2MMSZWC`).
- Target: the demo fixture app served locally at `http://127.0.0.1:4173` (`demo/fixture-app/server.mjs`).
- Command: `node dist/cli.js audit --repo demo/fixture-app --url http://127.0.0.1:4173 --ai off` (live mode; no `--results`, no `--skip-run`).
- Result: exit 0; report evidence mode labelled `live-kane`; 5 claims: 3 failed, 1 passed, 1 unverifiable; truth score 25% (1 of 4 executed claims verified).

The three failures are the fixture's intentionally stale claims. Kane caught them live, in a real browser, and the report produced suggested replacement wording for each: the closed loop, executed live at this commit. The full verbatim report is `2026-11-23-live-kane-fixture-report.md` in this directory.

| Claim | Source line | Verdict | Kane session |
|---|---|---|---|
| claim-001 — Open /register and click 'Submit' to create a new account. | README.md:7 | failed | https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BTA5W963JRX5MASB6W3KB/dashboard/share/US_PI1EL450XRLNIS9EYEJ0SJN16GVDD0C4L0V9ZIV5UTDMNZNCU6VBWJ62HDLPDFID?type=summary&agentView=true&fqdn=summary-page |
| claim-002 — After registration, the page displays 'Welcome aboard'. | README.md:8 | failed | https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BVQ7MSJF758GRJ80QA7CH/dashboard/share/US_YDROK1GW58FVXLN9ELY6D0ZR1MDUD38N3US3H9NNKO6W00MXTZRMT1OU0YYWU3M0?type=summary&agentView=true&fqdn=summary-page |
| claim-003 — The email field rejects addresses without an @ symbol. | README.md:9 | passed | https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84BZ1Z4MV43B902EC1VGXE5/dashboard/share/US_OVR3CSTH7QHAXGWQH4VV1HR42EFXR2M3N9C9X4NVY6XNEYD3I8Z7YTQXKU2K4TEB?type=summary&agentView=true&fqdn=summary-page |
| claim-004 — Registration automatically signs the user in and opens /dashboard. | README.md:10 | failed | https://test-manager.lambdatest.com/projects/01M7MFHVXGYHHK9D40V2MMSZWC/test-cases/01M84C0A4K72N852QW9G5ZMDHY/dashboard/share/US_PBGA2ESQEMMBRVBDU5FIEKCKGE9CIOB4LODT9DEJE79JK87Y5R66S9GX7JVDDH1E?type=summary&agentView=true&fqdn=summary-page |
| claim-005 — Registration will always be fast and easy. | README.md:11 | unverifiable | not generated (unverifiable) |
