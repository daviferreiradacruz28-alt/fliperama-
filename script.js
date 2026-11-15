// Catálogo em fileiras, com criador e favoritos
const campoBusca = document.getElementById("busca");
const areaCategorias = document.getElementById("categorias");
const catalogo = document.getElementById("catalogo");
const aviso = document.getElementById("vazio");

let jogos = [];
let notas = {};
let jogadas = {};
let autores = {};
let favoritos = new Set();
let categoriaAtual = "Todas";

const lancado = (j) => !j.lancamento_em || new Date(j.lancamento_em) <= new Date();
const dataBR = (d) => new Date(d).toLocaleDateString("pt-BR");

function urlCapa(caminho) {
  if (!caminho) return null;
  return db.storage.from("covers").getPublicUrl(caminho).data.publicUrl;
}

function criarEstrelas(info) {
  const div = document.createElement("div");
  div.className = "nota-card";
  if (!info) {
    div.textContent = "Sem avaliações";
    div.classList.add("sem-nota");
    return div;
  }
  const media = info.soma / info.qtd;
  const cheias = Math.round(media);
  const estrelas = document.createElement("span");
  for (let i = 1; i <= 5; i++) {
    const e = document.createElement("span");
    e.className = "estrela-mini" + (i <= cheias ? " ativa" : "");
    e.textContent = "★";
    estrelas.appendChild(e);
  }
  const texto = document.createElement("span");
  texto.textContent = media.toFixed(1).replace(".", ",") + " (" + info.qtd + ")";
  div.append(estrelas, texto);
  return div;
}

function atualizarCoracao(b) {
  const on = favoritos.has(Number(b.dataset.fav));
  b.textContent = on ? "♥" : "♡";
  b.classList.toggle("ativo", on);
  b.setAttribute("aria-label", on ? "Remover dos favoritos" : "Favoritar");
}

async function alternarFavorito(j) {
  const { data: s } = await db.auth.getSession();
  const uid = s.session && s.session.user.id;
  if (!uid) return;
  const ativo = favoritos.has(j.id);
  let erro;
  if (ativo) {
    const r = await db.from("favoritos").delete().eq("jogo_id", j.id).eq("usuario", uid);
    erro = r.error;
  } else {
    const r = await db.from("favoritos").upsert(
      { jogo_id: j.id, usuario: uid },
      { onConflict: "jogo_id,usuario", ignoreDuplicates: true }
    );
    erro = r.error;
  }
  if (erro) { alert("Não foi possível atualizar os favoritos."); return; }
  if (ativo) favoritos.delete(j.id); else favoritos.add(j.id);
  document.querySelectorAll('[data-fav="' + j.id + '"]').forEach(atualizarCoracao);
}

function criarCartao(j, breve) {
  const cartao = document.createElement("a");
  cartao.className = "cartao";
  cartao.href = "game.html?id=" + j.id;

  const capa = document.createElement("div");
  capa.className = "capa";
  const url = urlCapa(j.capa);
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.className = "capa-img";
    capa.appendChild(img);
  } else {
    capa.textContent = "🎮";
  }
  if (breve) {
    const selo = document.createElement("span");
    selo.className = "selo";
    selo.textContent = "Em breve · " + dataBR(j.lancamento_em);
    capa.appendChild(selo);
  }

  const cor = document.createElement("button");
  cor.type = "button";
  cor.className = "coracao";
  cor.dataset.fav = j.id;
  atualizarCoracao(cor);
  cor.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    alternarFavorito(j);
  });
  capa.appendChild(cor);

  const info = document.createElement("div");
  info.className = "info";
  const titulo = document.createElement("h2");
  titulo.textContent = j.nome;
  const cat = document.createElement("div");
  cat.className = "cat";
  cat.textContent = j.categoria || "";

  const autor = document.createElement("span");
  autor.className = "autor-link";
  autor.setAttribute("role", "link");
  autor.tabIndex = 0;
  autor.textContent = "por " + (autores[j.autor] || "Anônimo");
  const irAutor = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (j.autor) location.href = "perfil.html?id=" + j.autor;
  };
  autor.addEventListener("click", irAutor);
  autor.addEventListener("keydown", (e) => { if (e.key === "Enter") irAutor(e); });

  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = j.descricao || "";
  info.append(titulo, cat, autor, desc);

  if (!breve) {
    const dt = document.createElement("div");
    dt.className = "cat";
    dt.textContent = j.atualizado_em
      ? "Atualizado em " + dataBR(j.atualizado_em)
      : "Lançado em " + dataBR(j.criado_em);
    const jg = document.createElement("div");
    jg.className = "cat";
    const n = jogadas[j.id] || 0;
    jg.textContent = "👥 " + n + (n === 1 ? " pessoa jogou" : " pessoas jogaram");
    info.append(criarEstrelas(notas[j.id]), dt, jg);
  }

  cartao.append(capa, info);
  return cartao;
}

function criarFileira(titulo, lista, breve) {
  const sec = document.createElement("section");
  sec.className = "fileira";
  const h = document.createElement("h2");
  h.className = "fileira-titulo";
  h.textContent = titulo;
  const trilho = document.createElement("div");
  trilho.className = "fileira-lista";
  lista.forEach((j) => trilho.appendChild(criarCartao(j, breve)));
  sec.append(h, trilho);
  return sec;
}

function criarCategorias() {
  const temBreve = jogos.some((j) => !lancado(j));
  const cats = [...new Set(jogos.filter(lancado).map((j) => j.categoria || "Outros"))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const nomes = ["Todas", ...(temBreve ? ["Em breve"] : []), ...cats];

  areaCategorias.innerHTML = "";
  nomes.forEach((nome) => {
    const botao = document.createElement("button");
    botao.className = "chip" + (nome === categoriaAtual ? " ativo" : "");
    botao.textContent = nome;
    botao.addEventListener("click", () => {
      categoriaAtual = nome;
      criarCategorias();
      mostrarJogos();
    });
    areaCategorias.appendChild(botao);
  });
}

function mostrarJogos() {
  const texto = campoBusca.value.trim().toLowerCase();
  const filtrados = jogos.filter((j) => j.nome.toLowerCase().includes(texto));
  catalogo.innerHTML = "";
  let total = 0;

  const meus = filtrados.filter((j) => favoritos.has(j.id) && lancado(j));
  if (categoriaAtual === "Todas" && meus.length) {
    catalogo.appendChild(criarFileira("Meus favoritos", meus, false));
    total++;
  }

  const novos = filtrados.filter(lancado);
  if (categoriaAtual === "Todas" && novos.length) {
    catalogo.appendChild(criarFileira("Novidades", novos, false));
    total++;
  }

  const breves = filtrados
    .filter((j) => !lancado(j))
    .sort((a, b) => new Date(a.lancamento_em) - new Date(b.lancamento_em));
  if (breves.length && (categoriaAtual === "Todas" || categoriaAtual === "Em breve")) {
    catalogo.appendChild(criarFileira("Em breve", breves, true));
    total++;
  }

  if (categoriaAtual !== "Em breve") {
    const grupos = {};
    filtrados.filter(lancado).forEach((j) => {
      const c = j.categoria || "Outros";
      (grupos[c] = grupos[c] || []).push(j);
    });
    Object.keys(grupos)
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((c) => {
        if (categoriaAtual === "Todas" || categoriaAtual === c) {
          catalogo.appendChild(criarFileira(c, grupos[c], false));
          total++;
        }
      });
  }

  aviso.textContent = "Nenhum jogo encontrado.";
  aviso.hidden = total > 0;
}

async function carregar() {
  try { await garantirLogin(); } catch (e) { console.error(e); }

  const { data, error } = await db
    .from("games")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    aviso.textContent = "Não foi possível carregar os jogos.";
    aviso.hidden = false;
    console.error(error);
    return;
  }
  jogos = data;

  const { data: av } = await db.from("avaliacoes").select("jogo_id, nota");
  notas = {};
  (av || []).forEach((a) => {
    const n = notas[a.jogo_id] || { soma: 0, qtd: 0 };
    n.soma += a.nota;
    n.qtd += 1;
    notas[a.jogo_id] = n;
  });

  const { data: cont } = await db.from("contagem_jogadas").select("jogo_id, total");
  jogadas = {};
  (cont || []).forEach((c) => { jogadas[c.jogo_id] = c.total; });

  const { data: pf } = await db.from("perfis").select("id, nome");
  autores = {};
  (pf || []).forEach((p) => { autores[p.id] = p.nome; });

  const { data: fv } = await db.from("favoritos").select("jogo_id");
  favoritos = new Set((fv || []).map((f) => f.jogo_id));

  criarCategorias();
  mostrarJogos();
}

campoBusca.addEventListener("input", mostrarJogos);
carregar();
