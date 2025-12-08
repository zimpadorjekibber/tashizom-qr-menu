#!/bin/bash

################################################################################
# TashiZom Frontend Repository Cleanup Script
# Removes old frontend code files that are now in the consolidated repository
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

echo_header "TashiZom Frontend Repository Cleanup"

echo ""
echo_warning "This script will PERMANENTLY DELETE the following files:"
echo ""
echo "HTML Files:"
echo "  - admin.html"
echo "  - check_orders.html"
echo "  - debug_orders.html"
echo "  - index.html"
echo "  - login.html"
echo "  - staff.html"
echo ""
echo "JavaScript Files:"
echo "  - admin.script.js"
echo "  - login.script.js"
echo "  - script.js"
echo "  - server.js"
echo "  - palit-debug.log"
echo ""
echo "Firebase/Configuration Files:"
echo "  - .firebaserc"
echo "  - firebase-config.js"
echo "  - firebase.json"
echo ""
echo "Asset Folders:"
echo "  - assets/ folder (images, fonts, etc.)"
echo "  - .firebase/ folder"
echo ""
echo_warning "These files are now consolidated in the TashiZom unified repository"
echo ""
echo "KEEPING these files:"
echo "  - IMPLEMENTATION-STEPS.md"
echo "  - QUICK-START.md"
echo "  - consolidate-tashizom.sh"
echo "  - run-and-push.sh"
echo "  - cleanup-old-files.sh"
echo "  - CNAME"
echo "  - .gitignore"
echo ""
read -p "Are you sure you want to delete all old files? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_warning "Cleanup cancelled. No files were deleted."
    exit 0
fi

echo_header "Starting Cleanup"

# Remove HTML files
echo_info "Deleting HTML files..."
rm -f admin.html
rm -f check_orders.html
rm -f debug_orders.html
rm -f index.html
rm -f login.html
rm -f staff.html
echo_success "HTML files deleted"

# Remove JavaScript files
echo_info "Deleting JavaScript files..."
rm -f admin.script.js
rm -f login.script.js
rm -f script.js
rm -f server.js
rm -f palit-debug.log
echo_success "JavaScript files deleted"

# Remove Firebase/Config files
echo_info "Deleting Firebase and config files..."
rm -f .firebaserc
rm -f firebase-config.js
rm -f firebase.json
echo_success "Firebase and config files deleted"

# Remove asset folders
echo_info "Deleting asset folders..."
rm -rf assets/
rm -rf .firebase/
echo_success "Asset folders deleted"

# Summary
echo ""
echo_header "Cleanup Complete!"
echo ""
echo_success "All old frontend files have been deleted!"
echo ""
echo "Repository now contains only:"
echo "  - IMPLEMENTATION-STEPS.md (Setup guide)"
echo "  - QUICK-START.md (Quick start guide)"
echo "  - consolidate-tashizom.sh (Consolidation script)"
echo "  - run-and-push.sh (Consolidation + Push script)"
echo "  - cleanup-old-files.sh (This cleanup script)"
echo "  - CNAME (Custom domain)"
echo ""
echo_info "Next steps:"
echo "  1. Run run-and-push.sh to consolidate and push to GitHub"
echo "  2. Your consolidated code will be in TashiZom repository"
echo "  3. You can archive or delete this repository after consolidation"
echo ""
echo_success "Ready for consolidation! 🌟"
echo ""
