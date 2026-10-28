# Deployment Guide

## Local Development

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env (optional: warehouse falls back to FallbackAnalyzer)
docker compose up --build
```

## Production: one Linux VM (Oracle Always Free, ARM64) + Vercel

| Component                                           | Where                                  |
| --------------------------------------------------- | -------------------------------------- |
| Postgres, Redis, kitchen, warehouse, market, ai, gateway, bull-board | One VM, `docker compose` |
| HTTPS reverse proxy (only public entry, 80/443)     | Caddy container                        |
| Frontend                                            | Vercel                                 |

Only Caddy publishes ports. Postgres, Redis, the services and bull-board are reachable
only inside the Docker network (`docker-compose.prod.yml` empties their `ports`).

### 1. Create the VM

1. Oracle Cloud → Compute → Create instance → Image **Ubuntu 22.04/24.04 (aarch64)**,
   Shape **VM.Standard.A1.Flex** (e.g. 2 OCPU / 12 GB), assign a public IPv4, add your SSH key.
2. Open ports **80 and 443**: VCN → Subnet → Security List → Add Ingress Rules
   (Source `0.0.0.0/0`, TCP, destination ports `80` and `443`).
3. Open them in the OS firewall too (Oracle Ubuntu images ship restrictive iptables rules):

   ```bash
   sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
   sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save
   ```

### 2. Install Docker

```bash
ssh ubuntu@<VM_PUBLIC_IP>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version
```

### 3. Clone and configure

```bash
git clone <REPO_URL> microservices-restaurant && cd microservices-restaurant
cp .env.prod.example .env
nano .env
```

Set in `.env`:

- `POSTGRES_PASSWORD`: a strong random value.
- `API_DOMAIN`: your domain, or with no domain use sslip.io: the VM IP with dots turned
  into dashes, e.g. `203.0.113.10` → `203-0-113-10.sslip.io`. Caddy obtains a Let's Encrypt
  certificate automatically (needs ports 80/443 reachable).
- `OPENAI_API_KEY`: optional.

### 4. Start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl https://<API_DOMAIN>/health
```

The first build on ARM can take several minutes. To avoid retyping the `-f` flags:
`export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`.

SSE (`/api/orders/stream`) is proxied with `flush_interval -1` in `deploy/Caddyfile`
so events are not buffered.

### 5. Frontend on Vercel

1. Import the repo in Vercel, Root Directory `frontend/web`.
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<API_DOMAIN>`
3. Deploy. If you change the variable later, **redeploy** (it is inlined at build time).

The gateway answers CORS with `Access-Control-Allow-Origin: *`, so no extra config is needed.

### Logs

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100            # all
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy api-gateway     # some
```

### Update

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Data persists in the `postgres_data`, `redis_data` and `caddy_data` volumes.

### Notes

- bull-board (:3001) is not exposed publicly; to use it, temporarily add `ports: ['127.0.0.1:3001:3001']` and tunnel with `ssh -L 3001:localhost:3001 ubuntu@<VM_IP>`.
- Kitchen/warehouse/market run `prisma db push --accept-data-loss` on start (existing behavior).
