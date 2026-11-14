// Catálogo ligado ao Supabase
const campoBusca = document.getElementById("busca");
const areaCategorias = document.getElementById("categorias");
const catalogo = document.getElementById("catalogo");
const aviso = document.getElementById("vazio");

let jogos = [];
let notas = {};
let categoriaAtual = "Todas";

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

function criarCategorias() {
  const nomes = ["Todas", ...new Set(jogos.map((j) => j.categoria).filter(Boolean))];
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
  const filtrados = jogos.filter((j) => {
    const nomeOk = j.nome.toLowerCase().includes(texto);
    const catOk = categoriaAtual === "Todas" || j.categoria === categoriaAtual;
    return nomeOk && catOk;
  });

  catalogo.innerHTML = "";
  aviso.textContent = "Nenhum jogo encontrado.";
  aviso.hidden = filtrados.length > 0;

  filtrados.forEach((j) => {
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

    const info = document.createElement("div");
    info.className = "info";
    const titulo = document.createElement("h2");
    titulo.textContent = j.nome;
    const cat = document.createElement("div");
    cat.className = "cat";
    cat.textContent = j.categoria || "";
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = j.descricao || "";

    const dt = document.createElement("div"); dt.className = "cat"; dt.textContent = j.atualizado_em ? "Atualizado em " + new Date(j.atualizado_em).toLocaleDateString("pt-BR") : "Lançado em " + new Date(j.criado_em).toLocaleDateString("pt-BR"); info.append(titulo, cat, desc, criarEstrelas(notas[j.id]), dt);
    cartao.append(capa, info);
    catalogo.appendChild(cartao);
  });
}

async function carregar() {
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

  // Busca todas as notas e calcula a média de cada jogo
  const { data: av } = await db.from("avaliacoes").select("jogo_id, nota");
  notas = {};
  (av || []).forEach((a) => {
    const n = notas[a.jogo_id] || { soma: 0, qtd: 0 };
    n.soma += a.nota;
    n.qtd += 1;
    notas[a.jogo_id] = n;
  });

  criarCategorias();
  mostrarJogos();
}

campoBusca.addEventListener("input", mostrarJogos);
carregar();
