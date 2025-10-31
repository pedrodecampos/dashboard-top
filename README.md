# Dashboard de Vendas

Aplicação full-stack para monitoramento de vendas recebidas via plataformas como AppMax e PerfectPay. O frontend em HTML/CSS/JS consome uma API Node.js/Express integrada a um banco PostgreSQL e suporta ingestão de pedidos via webhooks.

## Estrutura do projeto

```
dashboard-sales/
├── backend/
│   ├── index.js             # Servidor Express
│   ├── db.js                # Conexão com PostgreSQL
│   ├── models/
│   │   └── orderModel.js    # Consultas SQL
│   ├── routes/
│   │   ├── webhook.js       # Recebe pedidos das plataformas
│   │   ├── metrics.js       # Retorna métricas agregadas
│   │   └── orders.js        # Lista pedidos filtrados
│   ├── services/
│   │   └── webhookParser.js # Normaliza payloads heterogêneos
│   └── utils/
│       └── dateRanges.js    # Conversão de presets de datas
├── frontend/                # Interface estática
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/sql/init.sql     # Script para criar tabela `orders`
├── env.example              # Modelos de variáveis de ambiente
└── package.json             # Dependências e scripts Node.js
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL 13+
- (Opcional) pm2, Docker ou outro process manager para produção

## Configuração do banco de dados

1. Crie um banco para a aplicação e um usuário com permissões de leitura/escrita.
2. Execute o script SQL:

   ```bash
   psql "postgres://USER:PASSWORD@HOST:PORT/DB_NAME" -f backend/sql/init.sql
   ```

3. Atualize a variável `DATABASE_URL` com as credenciais válidas.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz baseado em `env.example`:

```
PORT=3000
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB_NAME
CORS_ORIGINS=https://seu-dominio.com
WEBHOOK_SHARED_SECRET=chave_secreta_compartilhada
```

- `PORT`: porta onde o Express ficará exposto.
- `DATABASE_URL`: string de conexão PostgreSQL.
- `CORS_ORIGINS`: lista separada por vírgula com domínios autorizados a consumir a API.
- `WEBHOOK_SHARED_SECRET`: se definido, o webhook deve enviar o mesmo valor no header `x-shared-secret`.

## Instalação e execução

```bash
npm install

# Ambiente de desenvolvimento com recarregamento automático
npm run dev

# Ambiente de produção
npm run start
```

Por padrão o Express expõe as rotas da API (`/webhook`, `/metrics`, `/orders`) e também serve o conteúdo estático do diretório `frontend/`.

### Health-check

```
GET /health -> { "status": "ok", "timestamp": "..." }
```

## Rotas principais

### POST `/webhook`

Recebe payloads de plataformas de pagamento e normaliza automaticamente os campos principais (`order_id`, `customer_name`, `value`, `platform`, `order_type`). Em caso de segredo configurado, inclua no header `x-shared-secret`.

Exemplo de payload mínimo:

```json
{
  "order_id": "APP-001234",
  "customer_name": "Maria Souza",
  "value": 497.9,
  "platform": "AppMax",
  "status": "paid",
  "order_type": "Kit Premium",
  "created_at": "2024-07-01T14:22:00Z"
}
```

### GET `/metrics?range=last7d`

Retorna os agregados gerais e por segmento (kit, amostra, callcenter). O parâmetro `range` aceita os mesmos presets utilizados no frontend: `all`, `today`, `yesterday`, `last7d`, `currentMonth`, `lastMonth`.

### GET `/orders?platform=AppMax&range=currentMonth`

Lista pedidos ordenados por data, respeitando filtros opcionais de plataforma, range e limite (`limit`, padrão 200).

## Implantação em produção

1. Configure as variáveis de ambiente e instale as dependências.
2. Execute o script SQL em seu banco PostgreSQL.
3. Suba o servidor com um process manager (ex.: `pm2 start backend/index.js --name dashboard-sales`).
4. Configure o reverse proxy (Nginx/Traefik) apontando para a porta do Express.
5. Cadastre a URL pública do endpoint `/webhook` nas plataformas de pagamento e, se necessário, defina o mesmo segredo compartilhado.

## Testes rápidos

- `npm run dev` e acesse `http://localhost:3000` para visualizar o frontend consumindo dados mock.
- Envie um POST local para `http://localhost:3000/webhook` com um JSON similar ao exemplo para popular a base.
- Consulte `http://localhost:3000/metrics` e `http://localhost:3000/orders` para verificar os registros.

## Próximos passos sugeridos

- Implementar assinaturas específicas (HMAC) por plataforma quando disponíveis.
- Adicionar autenticação para proteger o painel em produção.
- Criar processos de expiração/arquivamento de pedidos antigos caso o volume cresça.
