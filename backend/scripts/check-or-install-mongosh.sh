#!/usr/bin/env bash
set -euo pipefail

if command -v mongosh >/dev/null 2>&1; then
  echo "mongosh already installed: $(mongosh --version | head -n1)"
  exit 0
fi

OS="$(uname -s)"

case "$OS" in
  Darwin)
    if command -v brew >/dev/null 2>&1; then
      echo "Installing mongosh via Homebrew..."
      brew update
      brew install mongosh
    else
      echo "Homebrew not found. Install it: https://brew.sh then run: brew install mongosh" >&2
      exit 1
    fi
    ;;
  Linux)
    if command -v apt-get >/dev/null 2>&1; then
      echo "Installing mongosh via MongoDB APT repo..."
      # Detect distro codename (e.g., jammy, focal, bookworm)
      [[ -r /etc/os-release ]] && . /etc/os-release || true
      CODENAME="${VERSION_CODENAME:-$(lsb_release -sc 2>/dev/null || echo '')}"
      ID_LC="${ID:-ubuntu}"
      sudo apt-get update
      sudo apt-get install -y curl gnupg ca-certificates lsb-release
      curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
      echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/${ID_LC} ${CODENAME}/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list >/dev/null
      sudo apt-get update
      sudo apt-get install -y mongodb-mongosh
    elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
      echo "Use MongoDB YUM repo to install mongosh. See: https://www.mongodb.com/docs/mongodb-shell/install/#install-on-red-hat" >&2
      exit 1
    elif command -v pacman >/dev/null 2>&1; then
      echo "Install from AUR (e.g., mongosh-bin): yay -S mongosh-bin" >&2
      exit 1
    else
      echo "Unsupported Linux flavor. Install instructions: https://www.mongodb.com/docs/mongodb-shell/install/" >&2
      exit 1
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    if command -v choco >/dev/null 2>&1; then
      choco install -y mongosh
    elif command -v winget >/dev/null 2>&1; then
      winget install --id MongoDB.mongosh -e
    else
      echo "Use Chocolatey or Winget to install mongosh. Docs: https://www.mongodb.com/docs/mongodb-shell/install/" >&2
      exit 1
    fi
    ;;
  *)
    echo "Unknown OS '$OS'. See install docs: https://www.mongodb.com/docs/mongodb-shell/install/" >&2
    exit 1
    ;;
esac

echo "Installed mongosh: $(mongosh --version | head -n1)"
