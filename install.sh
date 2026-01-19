#!/bin/sh
set -e

# Apollo Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/i-luv-pho/apollov2/dev/install.sh | sh

REPO="i-luv-pho/apollov2"
INSTALL_DIR="/usr/local/bin"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Get latest release
echo "Finding latest Apollo release..."
LATEST=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)

if [ -z "$LATEST" ]; then
  echo "Could not find latest release"
  exit 1
fi

echo "Installing Apollo $LATEST..."

# Download URL
if [ "$OS" = "darwin" ]; then
  URL="https://github.com/$REPO/releases/download/$LATEST/apollo-darwin-$ARCH.tar.gz"
else
  URL="https://github.com/$REPO/releases/download/$LATEST/apollo-linux-$ARCH.tar.gz"
fi

# Create temp directory
TMP=$(mktemp -d)
cd "$TMP"

# Download and extract
echo "Downloading from $URL..."
curl -fsSL "$URL" -o apollo.tar.gz
tar -xzf apollo.tar.gz

# Install
echo "Installing to $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
  mv apollo "$INSTALL_DIR/apollo"
else
  sudo mv apollo "$INSTALL_DIR/apollo"
fi

# Cleanup
rm -rf "$TMP"

echo ""
echo "Apollo installed successfully!"
echo "Run 'apollo' to get started."
