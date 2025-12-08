#!/bin/bash

################################################################################
# TashiZom Repository Consolidation + Push Script
# Consolidates frontend and backend code, then pushes to GitHub
# Author: Zimpa Dorje
# Date: December 8, 2025
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed${NC}"
    exit 1
fi

echo_header "TashiZom: Consolidate + Push to GitHub"

read -p "Do you want to proceed? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Step 1: Run consolidation
echo_header "Step 1: Running Consolidation Script"
echo_info "Getting consolidate-tashizom.sh from GitHub..."

# Check if consolidate-tashizom.sh exists locally
if [ ! -f "consolidate-tashizom.sh" ]; then
    echo_warning "Downloaded script not found locally"
    echo_info "You need to download consolidate-tashizom.sh first"
    echo "Visit: https://github.com/zimpadorjekibber/tashizom-qr-menu"
    exit 1
fi

echo_success "Script found"
echo_info "Running consolidation..."

bash ./consolidate-tashizom.sh

echo ""
echo_success "Consolidation complete!"

# Step 2: Navigate to consolidated repo
echo ""
echo_header "Step 2: Preparing to Push"

if [ ! -d "TashiZomConsolidated/consolidated" ]; then
    echo -e "${RED}✗ Consolidated directory not found${NC}"
    exit 1
fi

cd TashiZomConsolidated/consolidated

echo_success "In consolidated repository directory"

# Step 3: Configure git if needed
echo ""
echo_header "Step 3: Git Configuration"

echo_info "Configuring git user..."
git config user.name "Zimpa Dorje" || true
git config user.email "zimpad2@gmail.com" || true
echo_success "Git configured"

# Step 4: Show options
echo ""
echo_header "Step 4: Push to GitHub"
echo ""
echo "Choose an option:"
echo "  1) Push to new 'TashiZom' repository (creates unified repo)"
echo "  2) Push to existing 'tashizom-qr-menu' (overwrites frontend)"
echo "  3) Skip push (keep locally only)"
echo ""
read -p "Select option (1/2/3): " push_choice
echo ""

case $push_choice in
    1)
        echo_info "Pushing to new TashiZom repository..."
        echo_info "GitHub will create the repository if it doesn't exist"
        echo ""
        echo "Running command:"
        echo "  git remote add origin https://github.com/zimpadorjekibber/TashiZom.git"
        echo "  git branch -M main"
        echo "  git push -u origin main"
        echo ""
        
        git remote add origin https://github.com/zimpadorjekibber/TashiZom.git || git remote set-url origin https://github.com/zimpadorjekibber/TashiZom.git
        git branch -M main 2>/dev/null || true
        git push -u origin main
        
        echo ""
        echo_success "Successfully pushed to TashiZom repository!"
        echo_info "New repository: https://github.com/zimpadorjekibber/TashiZom"
        ;;
    2)
        echo_warning "This will overwrite the existing tashizom-qr-menu repository history"
        read -p "Are you sure? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo_warning "Push cancelled"
            exit 0
        fi
        
        echo_info "Force pushing to tashizom-qr-menu repository..."
        git remote add origin https://github.com/zimpadorjekibber/tashizom-qr-menu.git || git remote set-url origin https://github.com/zimpadorjekibber/tashizom-qr-menu.git
        git branch -M main 2>/dev/null || true
        git push -u origin main --force
        
        echo ""
        echo_success "Successfully pushed to tashizom-qr-menu repository!"
        ;;
    3)
        echo_warning "Push skipped"
        echo_info "Your consolidated code is ready locally at:"
        echo_info "$(pwd)"
        echo_info "You can push it later manually"
        ;;
    *)
        echo_error "Invalid option"
        exit 1
        ;;
esac

# Step 5: Summary
echo ""
echo_header "Push Complete!"
echo ""
echo_success "Your TashiZom code is now consolidated and pushed!"
echo ""
echo "What to do next:"
echo "  1. Test your consolidated repository"
echo "  2. Delete old repositories (optional):"
echo "     - https://github.com/zimpadorje/TashiZomQRMenu"
echo "  3. Delete zimpadorje account (optional):"
echo "     - Go to account settings and delete"
echo ""
echo "Your consolidated code is at:"
echo "  Frontend: ./frontend/"
echo "  Backend:  ./backend/"
echo "  Docs:     ./docs/"
echo ""
echo_info "Complete! Happy coding! 🎉"
echo ""
