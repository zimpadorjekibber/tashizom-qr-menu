#!/bin/bash

################################################################################
# TashiZom Repository Consolidation Script
# Automates the Copy-Paste method for consolidating frontend and backend code
# Author: Zimpa Dorje
# Date: December 8, 2025
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo_error "Git is not installed. Please install Git first."
    echo_info "Visit: https://git-scm.com/downloads"
    exit 1
fi

echo_header "TashiZom Repository Consolidation"

echo_info "This script will consolidate your TashiZom frontend and backend repositories"
echo_info "into a single unified repository."
echo ""
echo_warning "Please ensure you have:"
echo "  1. Internet connection"
echo "  2. Git installed"
echo "  3. Access to both repositories"
echo ""
read -p "Do you want to proceed? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_warning "Consolidation cancelled."
    exit 0
fi

# Get working directory
WORKDIR="${1:-.}/TashiZomConsolidated"

echo_header "Step 1: Prepare Workspace"
echo_info "Working directory: $WORKDIR"

if [ -d "$WORKDIR" ]; then
    echo_warning "Directory already exists. Backing up to ${WORKDIR}_backup"
    mv "$WORKDIR" "${WORKDIR}_backup"
fi

mkdir -p "$WORKDIR"
cd "$WORKDIR"
echo_success "Workspace prepared"

# Step 2: Clone repositories
echo ""
echo_header "Step 2: Clone Both Repositories"
echo_info "Cloning frontend repository..."
git clone https://github.com/zimpadorjekibber/tashizom-qr-menu.git frontend
echo_success "Frontend cloned"

echo_info "Cloning backend repository..."
git clone https://github.com/zimpadorje/TashiZomQRMenu.git backend
echo_success "Backend cloned"

# Step 3: Initialize new consolidated repository
echo ""
echo_header "Step 3: Initialize Consolidated Repository"
echo_info "Creating new git repository..."
mkdir -p consolidated
cd consolidated
git init
echo_success "Git repository initialized"

# Step 4: Organize directory structure
echo ""
echo_header "Step 4: Organize Files"
echo_info "Creating directory structure..."
mkdir -p frontend backend docs
echo_success "Directories created"

echo_info "Copying frontend files..."
cp -r ../frontend/* ./frontend/ 2>/dev/null || true
cp -r ../frontend/.firebase ./frontend/ 2>/dev/null || true
cp ../frontend/.firebaserc ./frontend/ 2>/dev/null || true
echo_success "Frontend files copied"

echo_info "Copying backend files..."
cp -r ../backend/* ./backend/ 2>/dev/null || true
echo_success "Backend files copied"

echo_info "Copying documentation..."
cp ../backend/COMMIT-CONSOLIDATION-GUIDE.md ./docs/ 2>/dev/null || true
cp ../backend/IMPLEMENTATION-STEPS.md ./docs/ 2>/dev/null || true
echo_success "Documentation copied"

# Step 5: Create root README
echo ""
echo_header "Step 5: Create Root-Level Documentation"
echo_info "Creating main README.md..."

cat > README.md << 'EOF'
# TashiZom - Unified Repository

Consolidated frontend and backend code for the TashiZom QR-based restaurant menu system.

## Project Structure

```
TashiZom/
├── frontend/          # HTML/Firebase frontend application
│   ├── admin.html
│   ├── admin.script.js
│   ├── check_orders.html
│   ├── .firebase/
│   ├── .firebaserc
│   └── assets/
├── backend/           # Node.js/Express backend API
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── COMMIT-CONSOLIDATION-GUIDE.md
└── docs/              # Documentation
    ├── COMMIT-CONSOLIDATION-GUIDE.md
    └── IMPLEMENTATION-STEPS.md
```

## Frontend

HTML-based QR menu application with Firebase integration.

**Location:** `./frontend/`
**To run:** Open `admin.html` in a web browser or deploy to Firebase Hosting

## Backend

Node.js/Express backend API with 5 production-ready bug fixes.

**Location:** `./backend/`
**To run:**
```bash
cd backend
npm install
npm start
```

## Documentation

See `docs/` for detailed consolidation information.

## Repository Consolidation

This repository was consolidated from:
- **Frontend:** https://github.com/zimpadorjekibber/tashizom-qr-menu (5 commits)
- **Backend:** https://github.com/zimpadorje/TashiZomQRMenu (1 commit)

**Consolidated on:** December 8, 2025
EOF

echo_success "README.md created"

# Step 6: Create consolidated git history
echo ""
echo_header "Step 6: Create Consolidated Git History"
echo_info "Staging all files..."
git add .
echo_success "Files staged"

echo_info "Creating consolidation commit..."
git commit -m "feat: Consolidate TashiZom frontend and backend repositories

- Merged frontend code from zimpadorjekibber/tashizom-qr-menu (5 commits)
- Merged backend code from zimpadorje/TashiZomQRMenu (1 commit)  
- Organized files into frontend/ and backend/ directories
- Added unified documentation
- Preserved all Firebase and configuration files

This represents a complete consolidation of the TashiZom application
from two separate GitHub accounts into a single unified repository."

echo_success "Consolidation commit created"

# Summary
echo ""
echo_header "Consolidation Complete!"
echo_success "All files have been consolidated successfully"
echo ""
echo_info "Next steps:"
echo "  1. Review the consolidated repository:"
echo "     cd $WORKDIR/consolidated"
echo "     ls -la"
echo ""
echo "  2. Test both applications:"
echo "     - Frontend: Open frontend/admin.html in a browser"
echo "     - Backend: cd backend && npm install && npm start"
echo ""
echo "  3. Push to GitHub (optional):"
echo "     cd $WORKDIR/consolidated"
echo "     git remote add origin https://github.com/zimpadorjekibber/TashiZom.git"
echo "     git push -u origin main"
echo ""
echo "  4. Verify everything works"
echo ""
echo "  5. Delete original repositories (optional):"
echo "     - zimpadorje/TashiZomQRMenu"
echo "     - zimpadorje account"
echo ""
echo_info "Complete documentation available in: $WORKDIR/consolidated/docs/"
echo ""
