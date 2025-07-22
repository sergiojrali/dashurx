# Guia de Deployment - DashURX

Este documento fornece instruções detalhadas para fazer o deploy do sistema DashURX em diferentes ambientes.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Deployment Local](#deployment-local)
3. [Deployment em Produção](#deployment-em-produção)
4. [Docker](#docker)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Banco de Dados](#banco-de-dados)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Sistema Operacional
- **Linux**: Ubuntu 20.04+ (recomendado)
- **Windows**: Windows 10+ com WSL2
- **macOS**: macOS 11+

### Software Necessário
- **Node.js**: 18.0.0 ou superior
- **Python**: 3.11 ou superior
- **Git**: Para controle de versão
- **Chrome/Chromium**: Para WhatsApp Web (headless)

### Recursos Mínimos
- **RAM**: 2GB (4GB recomendado)
- **CPU**: 2 cores
- **Armazenamento**: 10GB livres
- **Rede**: Conexão estável com internet

## 🏠 Deployment Local

### 1. Preparação do Ambiente

```bash
# Clone o repositório
git clone https://github.com/sergiojrali/dashurx.git
cd dashurx

# Verificar versões
node --version  # v18+
python3 --version  # 3.11+
```

### 2. Configuração do Backend

```bash
cd whatsapp-saas-backend

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
```

**Editar arquivo .env:**
```env
# Segurança
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production

# Banco de Dados
DATABASE_URL=sqlite:///instance/app.db

# Flask
FLASK_ENV=development
FLASK_DEBUG=True

# WhatsApp
WHATSAPP_BASE_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:5173
```

### 3. Configuração do Frontend

```bash
cd ../whatsapp-saas-frontend

# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env.local
```

**Editar arquivo .env.local:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=DashURX
```

### 4. Inicialização

**Terminal 1 - Backend:**
```bash
cd whatsapp-saas-backend
source venv/bin/activate
python src/main.py
```

**Terminal 2 - Frontend:**
```bash
cd whatsapp-saas-frontend
npm run dev
```

**Acesso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🌐 Deployment em Produção

### 1. Servidor de Produção

#### Configuração do Servidor (Ubuntu)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalações
node --version
python3 --version
```

#### Configuração do Usuário

```bash
# Criar usuário para a aplicação
sudo adduser dashurx
sudo usermod -aG sudo dashurx
su - dashurx

# Configurar diretório da aplicação
mkdir -p /home/dashurx/app
cd /home/dashurx/app
```

### 2. Deploy da Aplicação

```bash
# Clone do repositório
git clone https://github.com/sergiojrali/dashurx.git .

# Configuração do Backend
cd whatsapp-saas-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar variáveis de produção
cp .env.example .env
# Editar .env com configurações de produção
```

**Arquivo .env de produção:**
```env
# Segurança (GERAR CHAVES SEGURAS!)
SECRET_KEY=sua-chave-super-secreta-de-producao-aqui
JWT_SECRET_KEY=sua-chave-jwt-super-secreta-de-producao-aqui

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost/dashurx_prod
# ou para SQLite:
# DATABASE_URL=sqlite:///instance/app.db

# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# WhatsApp
WHATSAPP_BASE_PORT=8000

# CORS
CORS_ORIGINS=https://seu-dominio.com
```

```bash
# Build do Frontend
cd ../whatsapp-saas-frontend
npm install --legacy-peer-deps
npm run build

# Copiar build para diretório do backend
cp -r dist/* ../whatsapp-saas-backend/src/static/
```

### 3. Configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/dashurx
```

**Configuração do Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend (arquivos estáticos)
    location / {
        root /home/dashurx/app/whatsapp-saas-backend/src/static;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket para Socket.IO
    location /socket.io {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/dashurx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configuração do Systemd

```bash
sudo nano /etc/systemd/system/dashurx.service
```

**Arquivo de serviço:**
```ini
[Unit]
Description=DashURX WhatsApp SaaS
After=network.target

[Service]
Type=simple
User=dashurx
WorkingDirectory=/home/dashurx/app/whatsapp-saas-backend
Environment=PATH=/home/dashurx/app/whatsapp-saas-backend/venv/bin
ExecStart=/home/dashurx/app/whatsapp-saas-backend/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar e iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable dashurx
sudo systemctl start dashurx
sudo systemctl status dashurx
```

### 5. SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

## 🐳 Docker

### 1. Dockerfile Backend

```dockerfile
# whatsapp-saas-backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Instalar Chrome para WhatsApp Web
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p instance sessions

EXPOSE 5000

CMD ["python", "src/main.py"]
```

### 2. Dockerfile Frontend

```dockerfile
# whatsapp-saas-frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código e fazer build
COPY . .
RUN npm run build

# Servir com nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./whatsapp-saas-backend
    ports:
      - "5000:5000"
    environment:
      - SECRET_KEY=your-secret-key
      - JWT_SECRET_KEY=your-jwt-secret
      - DATABASE_URL=sqlite:///instance/app.db
      - FLASK_ENV=production
    volumes:
      - ./data:/app/instance
      - ./sessions:/app/sessions
    restart: unless-stopped

  frontend:
    build: ./whatsapp-saas-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### 4. Comandos Docker

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Atualizar
git pull
docker-compose up -d --build
```

## 🔐 Variáveis de Ambiente

### Backend (.env)
```env
# Segurança (OBRIGATÓRIO ALTERAR EM PRODUÇÃO)
SECRET_KEY=gere-uma-chave-super-secreta-aqui
JWT_SECRET_KEY=gere-uma-chave-jwt-super-secreta-aqui

# Banco de Dados
DATABASE_URL=sqlite:///instance/app.db
# Para PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/dashurx

# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# WhatsApp
WHATSAPP_BASE_PORT=8000

# CORS
CORS_ORIGINS=https://seu-dominio.com

# Logs
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```env
VITE_API_URL=https://seu-dominio.com/api
VITE_APP_NAME=DashURX
VITE_APP_VERSION=2.0.0
```

### Geração de Chaves Seguras

```python
# Gerar chaves seguras
import secrets

# Para SECRET_KEY e JWT_SECRET_KEY
print(secrets.token_urlsafe(32))
```

## 🗄️ Banco de Dados

### SQLite (Desenvolvimento)
```bash
# Backup
cp instance/app.db instance/app.db.backup

# Restaurar
cp instance/app.db.backup instance/app.db
```

### PostgreSQL (Produção)

#### Instalação
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Configuração
```bash
sudo -u postgres psql

CREATE DATABASE dashurx_prod;
CREATE USER dashurx_user WITH PASSWORD 'senha-super-secreta';
GRANT ALL PRIVILEGES ON DATABASE dashurx_prod TO dashurx_user;
\q
```

#### Migração
```bash
# Instalar psycopg2
pip install psycopg2-binary

# Atualizar DATABASE_URL
DATABASE_URL=postgresql://dashurx_user:senha-super-secreta@localhost/dashurx_prod
```

### Backup Automático
```bash
# Script de backup
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/dashurx/backups"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump dashurx_prod > $BACKUP_DIR/dashurx_$DATE.sql

# Backup arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/dashurx/app/instance /home/dashurx/app/sessions

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h
0 2 * * * /home/dashurx/backup.sh
```

## 📊 Monitoramento

### Logs da Aplicação
```bash
# Ver logs do serviço
sudo journalctl -u dashurx -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoramento de Recursos
```bash
# Instalar htop
sudo apt install htop

# Monitorar recursos
htop

# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h
```

### Health Check
```bash
# Script de health check
#!/bin/bash
# health_check.sh

API_URL="http://localhost:5000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ API está funcionando"
else
    echo "❌ API não está respondendo (HTTP $RESPONSE)"
    # Reiniciar serviço se necessário
    sudo systemctl restart dashurx
fi
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com WhatsApp
```bash
# Verificar se Chrome está instalado
google-chrome --version

# Verificar logs do WhatsApp module
tail -f logs/whatsapp.log
```

#### 2. Erro de Banco de Dados
```bash
# Verificar permissões
ls -la instance/

# Recriar banco
rm instance/app.db
python src/main.py  # Recriará automaticamente
```

#### 3. Erro de CORS
```bash
# Verificar configuração CORS no .env
echo $CORS_ORIGINS

# Verificar logs do navegador
# F12 -> Console
```

#### 4. Erro de Memória
```bash
# Verificar uso de memória
free -h

# Verificar processos
ps aux | grep python

# Reiniciar serviço
sudo systemctl restart dashurx
```

### Comandos Úteis

```bash
# Status dos serviços
sudo systemctl status dashurx
sudo systemctl status nginx

# Reiniciar serviços
sudo systemctl restart dashurx
sudo systemctl restart nginx

# Ver logs em tempo real
sudo journalctl -u dashurx -f

# Verificar portas em uso
sudo netstat -tlnp | grep :5000

# Testar conectividade
curl -I http://localhost:5000/api/health
```

### Contato para Suporte

- **Issues**: [GitHub Issues](https://github.com/sergiojrali/dashurx/issues)
- **Email**: suporte@dashurx.com
- **Documentação**: [Wiki do Projeto](https://github.com/sergiojrali/dashurx/wiki)

---

**Última atualização**: Janeiro 2025

