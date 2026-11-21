/* Dondza Aqui — ID do aparelho e desbloqueio por código.
   ============================================================
   ATENÇÃO (Assane): troque os valores abaixo ANTES de publicar.
   A MESMA CHAVE_SECRETA tem de estar no desbloqueador.html.
   Quem souber a chave consegue gerar códigos: não a partilhe.
   ============================================================ */
const CHAVE_SECRETA = "TROCAR-ESTA-CHAVE-SECRETA";   // <- troque por uma frase longa e só sua
const WHATSAPP_SUPORTE = "+258XXXXXXXXX";            // <- número de suporte (com +258)
const PLANOS = {                                      // planos pagos; para criar outro, acrescente aqui
  maza: { nome: "Maza", preco: "100 MT" }
};

window.DZ = window.DZ || {};
DZ.unlock = { validos: {} };   // planos já verificados nesta sessão

// SHA-256 em JavaScript puro (reserva, caso o Web Crypto não esteja disponível)
function sha256Puro(txt) {
  const b = new TextEncoder().encode(txt), rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const p = []; for (let c = 2; p.length < 64; c++) if (p.every(x => c % x)) p.push(c);
  let H = p.slice(0, 8).map(x => Math.floor((Math.sqrt(x) % 1) * 4294967296) | 0);
  const K = p.map(x => Math.floor((Math.cbrt(x) % 1) * 4294967296) | 0);
  const n = (((b.length + 8) >> 6) + 1) * 16, w0 = new Array(n).fill(0);
  b.forEach((v, i) => w0[i >> 2] |= v << (24 - (i % 4) * 8));
  w0[b.length >> 2] |= 0x80 << (24 - (b.length % 4) * 8); w0[n - 1] = b.length * 8;
  for (let j = 0; j < n; j += 16) {
    const w = w0.slice(j, j + 16);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H = H.map((x, i) => (x + [a, bb, c, d, e, f, g, h][i]) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
async function sha256Hex(txt) {
  try {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* usa a reserva */ }
  return sha256Puro(txt);
}

// ID do aparelho, ex.: DZ-7K3F-92QA (sem letras confusas como 0/O e 1/I)
DZ.unlock.obterId = () => {
  if (!DZ.S.aparelhoId) {
    const alf = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ", r = new Uint8Array(8);
    (window.crypto || { getRandomValues: a => a.map(() => Math.random() * 256) }).getRandomValues(r);
    const s = [...r].map(x => alf[x % alf.length]).join("");
    DZ.S.aparelhoId = "DZ-" + s.slice(0, 4) + "-" + s.slice(4);
    DZ.guardar();
  }
  return DZ.S.aparelhoId;
};

// Código = primeiros 8 caracteres de SHA-256(ID|PLANO|CHAVE), em maiúsculas, formato XXXX-XXXX
DZ.unlock.calcular = async (id, plano) => {
  const h = (await sha256Hex(id.trim().toUpperCase() + "|" + plano.toUpperCase() + "|" + CHAVE_SECRETA)).slice(0, 8).toUpperCase();
  return h.slice(0, 4) + "-" + h.slice(4);
};
const limpa = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

DZ.unlock.verificar = async (plano, codigo) => limpa(codigo) !== "" && limpa(codigo) === limpa(await DZ.unlock.calcular(DZ.unlock.obterId(), plano));
// Ao abrir a app, confirma de novo os códigos guardados (um backup de outro aparelho não desbloqueia nada)
DZ.unlock.verificarTodos = async () => {
  DZ.unlock.obterId();
  for (const p in PLANOS) DZ.unlock.validos[p] = await DZ.unlock.verificar(p, DZ.S.desbloqueios[p]);
};
DZ.unlock.estaDesbloqueado = plano => !!DZ.unlock.validos[plano];
DZ.unlock.desbloquear = async (plano, codigo) => {
  if (!(await DZ.unlock.verificar(plano, codigo))) return false;
  DZ.S.desbloqueios[plano] = limpa(codigo).slice(0, 4) + "-" + limpa(codigo).slice(4);
  DZ.unlock.validos[plano] = true; DZ.guardar(); return true;
};
DZ.unlock.linkWhatsApp = texto => "https://wa.me/" + WHATSAPP_SUPORTE.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(texto);

// Janela de desbloqueio. aoDesbloquear() é chamada se o código estiver certo.
DZ.unlock.abrir = (plano, aoDesbloquear) => {
  const P = PLANOS[plano], id = DZ.unlock.obterId();
  const msg = `Olá! Quero desbloquear o plano ${P.nome} do Dondza Aqui (${P.preco}). O meu ID do aparelho é: ${id}`;
  const m = DZ.modal(`
    <h2>Desbloquear ${DZ.esc(P.nome)}</h2>
    <p class="suave">Valor: <b>${DZ.esc(P.preco)}</b>. Inclui todo o Básico e os Exames Interativos.</p>
    <label>O seu ID do aparelho</label>
    <div class="id-aparelho" id="uid">${id}</div>
    <div class="linha"><button class="btn sec" id="ucopiar">Copiar</button>
    <a class="btn sec" id="uwa" target="_blank" rel="noopener" href="${DZ.unlock.linkWhatsApp(msg)}">Enviar por WhatsApp</a></div>
    <div class="cartao fundo-claro" style="margin-top:14px"><b>Como pagar</b>
      <ol style="padding-left:18px;margin:6px 0 0"><li>Envie o seu ID por WhatsApp ao suporte.</li>
      <li>Faça o pagamento de ${DZ.esc(P.preco)} conforme as instruções recebidas.</li>
      <li>Receba o código e escreva-o abaixo. Funciona sem internet.</li></ol></div>
    <label for="ucod">Código de desbloqueio</label>
    <input type="text" id="ucod" placeholder="XXXX-XXXX" autocomplete="off" autocapitalize="characters" maxlength="12">
    <div class="erro" id="uerro" hidden></div>
    <button class="btn" id="ubtn" style="margin-top:12px">Desbloquear</button>
    <button class="btn sec" id="urest">Restaurar compra</button>
    <button class="btn sec" id="ufechar">Fechar</button>`);
  const $ = s => m.el.querySelector(s);
  $("#ucopiar").onclick = () => DZ.copiar(id);
  $("#ufechar").onclick = m.fechar;
  $("#urest").onclick = () => { window.open(DZ.unlock.linkWhatsApp("Olá! Quero restaurar a minha compra do plano " + P.nome + " no Dondza Aqui. O meu novo ID é: " + id), "_blank"); };
  $("#ubtn").onclick = async () => {
    const ok = await DZ.unlock.desbloquear(plano, $("#ucod").value);
    if (ok) { m.fechar(); DZ.toast("Plano " + P.nome + " desbloqueado!"); DZ.som("certo"); aoDesbloquear && aoDesbloquear(); }
    else { const e = $("#uerro"); e.hidden = false; e.textContent = "Código incorreto. Confirme se escreveu o código recebido para este ID (" + id + ")."; DZ.som("errado"); }
  };
};
