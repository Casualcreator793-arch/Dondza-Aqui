/* Dondza Aqui — armazenamento local (localStorage).
   Tudo fica guardado no aparelho, numa só chave. */
window.DZ = window.DZ || {};
DZ.VERSAO = "1.0.0";
DZ.CHAVE_LS = "dondza:v1";

// Valores iniciais
DZ.padrao = () => ({
  perfil: { nome: "", disciplina: "portugues", nivel: "", plano: "basico", onboarding: false },
  definicoes: { tema: "auto", fonte: 1, metaDiaria: 10, lembrete: false, lembreteHora: "18:00", sons: true },
  aparelhoId: null,
  desbloqueios: {},                 // { maza: "XXXX-XXXX" }
  progresso: { topicos: {}, diario: {}, historico: [] },  // topicos: {id:{melhor,total,tentativas}}
  exames: {},                       // estado de cada exame
  recomendados: []                  // topicos a destacar na aba Aulas
});

function fundir(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && base[k] && typeof base[k] === "object") fundir(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}

DZ.carregar = () => {
  try { const bruto = localStorage.getItem(DZ.CHAVE_LS); return fundir(DZ.padrao(), bruto ? JSON.parse(bruto) : {}); }
  catch (e) { return DZ.padrao(); }
};
DZ.S = DZ.carregar();
DZ.guardar = () => { try { localStorage.setItem(DZ.CHAVE_LS, JSON.stringify(DZ.S)); } catch (e) { console.warn("Não foi possível guardar", e); } };

DZ.hoje = () => new Date().toISOString().slice(0, 10);
DZ.contarHoje = (n = 1) => { DZ.S.progresso.diario[DZ.hoje()] = (DZ.S.progresso.diario[DZ.hoje()] || 0) + n; };

// Backup
DZ.exportar = () => {
  const blob = new Blob([JSON.stringify({ app: "dondza", versao: DZ.VERSAO, dados: DZ.S }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "dondza-backup-" + DZ.hoje() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
};
DZ.importar = (texto) => {
  const o = JSON.parse(texto);
  if (!o || o.app !== "dondza" || !o.dados) throw new Error("Ficheiro inválido");
  const idAtual = DZ.S.aparelhoId;
  DZ.S = fundir(DZ.padrao(), o.dados);
  DZ.S.aparelhoId = idAtual || DZ.S.aparelhoId;   // o ID pertence ao aparelho, não ao backup
  DZ.guardar();
};
DZ.limparTudo = () => { const id = DZ.S.aparelhoId; DZ.S = DZ.padrao(); DZ.S.aparelhoId = id; DZ.guardar(); };
DZ.zerarProgresso = () => { DZ.S.progresso = DZ.padrao().progresso; DZ.S.exames = {}; DZ.S.recomendados = []; DZ.guardar(); };
