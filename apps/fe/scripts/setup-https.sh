#!/usr/bin/env bash
# Generates a locally-trusted HTTPS cert for `vp dev`, covering localhost plus this machine's LAN
# address — so `crypto.randomUUID()` and other secure-context-only APIs work when testing from a
# real phone on the same network, not just from the dev machine itself. See CLAUDE.md ("Running
# locally") for why this exists.
set -euo pipefail

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert not found. Install it first: brew install mkcert" >&2
  exit 1
fi

# Installs (or reuses) a local CA in the system/browser trust stores on this machine. Safe to
# re-run — idempotent.
mkcert -install

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.certs"
mkdir -p "$CERT_DIR"

# `.local` resolves via mDNS/Bonjour on most phones without any extra setup, and — unlike a raw
# LAN IP — doesn't change when DHCP hands out a new address. Included as a fallback anyway, since
# not every router/network resolves `.local` reliably.
HOSTNAME_LOCAL="$(scutil --get LocalHostName 2>/dev/null || hostname -s).local"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

SANS=(localhost 127.0.0.1 ::1 "$HOSTNAME_LOCAL")
if [ -n "$LAN_IP" ]; then
  SANS+=("$LAN_IP")
fi

mkcert -key-file "$CERT_DIR/dev-key.pem" -cert-file "$CERT_DIR/dev-cert.pem" "${SANS[@]}"

echo
echo "Certificate generated for: ${SANS[*]}"
echo "Run 'pnpm --filter fe dev', then on your phone (same network) open:"
echo "  https://$HOSTNAME_LOCAL:3000"
[ -n "$LAN_IP" ] && echo "  or:   https://$LAN_IP:3000"
echo
echo "First load on the phone: the mkcert CA that just made this cert isn't trusted there yet."
echo "Run 'mkcert -CAROOT' to find rootCA.pem, send it to the phone (AirDrop/email/etc.), install"
echo "it as a profile, then — on iOS specifically — enable it under Settings > General > About >"
echo "Certificate Trust Settings. Without that step the phone's browser will still show a warning."
