/**
 * @fileoverview Compute Capability Registry application runtime.
 * Implements bilingual (EN / ZH-Hant) switching with English as default,
 * secure native DOM node generation, responsive navigation tracking,
 * and data loading from data.json.
 */

"use strict";

const DATA_URL = "data.json";

/**
 * Shorthand for document.getElementById.
 * @param {string} id - Element ID.
 * @return {HTMLElement|null} The DOM element.
 */
const byId = (id) => document.getElementById(id);

/**
 * Create a DOM element with optional class name and text content.
 * @param {string} tag - HTML tag name.
 * @param {string|null} className - Optional CSS class name.
 * @param {string|number|null} text - Optional text content.
 * @return {HTMLElement} Created element.
 */
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

/**
 * Create an accessible lazy-loaded image element with error fallback.
 * @param {string} src - Image source URI.
 * @param {string} alt - Alt text description.
 * @param {boolean} eager - Whether to load eagerly.
 * @return {HTMLImageElement} Created image element.
 */
function makeImage(src, alt = "", eager = false) {
  const image = make("img");
  image.src = src;
  image.alt = alt;
  image.decoding = "async";
  if (!eager) image.loading = "lazy";
  image.addEventListener("error", () => {
    image.classList.add("image-unavailable");
    image.removeAttribute("src");
  }, { once: true });
  return image;
}

/**
 * Bilingual UI text dictionaries for English and Traditional Chinese.
 */
const I18N = {
  en: {
    lang_code: "en",
    page_title: "Sam Huang · Hardware Capability Registry",
    meta_desc: "Sam Huang's hardware capability & compute registry: active dual-node compute pool, lifecycle boundaries, and visual workspace.",
    skip_link: "Skip to main content",
    brand_title: "COMPUTE.REGISTRY",
    brand_sub: "Sam Huang / Hardware capability",
    brand_aria: "Sam Huang Hardware Capability Registry Home",
    nav_aria: "Primary navigation",
    nav_compute: "Compute Nodes",
    nav_boundaries: "Asset Boundaries",
    nav_workspace: "Displays & Controls",
    nav_evidence: "Evidence Note",
    header_status: "{n} nodes ready",
    hero_eyebrow: "PERSONAL COMPUTE INVENTORY",
    hero_reviewed: "REVIEWED 2026.09",
    hero_lead: "Two active nodes assigned to their best-fit roles. RTX 5080 reserved for interactive and heavy GPU workloads; RTX 3060 handles background tasks, CI, and batch jobs.",
    hero_btn_compute: "View Compute Pool",
    hero_btn_boundaries: "Explore Boundaries",
    hero_note: "Capacity reflects separate installed totals and cannot be combined across machines.",
    primary_node_chip: "PRIMARY NODE / AVAILABLE",
    metric_active: "Active Nodes",
    metric_memory: "Total Installed RAM",
    metric_vram: "Dedicated GPU VRAM*",
    metric_routing: "Interactive / Background",
    compute_eyebrow: "01 / ACTIVE COMPUTE POOL",
    compute_title: "Two Production-Ready Compute Nodes",
    compute_desc: "Capability over model numbers. The primary node handles low-latency, GPU-heavy tasks; the background node absorbs schedulable workloads to prevent bottlenecks.",
    routing_rule: "ROUTING RULE",
    routing_title: "Route Work to the Smallest Sufficient Rig",
    route_primary_label: "Interactive / CUDA / High-RAM",
    route_secondary_label: "CI / Batch / Background Services",
    boundaries_eyebrow: "02 / ALLOCATION & EXCLUSION LEDGER",
    boundaries_title: "Preserve Device Records, Clarify Allocation Boundaries",
    boundaries_desc: "Transferred or heat-constrained devices stay in the historical ledger, but are excluded from active pools, redundancy, or capacity calculations.",
    workspace_eyebrow: "03 / VISUAL WORKSPACE",
    workspace_title: "Displays as Workspaces, Not Desktop Ornaments",
    workspace_desc: "From a 49-inch DQHD timeline to a 32-inch high-refresh KVM panel, each display serves distinct density and control requirements.",
    controls_eyebrow: "04 / CONTROL SURFACES",
    controls_title: "Compact, Trackable Input and Audio",
    controls_desc: "Supporting peripherals maintain high traceability through clear categories, use cases, and imagery without visual clutter.",
    power_eyebrow: "05 / POWER LAYER",
    power_title: "Power Stations & Chargers",
    evidence_eyebrow: "EVIDENCE NOTE",
    evidence_title: "Specs, Roles, and Measurements Stated Separately",
    evidence_desc: "This page is a hardware snapshot, not real-time telemetry. Models and installed capacities reflect the asset registry; recommended workloads describe scheduling roles; omitted benchmarks are never implied.",
    evidence_reviewed: "Inventory reviewed",
    footer_sub: "Compute Capability Registry",
    footer_summary: "Active {active} · Transferred {transferred} · Excluded {excluded} · Supporting {supporting}",
    back_to_top: "Back to top",
    loading_nodes: "Loading compute nodes…",
    loading_status: "Loading asset status…",
    loading_displays: "Loading displays…",
    loading_controls: "Loading peripherals…",
    loading_power: "Loading power equipment…",
    err_message: "Hardware registry failed to load. Ensure data.json is in the same directory.",
    workloads_label: "Best-fit workloads",
    status_labels: {
      transferred: { label: "TRANSFERRED / Transferred", note: "Out of pool" },
      excluded: { label: "EXCLUDED / Pool Excluded", note: "Thermal limit" }
    },
    node_roles: {
      primary: "PRIMARY",
      background: "BACKGROUND"
    },
    status_chips: {
      active: "Ready for work",
      transferred: "Out of pool",
      excluded: "Thermal limit"
    }
  },
  zh: {
    lang_code: "zh-Hant",
    page_title: "Sam Huang · 硬體能力與資產清冊",
    meta_desc: "Sam Huang 的硬體能力與資產清冊：可投入工作的雙節點運算資源、生命週期邊界，以及顯示與控制設備。",
    skip_link: "跳到主要內容",
    brand_title: "COMPUTE.REGISTRY",
    brand_sub: "Sam Huang / 硬體能力清冊",
    brand_aria: "Sam Huang 硬體能力清冊首頁",
    nav_aria: "主要導覽",
    nav_compute: "工作節點",
    nav_boundaries: "資產邊界",
    nav_workspace: "顯示與控制",
    nav_evidence: "資料說明",
    header_status: "{n} 個節點就緒",
    hero_eyebrow: "PERSONAL COMPUTE INVENTORY",
    hero_reviewed: "REVIEWED 2026.09",
    hero_lead: "兩個工作節點，各自承擔最合適的任務。RTX 5080 保留給互動與重 GPU 工作；RTX 3060 接手背景、測試與長時間批次。",
    hero_btn_compute: "查看工作池",
    hero_btn_boundaries: "了解排除邊界",
    hero_note: "容量是兩台獨立主機的安裝總量，不代表 RAM 或 VRAM 可以合併。",
    primary_node_chip: "PRIMARY NODE / AVAILABLE",
    metric_active: "可投入節點",
    metric_memory: "安裝記憶體合計",
    metric_vram: "獨立 GPU VRAM 合計*",
    metric_routing: "互動主力 / 背景分流",
    compute_eyebrow: "01 / ACTIVE COMPUTE POOL",
    compute_title: "真正可投入工作的雙節點",
    compute_desc: "能力先於型號。主力節點負責低延遲與 GPU 密集工作；背景節點吸收可排程負載，避免所有任務都擠在同一台機器。",
    routing_rule: "ROUTING RULE",
    routing_title: "把工作送到最小、但足夠的設備",
    route_primary_label: "互動 / CUDA / 大記憶體",
    route_secondary_label: "CI / 批次 / 背景服務",
    boundaries_eyebrow: "02 / ALLOCATION & EXCLUSION LEDGER",
    boundaries_title: "保留設備紀錄，也清楚標示工作邊界",
    boundaries_desc: "已移交或因散熱排除的設備仍屬於歷史清冊，但不會被算進工作池、備援或容量評估。",
    workspace_eyebrow: "03 / VISUAL WORKSPACE",
    workspace_title: "顯示設備不是裝飾，而是工作介面",
    workspace_desc: "從 49 吋 DQHD 時間軸到 32 吋高幀率 KVM，每一塊畫面都有不同的資訊密度與控制角色。",
    controls_eyebrow: "04 / CONTROL SURFACES",
    controls_title: "輸入與音訊，維持緊湊但可查",
    controls_desc: "支援設備不與運算節點競爭視覺層級；它們以清楚分類、用途與圖像維持可追蹤性。",
    power_eyebrow: "05 / POWER LAYER",
    power_title: "供電與充電資產",
    evidence_eyebrow: "EVIDENCE NOTE",
    evidence_title: "規格、用途與量測，分開表達",
    evidence_desc: "本頁是硬體 snapshot，不宣稱即時同步。型號與安裝容量來自資產清冊；「適合的工作」是排程角色；未列出的 benchmark 不會被暗示為已驗證效能。",
    evidence_reviewed: "Inventory reviewed",
    footer_sub: "Compute Capability Registry",
    footer_summary: "Active {active} · Transferred {transferred} · Excluded {excluded} · Supporting {supporting}",
    back_to_top: "回到頂端",
    loading_nodes: "正在讀取工作節點…",
    loading_status: "正在讀取資產狀態…",
    loading_displays: "正在讀取顯示設備…",
    loading_controls: "正在讀取控制設備…",
    loading_power: "正在讀取供電設備…",
    err_message: "硬體清冊暫時無法讀取。請確認 data.json 與頁面位於同一目錄。",
    workloads_label: "適合工作",
    status_labels: {
      transferred: { label: "TRANSFERRED / 已移交", note: "不在工作池" },
      excluded: { label: "EXCLUDED / 工作池排除", note: "散熱考量" }
    },
    node_roles: {
      primary: "PRIMARY",
      background: "BACKGROUND"
    },
    status_chips: {
      active: "可投入工作",
      transferred: "不在工作池",
      excluded: "散熱考量"
    }
  }
};

/**
 * Active application language. Default is 'en' as requested.
 * @type {string}
 */
let currentLang = "en";

/**
 * Cached registry data object.
 * @type {object|null}
 */
let cachedData = null;

/**
 * Format GPU description text from string or compound object.
 * @param {object} item - Asset object.
 * @return {string} Combined GPU description.
 */
function gpuLabel(item) {
  if (typeof item.gpu === "string") return item.gpu;
  return [item.gpu?.external, item.gpu?.internal].filter(Boolean).join(" · ");
}

/**
 * Generate spec list key-value pairs for computing systems.
 * @param {object} item - Computing node asset.
 * @return {Array<[string, string]>} Spec entries.
 */
function specEntries(item) {
  return [
    ["CPU", [item.cpu?.model, item.cpu?.architecture].filter(Boolean).join(" · ")],
    ["RAM", [item.ram?.capacity, item.ram?.spec].filter(Boolean).join(" · ")],
    ["GPU", gpuLabel(item)],
    ["STORAGE", item.storage?.primary]
  ].filter(([, value]) => value);
}

/**
 * Build description list element for specifications.
 * @param {object} item - Computing node asset.
 * @return {HTMLElement} dl element containing specs.
 */
function makeSpecList(item) {
  const list = make("dl", "spec-list");
  for (const [label, value] of specEntries(item)) {
    const row = make("div", "spec-row");
    row.append(make("dt", null, label), make("dd", null, value));
    list.append(row);
  }
  return list;
}

/**
 * Render hero section title safely using standard DOM methods.
 * @param {string} lang - Language code ('en' | 'zh').
 */
function renderHeroTitle(lang) {
  const title = byId("hero-title");
  if (!title) return;
  if (lang === "zh") {
    const em = make("em");
    em.append(document.createTextNode("按真正可投入的"), make("br"), document.createTextNode("算力管理。"));
    title.replaceChildren(document.createTextNode("我的硬體，"), em);
  } else {
    const em = make("em");
    em.append(document.createTextNode("managed by real,"), make("br"), document.createTextNode("schedulable compute."));
    title.replaceChildren(document.createTextNode("My hardware, "), em);
  }
}

/**
 * Create an active compute node card.
 * @param {object} item - Node data.
 * @param {string} lang - Current language.
 * @return {HTMLElement} article card element.
 */
function makeNodeCard(item, lang) {
  const isPrimary = item.work_role === "primary";
  const dict = I18N[lang] || I18N.en;
  const card = make("article", `node-card ${isPrimary ? "node-card-primary" : "node-card-secondary"}`);
  card.id = item.id.toLowerCase();

  const statusNote = lang === "en" ? (item.status_note_en || dict.status_chips[item.status] || item.status_note) : item.status_note;
  const roleLabel = lang === "en" ? (item.role_label_en || item.role_label) : item.role_label;
  const summary = lang === "en" ? (item.summary_en || item.summary) : item.summary;
  const constraint = lang === "en" ? (item.constraint_en || item.constraint) : item.constraint;

  const media = make("div", "node-media");
  const status = make("span", "status-chip", statusNote);
  media.append(status, makeImage(item.image_path, ""));

  const content = make("div", "node-content");
  content.append(
    make("p", "node-kicker", `${isPrimary ? "PRIMARY" : "BACKGROUND"} / ${roleLabel}`),
    make("h3", null, item.name),
    make("p", "node-summary", summary)
  );

  const workloads = make("ul", "workload-list");
  workloads.setAttribute("aria-label", dict.workloads_label);
  for (const workload of item.workloads ?? []) workloads.append(make("li", null, workload));
  content.append(workloads, makeSpecList(item));

  if (constraint) content.append(make("p", "constraint-note", constraint));
  card.append(media, content);
  return card;
}

/**
 * Create a transferred or excluded boundary ledger card.
 * @param {object} item - Inactive asset data.
 * @param {string} lang - Current language.
 * @return {HTMLElement} article card element.
 */
function makeBoundaryItem(item, lang) {
  const dict = I18N[lang] || I18N.en;
  const card = make("article", "boundary-item");
  card.id = item.id.toLowerCase();

  const thumb = make("div", "boundary-thumb");
  thumb.append(makeImage(item.image_path, ""));

  const main = make("div", "boundary-main");
  const state = make("div", "boundary-state");
  const copy = dict.status_labels[item.status] ?? {
    label: item.status,
    note: lang === "en" ? (item.status_note_en || item.status_note) : item.status_note
  };
  const summary = lang === "en" ? (item.summary_en || item.summary) : item.summary;

  state.append(make("strong", null, copy.label), make("span", null, copy.note));
  main.append(state, make("h3", null, item.name), make("p", null, summary));

  const specs = make("div", "boundary-spec");
  const cpu = make("span");
  cpu.append(make("b", null, "CPU"), document.createTextNode(item.cpu?.model ?? "—"));
  const gpu = make("span");
  gpu.append(make("b", null, "GPU"), document.createTextNode(gpuLabel(item) || "—"));
  specs.append(cpu, gpu);

  card.append(thumb, main, specs);
  return card;
}

/**
 * Create a display asset card.
 * @param {object} item - Display asset data.
 * @param {number} index - Position index.
 * @param {string} lang - Current language.
 * @return {HTMLElement} article card element.
 */
function makeDisplayCard(item, index, lang) {
  const card = make("article", "display-card");
  card.id = item.id.toLowerCase();

  const visual = make("div", "display-image");
  visual.append(makeImage(item.image_path, ""));

  const useCase = lang === "en" ? (item.use_case_en || item.use_case) : item.use_case;

  const content = make("div", "display-content");
  content.append(
    make("span", "asset-index", `DISPLAY / ${String(index + 1).padStart(2, "0")}`),
    make("h3", null, item.name),
    make("p", "display-panel", item.panel),
    make("p", "display-use", useCase)
  );
  card.append(visual, content);
  return card;
}

/**
 * Create a peripheral asset card.
 * @param {object} item - Peripheral asset data.
 * @param {string} lang - Current language.
 * @return {HTMLElement} article card element.
 */
function makeCompactAsset(item, lang) {
  const card = make("article", "compact-asset");
  card.id = item.id.toLowerCase();

  const visual = make("div", "compact-image");
  visual.append(makeImage(item.image_path, ""));

  const name = lang === "en" ? (item.name_en || item.name) : item.name;
  const useCase = lang === "en" ? (item.use_case_en || item.use_case) : item.use_case;

  const copy = make("div", "compact-copy");
  copy.append(
    make("span", "compact-category", item.category),
    make("h3", null, name),
    make("p", "compact-use", useCase)
  );
  card.append(visual, copy);
  return card;
}

/**
 * Create a power asset card.
 * @param {object} item - Power asset data.
 * @return {HTMLElement} article card element.
 */
function makePowerCard(item) {
  const card = make("article", "power-card");
  card.id = item.id.toLowerCase();
  const visual = make("div", "power-image");
  visual.append(makeImage(item.image_path, ""));
  card.append(visual, make("h3", null, item.name));
  return card;
}

/**
 * Update all static document texts based on active language.
 * @param {string} lang - Language code ('en' | 'zh').
 */
function updateStaticTexts(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = dict.lang_code;
  document.title = dict.page_title;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", dict.meta_desc);

  if (byId("skip-link")) byId("skip-link").textContent = dict.skip_link;
  if (byId("brand-link")) byId("brand-link").setAttribute("aria-label", dict.brand_aria);
  if (byId("brand-title")) byId("brand-title").textContent = dict.brand_title;
  if (byId("brand-sub")) byId("brand-sub").textContent = dict.brand_sub;
  if (byId("site-nav")) byId("site-nav").setAttribute("aria-label", dict.nav_aria);

  if (byId("nav-compute")) byId("nav-compute").textContent = dict.nav_compute;
  if (byId("nav-boundaries")) byId("nav-boundaries").textContent = dict.nav_boundaries;
  if (byId("nav-workspace")) byId("nav-workspace").textContent = dict.nav_workspace;
  if (byId("nav-evidence")) byId("nav-evidence").textContent = dict.nav_evidence;

  if (byId("hero-eyebrow-text")) byId("hero-eyebrow-text").textContent = dict.hero_eyebrow;
  if (byId("hero-reviewed-text")) byId("hero-reviewed-text").textContent = dict.hero_reviewed;
  renderHeroTitle(lang);
  if (byId("hero-lead")) byId("hero-lead").textContent = dict.hero_lead;
  if (byId("hero-btn-compute")) byId("hero-btn-compute").textContent = dict.hero_btn_compute;
  if (byId("hero-btn-boundaries")) byId("hero-btn-boundaries").textContent = dict.hero_btn_boundaries;
  if (byId("hero-note-text")) byId("hero-note-text").textContent = dict.hero_note;
  if (byId("primary-node-chip")) byId("primary-node-chip").textContent = dict.primary_node_chip;

  if (byId("metric-label-active")) byId("metric-label-active").textContent = dict.metric_active;
  if (byId("metric-label-memory")) byId("metric-label-memory").textContent = dict.metric_memory;
  if (byId("metric-label-vram")) byId("metric-label-vram").textContent = dict.metric_vram;
  if (byId("metric-label-routing")) byId("metric-label-routing").textContent = dict.metric_routing;

  if (byId("compute-eyebrow")) byId("compute-eyebrow").textContent = dict.compute_eyebrow;
  if (byId("compute-title")) byId("compute-title").textContent = dict.compute_title;
  if (byId("compute-desc")) byId("compute-desc").textContent = dict.compute_desc;

  if (byId("allocation-rule-eyebrow")) byId("allocation-rule-eyebrow").textContent = dict.routing_rule;
  if (byId("allocation-title")) byId("allocation-title").textContent = dict.routing_title;
  if (byId("route-primary-text")) byId("route-primary-text").textContent = dict.route_primary_label;
  if (byId("route-secondary-text")) byId("route-secondary-text").textContent = dict.route_secondary_label;

  if (byId("boundaries-eyebrow")) byId("boundaries-eyebrow").textContent = dict.boundaries_eyebrow;
  if (byId("boundaries-title")) byId("boundaries-title").textContent = dict.boundaries_title;
  if (byId("boundaries-desc")) byId("boundaries-desc").textContent = dict.boundaries_desc;

  if (byId("workspace-eyebrow")) byId("workspace-eyebrow").textContent = dict.workspace_eyebrow;
  if (byId("workspace-title")) byId("workspace-title").textContent = dict.workspace_title;
  if (byId("workspace-desc")) byId("workspace-desc").textContent = dict.workspace_desc;

  if (byId("controls-eyebrow")) byId("controls-eyebrow").textContent = dict.controls_eyebrow;
  if (byId("controls-title")) byId("controls-title").textContent = dict.controls_title;
  if (byId("controls-desc")) byId("controls-desc").textContent = dict.controls_desc;

  if (byId("power-eyebrow")) byId("power-eyebrow").textContent = dict.power_eyebrow;
  if (byId("power-title")) byId("power-title").textContent = dict.power_title;

  if (byId("evidence-eyebrow")) byId("evidence-eyebrow").textContent = dict.evidence_eyebrow;
  if (byId("evidence-title")) byId("evidence-title").textContent = dict.evidence_title;
  if (byId("evidence-desc")) byId("evidence-desc").textContent = dict.evidence_desc;
  if (byId("evidence-reviewed-label")) byId("evidence-reviewed-label").textContent = dict.evidence_reviewed;

  if (byId("footer-brand-sub")) byId("footer-brand-sub").textContent = dict.footer_sub;
  if (byId("back-to-top")) {
    byId("back-to-top").replaceChildren(
      document.createTextNode(dict.back_to_top + " "),
      make("span", null, "↑")
    );
  }

  // Update switcher button pressed states
  for (const btn of document.querySelectorAll(".lang-btn")) {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  }
}

/**
 * Validate registry data integrity against core invariants.
 * @param {object} data - Parsed registry JSON.
 * @return {{active: Array<object>, inactive: Array<object>}} Sorted groups.
 */
function validateRegistry(data) {
  const requiredArrays = ["hardware_registry", "display_assets", "peripherals", "power_assets"];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) throw new Error(`Missing registry array: ${key}`);
  }

  const ids = [
    ...data.hardware_registry,
    ...data.display_assets,
    ...data.peripherals,
    ...data.power_assets
  ].map((item) => item.id);

  if (ids.some((id) => typeof id !== "string" || !id)) throw new Error("Every asset requires a stable id.");
  if (new Set(ids).size !== ids.length) throw new Error("Asset ids must be unique.");

  const active = data.hardware_registry.filter((item) => item.status === "active" && item.schedulable === true);
  const transferred = data.hardware_registry.filter((item) => item.status === "transferred" && item.schedulable === false);
  const excluded = data.hardware_registry.filter((item) => item.status === "excluded" && item.schedulable === false);

  if (active.length !== 2 || transferred.length !== 2 || excluded.length !== 1) {
    throw new Error("Scheduling boundary mismatch: expected active 2, transferred 2, excluded 1.");
  }
  if (active.length !== data.registry_summary?.active_nodes) throw new Error("Active-node summary does not match registry.");
  return { active, inactive: [...transferred, ...excluded] };
}

/**
 * Render the entire registry view for a specific language.
 * @param {object} data - Parsed JSON registry.
 * @param {string} lang - Language code ('en' | 'zh').
 */
function renderRegistry(data, lang) {
  const dict = I18N[lang] || I18N.en;
  const { active, inactive } = validateRegistry(data);
  active.sort((a, b) => (a.work_role === "primary" ? -1 : 1) - (b.work_role === "primary" ? -1 : 1));

  const activeNodes = byId("active-nodes");
  activeNodes.replaceChildren(...active.map((item) => makeNodeCard(item, lang)));

  const inactiveNodes = byId("inactive-nodes");
  inactiveNodes.replaceChildren(...inactive.map((item) => makeBoundaryItem(item, lang)));

  byId("display-assets").replaceChildren(...data.display_assets.map((item, idx) => makeDisplayCard(item, idx, lang)));
  byId("peripheral-assets").replaceChildren(...data.peripherals.map((item) => makeCompactAsset(item, lang)));
  byId("power-assets").replaceChildren(...data.power_assets.map(makePowerCard));

  byId("metric-active").textContent = data.registry_summary.active_nodes;
  byId("metric-memory").replaceChildren(
    document.createTextNode(data.registry_summary.active_memory_gb),
    make("small", null, "GB")
  );
  byId("metric-vram").replaceChildren(
    document.createTextNode(data.registry_summary.installed_gpu_vram_gb),
    make("small", null, "GB")
  );

  const date = byId("last-updated");
  date.textContent = data.last_updated;
  date.dateTime = data.last_updated;

  if (byId("header-status-text")) {
    byId("header-status-text").textContent = dict.header_status.replace("{n}", String(data.registry_summary.active_nodes));
  }

  const transferredCount = data.hardware_registry.filter((item) => item.status === "transferred").length;
  const excludedCount = data.hardware_registry.filter((item) => item.status === "excluded").length;
  const supportingCount = data.display_assets.length + data.peripherals.length + data.power_assets.length;

  byId("footer-summary").textContent = dict.footer_summary
    .replace("{active}", String(active.length))
    .replace("{transferred}", String(transferredCount))
    .replace("{excluded}", String(excludedCount))
    .replace("{supporting}", String(supportingCount));
}

/**
 * Render user-friendly failure state across asset grids.
 * @param {Error} error - Caught error.
 * @param {string} lang - Active language.
 */
function renderFailure(error, lang) {
  console.error("Hardware registry failed to load:", error);
  const dict = I18N[lang] || I18N.en;
  for (const id of ["active-nodes", "inactive-nodes", "display-assets", "peripheral-assets", "power-assets"]) {
    const target = byId(id);
    if (!target) continue;
    const alert = make("p", "error-state", dict.err_message);
    alert.setAttribute("role", "alert");
    target.replaceChildren(alert);
  }
}

/**
 * Switch active application language.
 * @param {string} targetLang - Language to switch to ('en' | 'zh').
 */
function switchLanguage(targetLang) {
  if (targetLang !== "en" && targetLang !== "zh") return;
  currentLang = targetLang;
  try {
    localStorage.setItem("hardware_registry_lang", targetLang);
  } catch {
    // Ignore localStorage availability issues in restricted environments
  }
  updateStaticTexts(targetLang);
  if (cachedData) {
    renderRegistry(cachedData, targetLang);
  }
}

/**
 * Initialize language switcher buttons.
 */
function initLanguageSwitch() {
  // Check persisted language preference, defaulting to English
  try {
    const saved = localStorage.getItem("hardware_registry_lang");
    if (saved === "zh" || saved === "en") {
      currentLang = saved;
    } else {
      currentLang = "en";
    }
  } catch {
    currentLang = "en";
  }

  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.lang;
      if (target && target !== currentLang) {
        switchLanguage(target);
      }
    });
  });

  updateStaticTexts(currentLang);
}

/**
 * Initialize scroll spy navigation highlighting.
 */
function initNavigation() {
  const links = [...document.querySelectorAll(".site-nav a[data-section]")];
  const tracked = [
    ["compute", "compute"],
    ["boundaries", "boundaries"],
    ["workspace", "workspace"],
    ["controls", "workspace"],
    ["power", "workspace"],
    ["evidence", "evidence"]
  ].map(([sectionId, navId]) => ({ section: byId(sectionId), navId }));

  let queued = false;
  const update = () => {
    queued = false;
    const threshold = Math.min(window.innerHeight * 0.36, 320);
    let current = "compute";
    for (const entry of tracked) {
      if (entry.section && entry.section.getBoundingClientRect().top <= threshold) {
        current = entry.navId;
      }
    }
    for (const link of links) {
      if (link.dataset.section === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  window.addEventListener("scroll", () => {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

/**
 * Main application bootstrap.
 */
async function start() {
  initNavigation();
  initLanguageSwitch();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    cachedData = await response.json();
    renderRegistry(cachedData, currentLang);
  } catch (error) {
    renderFailure(error, currentLang);
  }
}

start();
