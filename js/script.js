const entregas = [
  { id: 301, cidade: "São Paulo", regiao: "Sudeste", transportadora: "RotaMax", prazo: 3, diasReais: 7 },
  { id: 302, cidade: "Curitiba", regiao: "Sul", transportadora: "ViaCargo", prazo: 5, diasReais: 5 },
  { id: 303, cidade: "Recife", regiao: "Nordeste", transportadora: "FlashLog", prazo: 4, diasReais: 9 },
  { id: 304, cidade: "Manaus", regiao: "Norte", transportadora: "RotaMax", prazo: 6, diasReais: 4 },
  { id: 305, cidade: "Goiânia", regiao: "Centro-Oeste", transportadora: "ViaCargo", prazo: 2, diasReais: 6 },
  { id: 306, cidade: "Porto Alegre", regiao: "Sul", transportadora: "FlashLog", prazo: 5, diasReais: 12 },
  { id: 307, cidade: "Florianópolis", regiao: "Sul", transportadora: "RotaMax", prazo: 6, diasReais: 9 },
  { id: 308, cidade: "Rio de Janeiro", regiao: "Sudeste", transportadora: "ViaCargo", prazo: 3, diasReais: 4 },
  { id: 309, cidade: "Belém", regiao: "Norte", transportadora: "FlashLog", prazo: 5, diasReais: 5 },
  { id: 310, cidade: "Salvador", regiao: "Nordeste", transportadora: "ViaCargo", prazo: 4, diasReais: 8 }
];

let chartTransportadora;
let chartStatus;
let chartRegiao;

Chart.defaults.color = "#ddd6fe";
Chart.defaults.font.family = "Arial";

function atraso(entrega) {
  return Math.max(0, entrega.diasReais - entrega.prazo);
}

function textoDias(valor) {
  return valor === 1 ? "1 dia" : `${valor} dias`;
}

function statusEntrega(entrega) {
  const dias = atraso(entrega);

  if (dias === 0) return "No prazo";
  if (dias <= 2) return "Atenção";
  return "Crítico";
}

function classeStatus(status) {
  if (status === "No prazo") return "ok";
  if (status === "Atenção") return "alerta";
  return "critico";
}

function normalizar(texto) {
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function preencherFiltros() {
  const regioes = [...new Set(entregas.map(e => e.regiao))];
  const transportadoras = [...new Set(entregas.map(e => e.transportadora))];

  regioes.forEach(regiao => {
    const option = document.createElement("option");
    option.value = regiao;
    option.textContent = regiao;
    document.getElementById("regionFilter").appendChild(option);
  });

  transportadoras.forEach(transportadora => {
    const option = document.createElement("option");
    option.value = transportadora;
    option.textContent = transportadora;
    document.getElementById("carrierFilter").appendChild(option);
  });
}

function dadosFiltrados() {
  const busca = normalizar(document.getElementById("searchInput").value);
  const regiao = document.getElementById("regionFilter").value;
  const transportadora = document.getElementById("carrierFilter").value;
  const status = document.getElementById("statusFilter").value;

  return entregas.filter(entrega => {
    const textoBusca = normalizar(`
      ${entrega.id}
      ${entrega.cidade}
      ${entrega.regiao}
      ${entrega.transportadora}
      ${statusEntrega(entrega)}
    `);

    const okBusca = textoBusca.includes(busca);
    const okRegiao = regiao === "Todas" || entrega.regiao === regiao;
    const okTransportadora = transportadora === "Todas" || entrega.transportadora === transportadora;
    const okStatus = status === "Todos" || statusEntrega(entrega) === status;

    return okBusca && okRegiao && okTransportadora && okStatus;
  });
}

function agruparAtraso(lista, chave) {
  return lista.reduce((acc, entrega) => {
    const nome = entrega[chave];
    acc[nome] = (acc[nome] || 0) + atraso(entrega);
    return acc;
  }, {});
}

function atualizarCards(dados) {
  const total = dados.length;
  const atrasadas = dados.filter(e => atraso(e) > 0).length;
  const taxa = total ? Math.round((atrasadas / total) * 100) : 0;
  const maior = total ? Math.max(...dados.map(e => atraso(e))) : 0;

  document.getElementById("totalEntregas").textContent = total;
  document.getElementById("totalAtrasadas").textContent = atrasadas;
  document.getElementById("taxaAtraso").textContent = `${taxa}%`;
  document.getElementById("maiorAtraso").textContent = textoDias(maior);
}

function atualizarInsight(dados) {
  const insight = document.getElementById("insightTexto");

  if (dados.length === 0) {
    insight.textContent = "Nenhuma entrega foi encontrada com os filtros aplicados.";
    return;
  }

  const atrasadas = dados.filter(e => atraso(e) > 0);
  const taxa = Math.round((atrasadas.length / dados.length) * 100);
  const ranking = [...dados].sort((a, b) => atraso(b) - atraso(a));
  const maisCritica = ranking[0];

  const somaRegiao = agruparAtraso(dados, "regiao");
  const regiaoCritica = Object.entries(somaRegiao).sort((a, b) => b[1] - a[1])[0];

  insight.textContent =
    `Foram analisadas ${dados.length} entregas. ${atrasadas.length} estão atrasadas, ` +
    `representando ${taxa}% do conjunto filtrado. A entrega com maior prioridade é #${maisCritica.id}, ` +
    `em ${maisCritica.cidade}, com ${textoDias(atraso(maisCritica))} de atraso. ` +
    `A região com maior soma de atrasos é ${regiaoCritica[0]}.`;
}

function atualizarPrioridades(dados) {
  const container = document.getElementById("priorityList");
  container.innerHTML = "";

  const ranking = [...dados]
    .filter(e => atraso(e) > 0)
    .sort((a, b) => atraso(b) - atraso(a));

  if (ranking.length === 0) {
    container.innerHTML = `<p>Nenhuma entrega atrasada nos filtros atuais.</p>`;
    return;
  }

  ranking.forEach((entrega, index) => {
    const status = statusEntrega(entrega);

    const item = document.createElement("div");
    item.className = "priority-item";

    item.innerHTML = `
      <div class="position">${index + 1}</div>
      <div>
        <strong>Entrega #${entrega.id}</strong><br>
        <span>${entrega.cidade} • ${entrega.regiao} • ${entrega.transportadora}</span>
      </div>
      <div class="delay">+ ${textoDias(atraso(entrega))}</div>
      <span class="status ${classeStatus(status)}">${status}</span>
    `;

    container.appendChild(item);
  });
}

function atualizarTabela(dados) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  const ordenados = [...dados].sort((a, b) => atraso(b) - atraso(a));

  ordenados.forEach(entrega => {
    const status = statusEntrega(entrega);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>#${entrega.id}</td>
      <td>${entrega.cidade}</td>
      <td>${entrega.regiao}</td>
      <td>${entrega.transportadora}</td>
      <td>${textoDias(entrega.prazo)}</td>
      <td>${textoDias(entrega.diasReais)}</td>
      <td>${textoDias(atraso(entrega))}</td>
      <td><span class="status ${classeStatus(status)}">${status}</span></td>
    `;

    tbody.appendChild(tr);
  });
}

function destruirGrafico(grafico) {
  if (grafico) grafico.destroy();
}

function atualizarGraficos(dados) {
  destruirGrafico(chartTransportadora);
  destruirGrafico(chartStatus);
  destruirGrafico(chartRegiao);

  const atrasoPorTransportadora = agruparAtraso(dados, "transportadora");
  const atrasoPorRegiao = agruparAtraso(dados, "regiao");

  const statusCount = dados.reduce((acc, entrega) => {
    const status = statusEntrega(entrega);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  chartTransportadora = new Chart(document.getElementById("chartTransportadora"), {
    type: "bar",
    data: {
      labels: Object.keys(atrasoPorTransportadora),
      datasets: [{
        label: "Dias de atraso",
        data: Object.values(atrasoPorTransportadora),
        borderWidth: 2,
        borderRadius: 12
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,.08)" }
        },
        y: {
          grid: { color: "rgba(255,255,255,.08)" }
        }
      }
    }
  });

  chartStatus = new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  chartRegiao = new Chart(document.getElementById("chartRegiao"), {
    type: "polarArea",
    data: {
      labels: Object.keys(atrasoPorRegiao),
      datasets: [{
        label: "Dias de atraso",
        data: Object.values(atrasoPorRegiao),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function atualizarDashboard() {
  const dados = dadosFiltrados();

  atualizarCards(dados);
  atualizarInsight(dados);
  atualizarPrioridades(dados);
  atualizarTabela(dados);
  atualizarGraficos(dados);
}

document.getElementById("searchInput").addEventListener("input", atualizarDashboard);
document.getElementById("regionFilter").addEventListener("change", atualizarDashboard);
document.getElementById("carrierFilter").addEventListener("change", atualizarDashboard);
document.getElementById("statusFilter").addEventListener("change", atualizarDashboard);

preencherFiltros();
atualizarDashboard();