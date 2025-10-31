const API_BASE_URL = window.API_BASE_URL || "";
const METRICS_ENDPOINT = `${API_BASE_URL}/metrics`;
const ORDERS_ENDPOINT = `${API_BASE_URL}/orders`;

const KPI_CONFIG = [
  {
    key: "totalValue",
    label: "Total Vendido",
    color: "#3b82f6",
    background: "rgba(59, 130, 246, 0.2)",
    axis: "yCurrency",
    fill: true,
  },
  {
    key: "averageTicket",
    label: "Ticket Médio",
    color: "#0ea5e9",
    background: "rgba(14, 165, 233, 0.2)",
    axis: "yCurrency",
    fill: true,
    dash: [6, 6],
  },
  {
    key: "totalOrders",
    label: "Pedidos",
    color: "#6366f1",
    background: "rgba(99, 102, 241, 0.18)",
    axis: "yOrders",
    fill: false,
  },
  {
    key: "kitCount",
    label: "Kits",
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.14)",
    axis: "yOrders",
    fill: false,
  },
  {
    key: "sampleCount",
    label: "Amostras",
    color: "#f97316",
    background: "rgba(249, 115, 22, 0.14)",
    axis: "yOrders",
    fill: false,
  },
  {
    key: "callcenterCount",
    label: "Callcenter",
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.14)",
    axis: "yOrders",
    fill: false,
  },
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const state = {
  orders: [],
  filters: {
    platform: "",
    datePreset: "all",
  },
  metricsHistory: [],
  visibleKpis: KPI_CONFIG.reduce(
    (acc, { key }) => ({ ...acc, [key]: true }),
    {}
  ),
};

const $ = (selector) => document.querySelector(selector);

const refs = {
  totalValue: $("#totalValue"),
  totalOrders: $("#totalOrders"),
  averageTicket: $("#averageTicket"),
  kitOrdersCount: $("#kitOrdersCount"),
  kitOrdersValue: $("#kitOrdersValue"),
  sampleOrdersCount: $("#sampleOrdersCount"),
  sampleOrdersValue: $("#sampleOrdersValue"),
  callcenterOrdersCount: $("#callcenterOrdersCount"),
  callcenterOrdersValue: $("#callcenterOrdersValue"),
  realtimeStatus: $("#realtimeStatus"),
  ordersCountBadge: $("#ordersCountBadge"),
  ordersTableBody: $("#ordersTableBody"),
  lastUpdated: $("#lastUpdated"),
  refreshButton: $("#refreshButton"),
  filterPlatform: $("#filterPlatform"),
  filterDate: $("#filterDate"),
  orderRowTemplate: document.querySelector("#orderRowTemplate"),
  metricsChart: document.querySelector("#metricsChart"),
};

const deltaRefs = {
  totalValue: {
    value: $("#totalValueDelta"),
    pct: $("#totalValueDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="totalValue"]'),
    isCurrency: true,
  },
  totalOrders: {
    value: $("#totalOrdersDelta"),
    pct: $("#totalOrdersDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="totalOrders"]'),
  },
  averageTicket: {
    value: $("#averageTicketDelta"),
    pct: $("#averageTicketDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="averageTicket"]'),
    isCurrency: true,
  },
  kitCount: {
    value: $("#kitOrdersDelta"),
    pct: $("#kitOrdersDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="kitCount"]'),
  },
  sampleCount: {
    value: $("#sampleOrdersDelta"),
    pct: $("#sampleOrdersDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="sampleCount"]'),
  },
  callcenterCount: {
    value: $("#callcenterOrdersDelta"),
    pct: $("#callcenterOrdersDeltaPct"),
    dot: document.querySelector('[data-kpi-dot="callcenterCount"]'),
  },
};

let metricsChart;

const setLoading = (isLoading) => {
  refs.refreshButton.disabled = isLoading;
  refs.refreshButton.textContent = isLoading
    ? "Atualizando..."
    : "Atualizar agora";
};

const updateMetricsUI = ({
  total_value = 0,
  total_orders = 0,
  average_ticket = 0,
} = {}) => {
  refs.totalValue.textContent = formatCurrency(total_value);
  refs.totalOrders.textContent = total_orders;
  refs.averageTicket.textContent = formatCurrency(average_ticket);
};

const normalizeType = (order) =>
  (
    order?.type ||
    order?.category ||
    order?.product_type ||
    order?.segment ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

const getSpecialOrders = (orders) => {
  const kitOrders = [];
  const sampleOrders = [];
  const callcenterOrders = [];

  orders.forEach((order) => {
    const normalized = normalizeType(order);

    if (normalized.includes("kit")) {
      kitOrders.push(order);
    }

    if (normalized.includes("amostra") || normalized.includes("sample")) {
      sampleOrders.push(order);
    }

    if (
      normalized.includes("callcenter") ||
      normalized.includes("call center")
    ) {
      callcenterOrders.push(order);
    }
  });

  return { kitOrders, sampleOrders, callcenterOrders };
};

const updateSpecialOrdersUI = (orders) => {
  const { kitOrders, sampleOrders, callcenterOrders } =
    getSpecialOrders(orders);

  const sumValues = (items) =>
    items.reduce((acc, item) => acc + Number(item.value || 0), 0);

  const summary = {
    kitCount: kitOrders.length,
    kitTotal: sumValues(kitOrders),
    sampleCount: sampleOrders.length,
    sampleTotal: sumValues(sampleOrders),
    callcenterCount: callcenterOrders.length,
    callcenterTotal: sumValues(callcenterOrders),
  };

  refs.kitOrdersCount.textContent = summary.kitCount;
  refs.kitOrdersValue.textContent = formatCurrency(summary.kitTotal);

  refs.sampleOrdersCount.textContent = summary.sampleCount;
  refs.sampleOrdersValue.textContent = formatCurrency(summary.sampleTotal);

  refs.callcenterOrdersCount.textContent = summary.callcenterCount;
  refs.callcenterOrdersValue.textContent = formatCurrency(
    summary.callcenterTotal
  );

  return summary;
};

const applyDataToUI = (metrics, orders) => {
  updateMetricsUI(metrics);
  state.orders = orders;
  renderOrdersTable(state.orders);
  const specialMetrics = updateSpecialOrdersUI(state.orders);
  updateMetricsHistory(metrics, specialMetrics);
};

const updateMetricsHistory = (metrics, specialMetrics) => {
  const entry = {
    timestamp: new Date(),
    totalValue: Number(metrics?.total_value ?? 0),
    totalOrders: Number(metrics?.total_orders ?? 0),
    averageTicket: Number(metrics?.average_ticket ?? 0),
    kitCount: Number(specialMetrics?.kitCount ?? 0),
    sampleCount: Number(specialMetrics?.sampleCount ?? 0),
    callcenterCount: Number(specialMetrics?.callcenterCount ?? 0),
  };

  state.metricsHistory.push(entry);
  if (state.metricsHistory.length > 25) {
    state.metricsHistory.shift();
  }

  updateMetricsChart();
  refreshDeltaBadges();
};

const initMetricsChart = () => {
  if (!refs.metricsChart || typeof Chart === "undefined") return;

  const context = refs.metricsChart.getContext("2d");

  metricsChart = new Chart(context, {
    type: "line",
    data: {
      labels: [],
      datasets: KPI_CONFIG.map(
        ({ key, label, color, background, axis, fill, dash = [] }) => ({
          label,
          data: [],
          borderColor: color,
          backgroundColor: background,
          borderWidth: 2,
          tension: 0.35,
          fill,
          pointRadius: 3,
          borderDash: dash,
          yAxisID: axis,
          kpiKey: key,
          hidden: !state.visibleKpis[key],
        })
      ),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            color: "rgba(226, 232, 240, 0.7)",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        yCurrency: {
          type: "linear",
          position: "left",
          ticks: {
            color: "rgba(226, 232, 240, 0.7)",
            callback: (value) => formatCurrency(value),
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        yOrders: {
          type: "linear",
          position: "right",
          grid: {
            drawOnChartArea: false,
            color: "rgba(148, 163, 184, 0.2)",
          },
          ticks: {
            precision: 0,
            color: "rgba(226, 232, 240, 0.7)",
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "rgba(226, 232, 240, 0.85)",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const { dataset, raw } = context;
              const isCurrency = dataset.yAxisID === "yCurrency";
              const value = Number(raw ?? 0);
              return `${dataset.label}: ${
                isCurrency ? formatCurrency(value) : value
              }`;
            },
          },
        },
      },
    },
  });
};

const updateMetricsChart = () => {
  if (!metricsChart) return;

  const labels = state.metricsHistory.map((entry) =>
    entry.timestamp.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  metricsChart.data.labels = labels;
  KPI_CONFIG.forEach(({ key }, index) => {
    const dataset = metricsChart.data.datasets[index];
    dataset.data = state.metricsHistory.map((entry) => entry[key] ?? 0);
    dataset.hidden = !state.visibleKpis[key];
  });

  metricsChart.update();
};

const resetDeltaDisplay = (ref) => {
  if (!ref) return;

  if (ref.value) {
    ref.value.textContent = "—";
    ref.value.classList.remove(
      "metric-card__delta--positive",
      "metric-card__delta--negative"
    );
  }

  if (ref.pct) {
    ref.pct.textContent = "—";
    ref.pct.classList.remove(
      "metric-card__delta--positive",
      "metric-card__delta--negative"
    );
  }

  if (ref.dot) {
    ref.dot.classList.remove(
      "metric-card__dot--positive",
      "metric-card__dot--negative"
    );
  }
};

const refreshDeltaBadges = () => {
  const historyLength = state.metricsHistory.length;

  if (historyLength < 2) {
    Object.values(deltaRefs).forEach(resetDeltaDisplay);
    return;
  }

  const current = state.metricsHistory[historyLength - 1];
  const previous = state.metricsHistory[historyLength - 2];

  KPI_CONFIG.forEach(({ key, axis }) => {
    const ref = deltaRefs[key];
    if (!ref) return;

    const currentValue = Number(current[key] ?? 0);
    const previousValue = Number(previous[key] ?? 0);
    const diff = currentValue - previousValue;
    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "+";
    const isCurrency = ref.isCurrency ?? axis === "yCurrency";

    const formattedDiff = isCurrency
      ? `${sign}${formatCurrency(Math.abs(diff))}`
      : `${sign}${Math.abs(diff).toLocaleString("pt-BR")}`;

    let percentText = "0,0%";
    if (previousValue === 0) {
      if (diff === 0) {
        percentText = "0,0%";
      } else {
        percentText = `${diff > 0 ? "+" : "-"}∞%`;
      }
    } else {
      const variation = (diff / previousValue) * 100;
      const variationSign = variation > 0 ? "+" : variation < 0 ? "-" : "+";
      percentText = `${variationSign}${percentFormatter.format(
        Math.abs(variation)
      )}%`;
    }

    if (ref.value) {
      ref.value.textContent = formattedDiff;
      ref.value.classList.remove(
        "metric-card__delta--positive",
        "metric-card__delta--negative"
      );
      if (diff > 0) {
        ref.value.classList.add("metric-card__delta--positive");
      } else if (diff < 0) {
        ref.value.classList.add("metric-card__delta--negative");
      }
    }

    if (ref.pct) {
      ref.pct.textContent = `(${percentText})`;
      ref.pct.classList.remove(
        "metric-card__delta--positive",
        "metric-card__delta--negative"
      );
      if (diff > 0) {
        ref.pct.classList.add("metric-card__delta--positive");
      } else if (diff < 0) {
        ref.pct.classList.add("metric-card__delta--negative");
      }
    }

    if (ref.dot) {
      ref.dot.classList.remove(
        "metric-card__dot--positive",
        "metric-card__dot--negative"
      );
      if (diff > 0) {
        ref.dot.classList.add("metric-card__dot--positive");
      } else if (diff < 0) {
        ref.dot.classList.add("metric-card__dot--negative");
      }
    }
  });
};

const setupKpiToggles = () => {
  const toggles = document.querySelectorAll("[data-kpi-toggle]");

  toggles.forEach((toggle) => {
    const key = toggle.dataset.kpiToggle;

    if (!(key in state.visibleKpis)) return;

    toggle.checked = state.visibleKpis[key];

    toggle.addEventListener("change", () => {
      state.visibleKpis[key] = toggle.checked;

      if (!metricsChart) return;

      const dataset = metricsChart.data.datasets.find(
        (item) => item.kpiKey === key
      );

      if (dataset) {
        dataset.hidden = !toggle.checked;
        metricsChart.update();
      }
    });
  });
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getDateRange = (preset) => {
  const now = new Date();
  const todayStart = startOfDay(now);

  switch (preset) {
    case "today":
      return { start: todayStart, end: addDays(todayStart, 1) };
    case "yesterday": {
      const start = addDays(todayStart, -1);
      return { start, end: todayStart };
    }
    case "last7d": {
      const start = addDays(todayStart, -6);
      return { start, end: addDays(todayStart, 1) };
    }
    case "currentMonth": {
      const start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        1
      );
      const end = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() + 1,
        1
      );
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() - 1,
        1
      );
      const end = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
};

const applyFilters = (orders) => {
  const { platform, datePreset } = state.filters;
  const { start, end } = getDateRange(datePreset);

  return orders.filter((order) => {
    const matchesPlatform = platform ? order.platform === platform : true;

    const orderDate = order.created_at ? new Date(order.created_at) : null;
    const matchesDate =
      start && end && orderDate
        ? orderDate >= start && orderDate < end
        : start && !end && orderDate
        ? orderDate >= start
        : !start && end && orderDate
        ? orderDate < end
        : true;

    return matchesPlatform && matchesDate;
  });
};

const renderOrdersTable = (orders) => {
  const filteredOrders = applyFilters(orders);
  refs.ordersCountBadge.textContent = `${filteredOrders.length} pedidos`;

  if (!filteredOrders.length) {
    refs.ordersTableBody.innerHTML =
      '<tr><td colspan="6" class="table-empty">Nenhum pedido encontrado</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filteredOrders.forEach((order) => {
    const row = refs.orderRowTemplate.content.cloneNode(true);
    row.querySelector('[data-field="order_id"]').textContent = order.order_id;
    row.querySelector('[data-field="customer_name"]').textContent =
      order.customer_name;
    row.querySelector('[data-field="value"]').textContent = formatCurrency(
      order.value
    );

    const statusCell = row.querySelector('[data-field="status"]');
    statusCell.textContent = order.status;
    statusCell.setAttribute("data-status", order.status?.toLowerCase());

    row.querySelector('[data-field="platform"]').textContent = order.platform;
    row.querySelector('[data-field="created_at"]').textContent = formatDateTime(
      order.created_at
    );

    fragment.appendChild(row);
  });

  refs.ordersTableBody.innerHTML = "";
  refs.ordersTableBody.appendChild(fragment);
};

const buildApiUrl = (endpoint, params = {}) => {
  const baseUrl = endpoint.startsWith("http")
    ? endpoint
    : `${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const url = new URL(baseUrl, window.location.origin);

  Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

  return url.toString();
};

const fetchJSON = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Erro ao buscar ${url}: ${response.statusText}`);
  }
  return response.json();
};

const fetchData = async () => {
  setLoading(true);
  refs.realtimeStatus.textContent = "Carregando novos dados...";

  try {
    const range = state.filters.datePreset;
    const platform = state.filters.platform;

    const metricsUrl = buildApiUrl(METRICS_ENDPOINT, { range });
    const ordersUrl = buildApiUrl(ORDERS_ENDPOINT, {
      range,
      platform,
      limit: 500,
    });

    const [metrics, orders] = await Promise.all([
      fetchJSON(metricsUrl),
      fetchJSON(ordersUrl),
    ]);

    applyDataToUI(metrics, orders);
    refs.realtimeStatus.textContent = "Dados atualizados";
    refs.lastUpdated.textContent = `Última atualização: ${new Date().toLocaleTimeString(
      "pt-BR"
    )}`;
  } catch (error) {
    console.error(error);
    refs.realtimeStatus.textContent = "Erro ao atualizar";
    refs.lastUpdated.textContent = "Houve um problema ao buscar os dados";
  } finally {
    setLoading(false);
  }
};

const attachFilterListeners = () => {
  refs.filterPlatform.addEventListener("change", (event) => {
    state.filters.platform = event.target.value;
    renderOrdersTable(state.orders);
  });

  refs.filterDate.addEventListener("change", (event) => {
    state.filters.datePreset = event.target.value;
    renderOrdersTable(state.orders);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  attachFilterListeners();
  initMetricsChart();
  setupKpiToggles();
  refs.realtimeStatus.textContent = "Clique em 'Atualizar agora'";
  refs.lastUpdated.textContent = "Aguardando primeira sincronização";
  refs.refreshButton.addEventListener("click", () => {
    fetchData();
  });
});
