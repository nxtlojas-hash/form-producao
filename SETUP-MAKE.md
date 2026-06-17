# NXT — Form Produção Diária → Make → Excel

Formulário web (fábrica) que envia as motos montadas para o Make, que as adiciona na aba **📥 Produção Diária** do arquivo `NXT - Estoque <Mês> 2026.xlsx`. A caixa baixa sozinha.

Mesmo modelo do **form-pj** (estático, tema NXT, PWA, POST pro webhook do Make).

---

## 1) Criar o webhook no Make (faça PRIMEIRO)

1. No Make.com → **Create a new scenario**.
2. Primeiro módulo: **Webhooks → Custom webhook** → **Add** → nome `producao-nxt` → **Save**.
3. Copie a **URL** que aparecer (algo como `https://hook.us2.make.com/xxxxxxxx`).
4. Cole essa URL no arquivo **`script.js`**, na linha:
   ```js
   const WEBHOOK_URL = 'COLE_AQUI_O_WEBHOOK_DO_MAKE';
   ```
5. Deixe o webhook "ouvindo" e mande um lote de teste pelo form (passo 4) para o Make aprender o formato dos dados.

### Formato que o form envia (para mapear no Make)
```json
{
  "origem": "form-producao",
  "data": "2026-06-17",
  "galpao": "Jaraguá - Fábrica",
  "responsavel": "Maria",
  "enviadoEm": "2026-06-17T20:00:00.000Z",
  "motos": [
    { "modelo":"Kay", "cor":"Branco", "chassi":"LXRBD0GW5T0900690",
      "motor":"JH2500461000S0065", "estado":"Em Estoque", "obs":"" }
  ]
}
```

## 2) Montar o cenário no Make

```
[Webhook]  →  [Iterator]  →  [MS365 Excel: Add a Row]
```

1. **Iterator** (Flow Control → Iterator): no campo *Array* selecione **`motos[]`** do webhook.
2. **Microsoft 365 Excel → Add a Row**:
   - **Connection:** conecte a conta **adm@nxt.eco.br** (onde está o OneDrive).
   - **Workbook:** `NXT - Estoque Junho 2026.xlsx` (pasta `Estoques`).
   - **Table:** **ProducaoDiaria**.
   - **Mapeie as colunas:**
     | Coluna da tabela | Valor do Make |
     |---|---|
     | Data | `{{1.data}}` (o `data` do webhook) |
     | Modelo | `{{2.modelo}}` (do Iterator) |
     | Cor | `{{2.cor}}` |
     | Chassi | `{{2.chassi}}` |
     | Motor | `{{2.motor}}` |
     | Estado | `{{2.estado}}` |
     | Local | `{{1.galpao}}` |
     | Obs | `{{2.obs}}` |
3. **Save** o cenário e ligue o **Scheduling = ON** (Immediately).

> Cada moto do lote vira uma linha na tabela. As colunas ✓chassi e 🔎já-existe (I/J) calculam sozinhas; a **caixa baixa automático** (a tabela de caixa já conta a Produção Diária).

## 3) Publicar o formulário (deploy)

Qualquer um serve (é site estático):
- **Vercel (recomendado, igual seus outros):** `npx vercel` na pasta `form-producao`, ou arraste a pasta em vercel.com/new. Pega uma URL tipo `form-producao.vercel.app`.
- **GitHub Pages:** suba a pasta num repo e ative Pages.
- **Teste local:** abra o `index.html` no navegador (o envio só funciona depois do WEBHOOK_URL preenchido).

No celular/tablet da fábrica: abra a URL → menu do navegador → **"Adicionar à tela inicial"** (vira app, funciona como o form-pj).

## 4) Usar (fábrica)

1. Escolhe **Data** e **Galpão** (uma vez).
2. Pra cada moto: **Modelo + Cor + Chassi + Motor** → **+ Adicionar à lista**. (Modelo/Cor ficam fixos pra lançar em série; o chassi confere 17 dígitos ao vivo.)
3. No fim: **Enviar lote**. As motos caem na Produção Diária do Excel.

## Mensal
Todo mês, no módulo **MS365 Excel** do Make, troque o **Workbook** para o arquivo do mês novo (`NXT - Estoque Julho 2026.xlsx`). A Table continua `ProducaoDiaria`.

## Consolidar no Registro
As motos ficam na 📥 Produção Diária (inbox). No fechamento, recorte-as para o fim do **Registro** (Origem = "Produção <data>") — a caixa não muda (já está baixada). Ou peça pro Claude consolidar.
