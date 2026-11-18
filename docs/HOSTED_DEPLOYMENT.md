# Hosted Kane deployment

The production browser calls Vercel `POST /api/check`. The Vercel function forwards the bounded JSON request over TLS to the VPS worker. The worker accepts only the server-side shared token and starts one disposable Docker audit at a time.

## Runtime inventory

- Vercel function: `api/check.mjs`, maximum duration 300 seconds.
- Repository root: `/home/ubuntu/projects/Docsworn`; every installed systemd and trusted-mirror path must resolve here before restart.
- Worker service: `deploy/docsworn-worker.service`.
- Private origin proxy: `deploy/docsworn-worker.nginx` on `127.0.0.1:8788`.
- HTTPS edge: `deploy/docsworn-tunnel.service`, an outbound Cloudflare quick tunnel because the VPS provider blocks inbound 80/443. Its generated hostname is read from the service log and stored only as `DOCSWORN_WORKER_URL` in Vercel.
- Runner image: `Dockerfile.runner`, tagged `docsworn-runner:current` on the VPS.
- Audit network: `172.30.20.0/24`, with private, metadata, Tailscale and host-public destinations rejected in `DOCKER-USER`.
- Persistent state: `/var/lib/docsworn-worker/usage.json` only.
- Optional trusted mirror: `/etc/docsworn-worker-mirror.env` maps one exact GitHub URL to one host path mounted read-only in the audit container.
- Credentials: existing Kane profile mounted at runtime; shared worker token exists only in `/etc/docsworn-worker.env` and Vercel production environment.

## Safe deployment order

1. `npm run ci` and build `docsworn-runner:current`.
2. Run `deploy/ensure-docsworn-network.sh`; verify public egress works and private/host destinations fail.
3. Verify every absolute repository path exists, then install the two systemd units and the root-owned `0600` environment file. To support the owner-authorized private Docsworn repository, install `deploy/docsworn-worker-mirror.env.example` as `/etc/docsworn-worker-mirror.env`; do not add credentials to it.
4. Start the network and worker; verify the Unix-socket health route.
5. Install the loopback-only Nginx site, run `nginx -t`, reload, then start the outbound tunnel service.
6. Read the generated `https://*.trycloudflare.com/v1/check` URL from `journalctl -u docsworn-tunnel` and add it with `DOCSWORN_WORKER_TOKEN` to Vercel production without printing the token. A tunnel restart creates a new hostname, so refresh the Vercel URL before a demo if that service or the VPS has restarted.
7. Deploy Vercel, run one real hosted audit, and verify each executed claim has a LambdaTest session URL.

Never place Kane or worker credentials in the repository, Vercel client bundle, report JSON, logs or screenshots.

The trusted mirror is deliberately singular. Both variables must be set, the URL match is exact apart from case, and every other private repository remains rejected. Keep the mirror path on the deployed main revision before restarting the worker.

The tunnel unit intentionally `Wants` the worker and Nginx instead of `Requires` them. Restarting either origin service must leave the current quick-tunnel hostname alive. If the tunnel itself restarts, read the newly generated hostname, update `DOCSWORN_WORKER_URL`, and create a new Vercel production deployment before accepting audits.
