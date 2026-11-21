# Dondza Aqui

Aplicativo web instalável (PWA) que prepara finalistas do ensino geral para os exames de admissão ao ensino superior em Moçambique. Idealizado por **Assane Filipe**.

Projeto estático: HTML, CSS e JavaScript puros, sem backend, sem build e sem dependências externas. Funciona sem internet depois da primeira abertura.

## Estrutura
```
index.html · manifest.webmanifest · service-worker.js
css/style.css
js/  app.js · storage.js · unlock.js · lessons.js · exams.js · settings.js
data/lessons.json                    aulas e exercícios do Básico
data/exams/index.json                lista de exames
data/exams/portugues-ii-2026.json    exame transcrito do PDF
icons/                               ícones 192, 512 e maskable
```
`desbloqueador.html` **não faz parte do repositório**: guarde-o só no seu computador.

## 1. Antes de publicar (obrigatório)
Abra `js/unlock.js` e troque no topo:
- `CHAVE_SECRETA`: uma frase longa e só sua. **A mesma** tem de ficar em `desbloqueador.html`.
- `WHATSAPP_SUPORTE`: o número de suporte (`+258...`).
- Preço: em `PLANOS.maza.preco`.

Atenção: como o app é estático, quem inspecionar o código consegue ver a chave. Este sistema serve para uso informal e dificulta partilhas, mas não é à prova de quem tenha conhecimentos técnicos.

## 2. Publicar no GitHub Pages
1. Crie um repositório no GitHub (por exemplo `dondza-aqui`).
2. Envie **todos os ficheiros desta pasta** (menos `desbloqueador.html`) para a raiz do repositório.
3. Vá a **Settings › Pages**. Em *Source*, escolha *Deploy from a branch*, ramo `main`, pasta `/ (root)` e grave.
4. Após 1 a 2 minutos o site fica em `https://UTILIZADOR.github.io/dondza-aqui/`.

Todos os caminhos são relativos, por isso funciona em subpastas.

## 3. Testar o PWA
1. Abra o link no Chrome do Android.
2. Navegue pela app; depois ligue o modo avião e recarregue: deve abrir normalmente.
3. Menu do Chrome › **Instalar aplicação** / **Adicionar ao ecrã principal**.
4. Para testar no computador: `python3 -m http.server 8000` na pasta e abra `http://localhost:8000`.

### Atualizar a app depois de publicada
Altere os ficheiros e aumente `VERSAO_CACHE` em `service-worker.js` (ex.: `dondza-v2`). Se criar ficheiros novos, acrescente-os a `FICHEIROS`.

## 4. Gerar o APK com o PWABuilder
1. Abra https://www.pwabuilder.com e cole o link do GitHub Pages.
2. Clique em **Start** e aguarde a análise do manifest e do service worker.
3. Clique em **Package for stores** › **Android**.
4. Preencha o nome do pacote (ex.: `mz.dondzaaqui.app`) e gere.
5. Descarregue o pacote e use o ficheiro `.apk` para instalar (permitindo fontes desconhecidas). O `.aab` serve para a Play Store.
6. Guarde a chave de assinatura (`signing.keystore`) e a sua palavra-passe: são precisas para futuras atualizações.

## 5. Como desbloquear o plano Maza (administrador)
1. O aluno envia o **ID do aparelho** (ex.: `DZ-7K3F-92QA`) por WhatsApp.
2. Confirme o pagamento.
3. Abra `desbloqueador.html` no seu computador ou telemóvel (funciona offline), cole o ID, escolha *Maza* e copie o código `XXXX-XXXX`.
4. Envie o código ao aluno. O código só serve para aquele ID e aquele plano.

Para **restaurar compra** (novo aparelho): o aluno envia o novo ID e recebe um novo código.

Código = primeiros 8 caracteres, em maiúsculas, de `SHA-256(ID + "|" + PLANO + "|" + CHAVE_SECRETA)`, formatado `XXXX-XXXX`.

## 6. Como acrescentar o gabarito oficial
Em `data/exams/portugues-ii-2026.json`:
1. Em cada questão, preencha `resposta_correta` com `"A"`, `"B"`, `"C"` ou `"D"` e, se possível, `explicacao`.
2. Quando **todas** estiverem confirmadas por um professor, mude `"gabarito_status"` de `"pendente"` para `"confirmado"`.
3. Aumente `VERSAO_CACHE` no service worker e publique.

Enquanto estiver `"pendente"`, o app mostra "Gabarito oficial pendente" e não marca certo/errado nem calcula nota. **Nunca invente respostas.**

Para acrescentar outro exame, copie o ficheiro JSON, ajuste os dados, registe-o em `data/exams/index.json` e em `FICHEIROS` do service worker.

## 7. Observações de revisão do exame (transcrição)
A transcrição manteve a grafia original (factores, afectar, Ominisciente, autodigética, Agualuza, Craverinha). Pontos a confirmar no PDF, também listados em `observacoes_revisao` no JSON:
- **Q21 e Q23** pedem para analisar um termo "sublinhado", mas o sublinhado não aparece no texto extraído.
- **Q42**: a alternativa D repete o parágrafo (4), como no original.
- **Q41**: aparece um "E." solto antes de "PRODUÇÃO ESCRITA".
- **Texto 1, fonte**: "2019–2024 (2029)", como no original.
- **Texto 2**: "primeira-dama" foi reconstituída da quebra de linha do PDF.
- **Q40** está na parte de Literatura mas foi associada ao Módulo 2.

## 8. Conteúdo
- Módulo 1 (Compreensão e Tipologia Textual): 4 tópicos, 24 exercícios.
- Módulo 2 (Funcionamento da Língua): 4 tópicos, 24 exercícios.
- Módulos 3 (Literatura) e 4 (Fonética, Ortografia e Redação): "Em breve" (estrutura pronta em `lessons.json`).
- Os exercícios são originais e independentes das questões do exame.

## 9. Pendências
1. **Gabarito oficial** do exame de 2026 (confirmado por um professor).
2. **Autorização da comissão de exames** para uso comercial do exame.
3. **WhatsApp de suporte** (`WHATSAPP_SUPORTE`) e instruções/número de pagamento.
4. **Chave secreta** (`CHAVE_SECRETA`), trocada nos dois sítios.
5. **Preço**: pagamento único ou mensal (hoje é único, 100 MT).
6. Confirmar os pontos da secção 7 e rever as aulas com um professor.
