#!/bin/bash

# Smart Assistant PWA - Deployment Helper Script
# This script helps prepare and deploy your app to GitLab Pages

echo "🚀 Smart Assistant PWA - Deployment Helper"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .gitlab-ci.yml exists
if [ ! -f ".gitlab-ci.yml" ]; then
    echo "❌ Error: .gitlab-ci.yml not found. Please ensure the CI/CD file is in the project root."
    exit 1
fi

echo "✅ Project structure verified"

# Check Node.js and npm
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"
echo "   Node.js version: $(node --version)"
echo "   npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Test build locally
echo "🔨 Testing local build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed. Please fix build errors before deploying."
    exit 1
fi
echo "✅ Local build successful"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Warning: Git repository not initialized"
    echo "   Run: git init && git remote add origin <your-gitlab-repo-url>"
    echo "   Then run this script again"
    exit 1
fi

# Check if GitLab remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  Warning: No GitLab remote found"
    echo "   Run: git remote add origin <your-gitlab-repo-url>"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Git repository configured"

# Check configuration files
echo "🔧 Checking configuration files..."

config_files=("public/config/telegram.json" "public/config/gitlab.json" "public/config/voice.json")
missing_configs=()

for config_file in "${config_files[@]}"; do
    if [ ! -f "$config_file" ]; then
        missing_configs+=("$config_file")
    fi
done

if [ ${#missing_configs[@]} -gt 0 ]; then
    echo "⚠️  Warning: Missing configuration files:"
    for missing in "${missing_configs[@]}"; do
        echo "   - $missing"
    done
    echo ""
    echo "   Please create these files with your configuration before deployment."
    echo "   See DEPLOYMENT.md for configuration examples."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
else
    echo "✅ All configuration files found"
fi

# Check if there are uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Commit your changes before deployment for best results"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Get current branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

# Push to GitLab
echo "🚀 Pushing to GitLab..."
git add .
git commit -m "🚀 Deploy Smart Assistant PWA - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin "$current_branch"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to push to GitLab"
    exit 1
fi

echo "✅ Code pushed to GitLab successfully"

# Get GitLab project info
gitlab_remote=$(git remote get-url origin)
if [[ $gitlab_remote == *"gitlab.com"* ]]; then
    # Extract username and project name from GitLab URL
    if [[ $gitlab_remote =~ gitlab\.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
        username="${BASH_REMATCH[1]}"
        project_name="${BASH_REMATCH[2]}"
        project_name="${project_name%.git}"  # Remove .git extension if present
        
        expected_url="https://${username}.gitlab.io/${project_name}"
        
        echo ""
        echo "🎉 Deployment initiated!"
        echo "================================"
        echo "📋 Deployment Details:"
        echo "   • Repository: ${username}/${project_name}"
        echo "   • Branch: ${current_branch}"
        echo "   • Expected URL: ${expected_url}"
        echo ""
        echo "⏳ GitLab CI/CD Pipeline:"
        echo "   1. Go to: ${gitlab_remote}/-/pipelines"
        echo "   2. Wait for the pipeline to complete (usually 2-5 minutes)"
        echo "   3. Check GitLab Pages: ${gitlab_remote}/-/pages"
        echo ""
        echo "🌐 Your app will be available at:"
        echo "   ${expected_url}"
        echo ""
        echo "📱 After deployment:"
        echo "   • Visit the URL to access your app"
        echo "   • Configure Telegram and GitLab settings"
        echo "   • Install as PWA for best experience"
        echo ""
        echo "📚 Need help? Check DEPLOYMENT.md for detailed instructions"
    fi
else
    echo "✅ Code pushed to GitLab. Check your repository for pipeline status."
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Monitor the GitLab CI/CD pipeline"
echo "   2. Once deployed, visit your app URL"
echo "   3. Configure your settings (Telegram, GitLab, Voice)"
echo "   4. Test all features and enjoy your Smart Assistant!"
echo ""
echo "Happy cooking and task managing! 🍽️📱✨"