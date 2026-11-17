# GitHub Actions integration

[`examples/github-actions/docsworn.yml`](../examples/github-actions/docsworn.yml) is a starting workflow for gating pull requests on documentation truth.

Before enabling it:

1. Replace `DOCSWORN_REF` with an exact reviewed commit SHA.
2. Replace `./scripts/start-test-app.sh` with the repository's real test-app startup command.
3. Set `APP_URL` to that application's reachable URL.
4. Add `LT_USERNAME` and `LT_ACCESS_KEY` as GitHub Actions secrets.
5. Choose a `--fail-under` threshold appropriate for the repository.

The workflow installs Kane CLI 0.10.5, authenticates without committing credentials, runs Docsworn against the pull-request checkout, and uploads the report and generated tests even when the gate fails.

Use a live Kane run for the merge gate. Captured results are useful for demos and disaster recovery, but they do not prove the pull request's current application behavior.
