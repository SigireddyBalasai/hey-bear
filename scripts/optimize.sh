#!/bin/bash

# Hey Bear Project Optimization Script
set -e

echo "🐻 Starting Hey Bear Project Optimization..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Clean and install dependencies
print_status "Cleaning node_modules and reinstalling dependencies..."
rm -rf node_modules .next
pnpm install

# Step 2: Type checking
print_status "Running type checks..."
if pnpm run type-check; then
    print_success "Type checking passed!"
else
    print_warning "Type checking found issues, but continuing..."
fi

# Step 3: Linting
print_status "Running ESLint..."
if pnpm run lint; then
    print_success "Linting passed!"
else
    print_warning "Linting found issues. Attempting to fix..."
    pnpm run lint:fix
fi

# Step 4: Formatting
print_status "Formatting code..."
pnpm run format

# Step 5: Build optimization
print_status "Building project..."
if pnpm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Step 6: Performance analysis
print_status "Analyzing bundle size..."
if command -v bundlesize &> /dev/null; then
    bundlesize
else
    print_warning "bundlesize not installed. Install with: pnpm add -D bundlesize"
fi

print_success "🎉 Hey Bear optimization completed!"
echo ""
echo "Next steps:"
echo "1. Restart VS Code to ensure ESLint extension picks up changes"
echo "2. Open a TypeScript file to verify error highlighting"
echo "3. Run 'pnpm dev' to start development server"
