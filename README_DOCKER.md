# Docker - Plant Disease Detection PWA

## 📦 Estrutura

- **Multi-stage build**: Otimiza tamanho da imagem final
- **Nginx Alpine**: Servidor web leve e eficiente
- **Segurança**: Usuário não-root, headers de segurança
- **Health checks**: Monitoramento automático

## 🚀 Build e Execução

### Opção 1: Docker Compose (Recomendado)

```bash
# Build e iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

Acesse: http://localhost:8080

### Opção 2: Docker Manual

```bash
# Build
docker build -t plant-disease-app .

# Executar
docker run -d \
  --name plant-disease-detector \
  -p 8080:80 \
  --restart unless-stopped \
  plant-disease-app

# Logs
docker logs -f plant-disease-detector

# Parar
docker stop plant-disease-detector
docker rm plant-disease-detector
```

## 🔧 Configuração Easypanel

1. **Criar novo app** no Easypanel
2. **Conectar repositório Git**
3. **Configurações**:
   - Port: `80`
   - Health Check: `/health`
   - Dockerfile: `Dockerfile` (raiz)
4. **Deploy**

## 📊 Endpoints

- `/` - Aplicação principal
- `/health` - Health check (retorna "healthy")

## 🔍 Verificar Saúde

```bash
# Local
curl http://localhost:8080/health

# Container
docker exec plant-disease-detector curl -f http://localhost/health
```

## 📝 Notas

- Porta interna: `80`
- Porta externa: `8080` (configurável)
- Usuário: `nginx-user` (não-root)
- Cache otimizado para PWA
- Compressão gzip habilitada

