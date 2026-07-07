#!/bin/bash
# ==============================================================================
# AWS EC2 Free Tier Setup Script for QuantumEdge
# ==============================================================================
# Run this script on a fresh Ubuntu Server 22.04 LTS instance.
# Usage: 
#   chmod +x setup-ec2.sh
#   ./setup-ec2.sh
# ==============================================================================

set -e

echo "🚀 Starting QuantumEdge Deployment on AWS EC2..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker ubuntu
else
    echo "✅ Docker is already installed."
fi

# 3. Install Docker Compose
echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose is already installed."
fi

# 4. Prepare Environment
echo "⚙️ Preparing Environment..."
# Ensure the backend script is executable
chmod +x api-gateway/seed.js || true

# 5. Build and Start the application
echo "⚡ Starting QuantumEdge Stack..."
docker-compose up --build -d

echo "======================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "QuantumEdge is now running in the background."
echo "Wait a minute for the databases to initialize, then access the app:"
echo "👉 http://<YOUR_EC2_PUBLIC_IP>:5173"
echo "======================================================================"
echo "Note: If you run into permission issues, log out and log back in to"
echo "apply the 'ubuntu' user docker group permissions."
