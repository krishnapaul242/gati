#!/bin/bash
# Automated package publishing script

set -e

echo "🚀 Gati Package Publisher"
echo ""

# Build all packages
echo "📦 Building packages..."
pnpm -r --filter './packages/*' run build

echo ""
echo "📤 Publishing packages..."

# Publish each package if version doesn't exist
pnpm -r --filter './packages/*' exec bash -c '
  PACKAGE_NAME=$(node -p "require(\"./package.json\").name")
  PACKAGE_VERSION=$(node -p "require(\"./package.json\").version")
  
  # Check if version exists on npm
  if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version 2>/dev/null; then
    echo "⏭️  $PACKAGE_NAME@$PACKAGE_VERSION already published"
  else
    echo "📦 Publishing $PACKAGE_NAME@$PACKAGE_VERSION"
    npm publish --access public
  fi
'

echo ""
echo "✅ Publishing complete!"
