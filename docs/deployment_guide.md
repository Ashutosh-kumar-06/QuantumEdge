# 🚀 QuantumEdge — AWS EC2 Free Tier Deployment Guide

Complete step-by-step guide to deploy QuantumEdge on an AWS EC2 free tier instance with a free public DNS.

---

## 📋 Prerequisites

- AWS account (free tier eligible)
- Your GitHub repo: `https://github.com/Ashutosh-kumar-06/QuantumEdge.git`

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:

| Setting | Value |
|---|---|
| **Name** | `QuantumEdge` |
| **AMI** | Ubuntu Server 24.04 LTS (Free tier eligible) |
| **Instance type** | `t2.micro` (Free tier — 1 vCPU, 1 GB RAM) |
| **Key pair** | Create new → Download `.pem` file → Save it safely |
| **Storage** | Change to **30 GB** gp3 (free tier allows up to 30 GB) |

3. **Network settings** → Click **Edit** → Add these Security Group rules:

| Type | Port | Source | Purpose |
|---|---|---|---|
| SSH | 22 | My IP | Terminal access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | 5173 | 0.0.0.0/0 | Vite dev (temporary) |
| Custom TCP | 4000 | 0.0.0.0/0 | API Gateway |

4. Click **Launch Instance**

---

## Step 2: Connect to Your EC2

```bash
# On your local machine (Windows PowerShell)
# First, fix key file permissions
icacls "C:\path\to\your-key.pem" /inheritance:r /grant:r "%USERNAME%:(R)"

# SSH into the instance (replace with your EC2 Public IP)
ssh -i "C:\path\to\your-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

## Step 3: Install Docker & Docker Compose on EC2

Run these commands one by one after SSH-ing in:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose-v2

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Apply group change (or logout and login again)
newgrp docker

# Verify Docker is working
docker --version
docker compose version
```

---

## Step 4: Clone & Deploy QuantumEdge

```bash
# Clone the repository
git clone https://github.com/Ashutosh-kumar-06/QuantumEdge.git
cd QuantumEdge

# Update the API URL to point to your EC2 public IP
# Replace <YOUR-EC2-PUBLIC-IP> with the actual IP
sed -i "s|VITE_API_URL=http://localhost:4000|VITE_API_URL=http://<YOUR-EC2-PUBLIC-IP>:4000|g" docker-compose.yml

# Build and start all services (this will take 5-10 minutes on first run)
docker compose up -d --build

# Seed the database with course content
docker compose exec api-gateway node seed.js

# Check all containers are running
docker compose ps
```

> [!IMPORTANT]
> The `t2.micro` has only 1 GB RAM. If the build fails due to memory, create a temporary swap file:
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```
> Then re-run `docker compose up -d --build`.

---

## Step 5: Verify Deployment

After all containers are up, test in your browser:

| URL | What it shows |
|---|---|
| `http://<YOUR-EC2-PUBLIC-IP>:5173` | QuantumEdge Frontend |
| `http://<YOUR-EC2-PUBLIC-IP>:4000/api/curriculum` | API response (JSON) |

---

## Step 6: Get a Free Public DNS Name

Since you want a free domain, here are the best options:

### Option A: Duck DNS (Recommended — completely free, no signup hassle)

1. Go to [https://www.duckdns.org](https://www.duckdns.org)
2. Sign in with your GitHub account
3. Create a subdomain, e.g., `quantumedge` → you'll get `quantumedge.duckdns.org`
4. Set the IP to your EC2 Public IP
5. On your EC2, set up auto-update (in case IP changes):

```bash
# Create a cron job to update DuckDNS every 5 minutes
mkdir -p ~/duckdns
cat > ~/duckdns/duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=quantumedge&token=YOUR_DUCKDNS_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
chmod +x ~/duckdns/duck.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
```

> Replace `quantumedge` with your chosen subdomain and `YOUR_DUCKDNS_TOKEN` with the token from duckdns.org.

### Option B: No-IP (Free)

1. Go to [https://www.noip.com](https://www.noip.com)
2. Create free account → create a hostname like `quantumedge.ddns.net`
3. Point it to your EC2 IP

### Option C: AWS Elastic IP (free while attached)

```bash
# In AWS Console → EC2 → Elastic IPs → Allocate
# Then Associate it with your EC2 instance
# This gives you a static IP (free as long as it's attached to a running instance)
```

---

## Step 7: Set Up Nginx Reverse Proxy + Free SSL (HTTPS)

This makes your site accessible on port 80/443 with your DuckDNS domain:

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/quantumedge << 'EOF'
server {
    listen 80;
    server_name quantumedge.duckdns.org;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/quantumedge /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d quantumedge.duckdns.org --non-interactive --agree-tos --email your-email@gmail.com
```

> [!NOTE]
> Replace `quantumedge.duckdns.org` with your actual DuckDNS subdomain throughout.

After SSL is set up, update your docker-compose.yml to use the domain:

```bash
cd ~/QuantumEdge
sed -i "s|VITE_API_URL=http://<YOUR-EC2-PUBLIC-IP>:4000|VITE_API_URL=https://quantumedge.duckdns.org/api|g" docker-compose.yml
docker compose up -d --build frontend
```

---

## Step 8: Auto-Start on Reboot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create a systemd service for QuantumEdge
sudo tee /etc/systemd/system/quantumedge.service << 'EOF'
[Unit]
Description=QuantumEdge Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/QuantumEdge
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable quantumedge
sudo systemctl start quantumedge
```

---

## 🎯 Final Result

| What | URL |
|---|---|
| **Your site** | `https://quantumedge.duckdns.org` |
| **API** | `https://quantumedge.duckdns.org/api/curriculum` |
| **GitHub** | `https://github.com/Ashutosh-kumar-06/QuantumEdge` |

---

## 🔧 Useful Commands (SSH into EC2)

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f frontend
docker compose logs -f api-gateway

# Restart everything
docker compose down && docker compose up -d

# Pull latest code and redeploy
cd ~/QuantumEdge
git pull origin main
docker compose up -d --build

# Check disk space
df -h

# Check memory
free -h
```

---

## ⚠️ Free Tier Limits

| Resource | Free Tier Limit |
|---|---|
| EC2 | 750 hours/month of t2.micro (enough for 1 instance 24/7) |
| Storage | 30 GB EBS |
| Data transfer | 100 GB/month outbound |
| Duration | **12 months** from account creation |

> [!CAUTION]
> After 12 months, AWS will start charging. Set up **Billing Alerts** in AWS Console → Billing → Budgets to avoid surprises.
