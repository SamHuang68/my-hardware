/**
 * @fileoverview Compute Capability Registry application runtime.
 * Implements bilingual (EN / ZH-Hant) switching with English as default,
 * secure native DOM node generation, responsive navigation tracking,
 * category filtering, real-time asset search, copy-to-clipboard,
 * topology rendering, and data export.
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
 * Show a floating HUD toast notification.
 * @param {string} message - Message text to display.
 */
function showToast(message) {
  const hub = byId("toast-hub");
  if (!hub) return;
  const toast = make("div", "toast", message);
  hub.append(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 300ms ease, transform 300ms ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 320);
  }, 2200);
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
    lang_toggle_aria: "Switch to Traditional Chinese (切換至繁體中文)",
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
    vram_hover: "16GB (5080) + 12GB (3060) · Discrete Pools",
    filter_all: "All Assets",
    filter_compute: "Compute Nodes",
    filter_boundaries: "Boundaries",
    filter_displays: "Displays",
    filter_peripherals: "Controls",
    filter_power: "Power Layer",
    search_placeholder: "Search 22 assets (e.g. RTX, 49\", GaN, DDR5)...",
    search_clear_aria: "Clear search",
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
    topology_eyebrow: "WORKSPACE & SIGNAL TOPOLOGY",
    topology_title: "Dual-Host Display Routing & KVM Control Matrix",
    topology_desc: "Dedicated display pipelines for ultra-wide timeline density and living room QA, connected through a hardware KVM hub for seamless peripheral sharing.",
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
    export_json: "Export JSON",
    export_md: "Export Markdown",
    copy_specs: "Copy Specs",
    copied_toast: "Specifications copied to clipboard",
    ai_profile_title: "AI INFERENCE PROFILE",
    ai_gpu_native: "GPU Native",
    ai_cpu_offload: "DDR5 Offload",
    ai_vision: "Vision / Gen",
    ai_services: "Services",
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
    lang_toggle_aria: "Switch to English (切換至英文)",
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
    vram_hover: "16GB (5080) + 12GB (3060) · 兩卡獨立不可合併",
    filter_all: "全部資產",
    filter_compute: "算力節點",
    filter_boundaries: "資產邊界",
    filter_displays: "顯示設備",
    filter_peripherals: "控制周邊",
    filter_power: "供電設施",
    search_placeholder: "搜尋 22 項資產 (例如 RTX, 49\", 氮化鎵, DDR5)...",
    search_clear_aria: "清除搜尋",
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
    topology_eyebrow: "WORKSPACE & SIGNAL TOPOLOGY",
    topology_title: "雙節點螢幕分流與 KVM 控制矩陣",
    topology_desc: "以專用顯示通道實現超寬時間軸密度與大畫面視覺檢查，並透過硬體 KVM 樞紐跨主機共用控制周邊。",
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
    export_json: "匯出 JSON",
    export_md: "匯出 Markdown",
    copy_specs: "複製規格",
    copied_toast: "硬體規格已複製至剪貼簿",
    ai_profile_title: "本地 AI 推論能力指標",
    ai_gpu_native: "純顯存推論",
    ai_cpu_offload: "記憶體分流",
    ai_vision: "生圖與視覺",
    ai_services: "常駐服務",
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
 * Generate Markdown specification string for copying.
 * @param {object} item - Computing node asset.
 * @return {string} Markdown spec string.
 */
function generateMarkdownSpec(item) {
  const lines = [
    `### ${item.name}`,
    `- Form Factor: ${item.form_factor || "N/A"}`,
    `- Status: ${item.status}`,
    `- CPU: ${[item.cpu?.model, item.cpu?.architecture].filter(Boolean).join(" · ")}`,
    `- RAM: ${[item.ram?.capacity, item.ram?.spec].filter(Boolean).join(" · ")}`,
    `- GPU: ${gpuLabel(item)}`,
    `- Storage: ${item.storage?.primary || "N/A"}`
  ];
  if (item.power_supply) lines.push(`- Power: ${item.power_supply}`);
  if (item.ai_inference?.gpu_native) lines.push(`- AI GPU Native: ${item.ai_inference.gpu_native}`);
  if (item.ai_inference?.cpu_offload) lines.push(`- AI CPU Offload: ${item.ai_inference.cpu_offload}`);
  return lines.join("\n");
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
  card.dataset.assetName = (item.name || "").toLowerCase();
  card.dataset.assetKeywords = [
    item.name,
    item.cpu?.model,
    item.gpu,
    item.ram?.capacity,
    item.summary,
    item.summary_en,
    ...(item.workloads ?? [])
  ].filter(Boolean).join(" ").toLowerCase();

  const statusNote = lang === "en" ? (item.status_note_en || dict.status_chips[item.status] || item.status_note) : item.status_note;
  const roleLabel = lang === "en" ? (item.role_label_en || item.role_label) : item.role_label;
  const summary = lang === "en" ? (item.summary_en || item.summary) : item.summary;
  const constraint = lang === "en" ? (item.constraint_en || item.constraint) : item.constraint;

  const media = make("div", "node-media");
  const status = make("span", "status-chip", statusNote);
  media.append(status, makeImage(item.image_path, ""));

  const content = make("div", "node-content");

  const headerRow = make("div", "node-header-row");
  headerRow.append(make("p", "node-kicker", `${isPrimary ? "PRIMARY" : "BACKGROUND"} / ${roleLabel}`));

  const copyBtn = make("button", "copy-spec-btn");
  copyBtn.type = "button";
  copyBtn.setAttribute("aria-label", `${dict.copy_specs}: ${item.name}`);
  copyBtn.append(document.createTextNode("📋 " + dict.copy_specs));
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownSpec(item));
      showToast(dict.copied_toast);
      copyBtn.textContent = "✔ " + dict.copied_toast;
      setTimeout(() => {
        copyBtn.replaceChildren(document.createTextNode("📋 " + dict.copy_specs));
      }, 1800);
    } catch {
      showToast(dict.copied_toast);
    }
  });
  headerRow.append(copyBtn);

  content.append(headerRow, make("h3", null, item.name), make("p", "node-summary", summary));

  const workloads = make("ul", "workload-list");
  workloads.setAttribute("aria-label", dict.workloads_label);
  for (const workload of item.workloads ?? []) workloads.append(make("li", null, workload));
  content.append(workloads);

  // AI Inference Profile Block
  if (item.ai_inference) {
    const aiBlock = make("div", "ai-profile-block");
    aiBlock.append(make("p", "ai-profile-title", dict.ai_profile_title));
    const aiList = make("dl", "ai-profile-list");

    if (item.ai_inference.gpu_native) {
      const row = make("div", "ai-profile-row");
      row.append(make("dt", null, dict.ai_gpu_native), make("dd", null, item.ai_inference.gpu_native));
      aiList.append(row);
    }
    if (item.ai_inference.cpu_offload) {
      const row = make("div", "ai-profile-row");
      row.append(make("dt", null, dict.ai_cpu_offload), make("dd", null, item.ai_inference.cpu_offload));
      aiList.append(row);
    }
    if (item.ai_inference.vision_gen) {
      const row = make("div", "ai-profile-row");
      row.append(make("dt", null, dict.ai_vision), make("dd", null, item.ai_inference.vision_gen));
      aiList.append(row);
    }
    if (item.ai_inference.services || item.ai_inference.services_zh) {
      const row = make("div", "ai-profile-row");
      const sVal = lang === "zh" ? (item.ai_inference.services_zh || item.ai_inference.services) : item.ai_inference.services;
      row.append(make("dt", null, dict.ai_services), make("dd", null, sVal));
      aiList.append(row);
    }
    aiBlock.append(aiList);
    content.append(aiBlock);
  }

  // Runtime Environment Pills
  if (item.environment) {
    const envContainer = make("div", "env-pills");
    if (item.environment.runtime) envContainer.append(make("span", "env-pill", item.environment.runtime));
    if (item.environment.os) envContainer.append(make("span", "env-pill", item.environment.os));
    if (item.environment.networking) envContainer.append(make("span", "env-pill", item.environment.networking));
    content.append(envContainer);
  }

  content.append(makeSpecList(item));

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
  card.dataset.assetName = (item.name || "").toLowerCase();
  card.dataset.assetKeywords = [
    item.name,
    item.cpu?.model,
    item.gpu,
    item.summary,
    item.summary_en
  ].filter(Boolean).join(" ").toLowerCase();

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
  card.dataset.assetName = (item.name || "").toLowerCase();
  card.dataset.assetKeywords = [
    item.name,
    item.panel,
    item.use_case,
    item.use_case_en
  ].filter(Boolean).join(" ").toLowerCase();

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
  card.dataset.assetName = (item.name || "").toLowerCase();
  card.dataset.assetKeywords = [
    item.name,
    item.name_en,
    item.category,
    item.use_case,
    item.use_case_en
  ].filter(Boolean).join(" ").toLowerCase();

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
 * @param {string} lang - Current language.
 * @return {HTMLElement} article card element.
 */
function makePowerCard(item, lang) {
  const card = make("article", "power-card");
  card.id = item.id.toLowerCase();
  card.dataset.assetName = (item.name || "").toLowerCase();
  card.dataset.assetKeywords = [
    item.name,
    item.category,
    item.spec,
    item.spec_en
  ].filter(Boolean).join(" ").toLowerCase();

  const visual = make("div", "power-image");
  visual.append(makeImage(item.image_path, ""));

  const content = make("div", "power-content");
  content.append(make("h3", null, item.name));

  const specText = lang === "en" ? (item.spec_en || item.spec) : (item.spec || item.spec_en);
  if (specText) {
    content.append(make("span", "power-spec-badge", specText));
  }

  card.append(visual, content);
  return card;
}

/**
 * Create a workspace topology lane card.
 * @param {object} item - Topology entry.
 * @param {string} lang - Current language.
 * @return {HTMLElement} Lane card element.
 */
function makeTopologyCard(item, lang) {
  const card = make("div", "topology-lane-card");
  card.setAttribute("role", "listitem");

  const route = make("div", "topology-lane-route");
  route.append(
    make("span", "topology-source", item.source_name),
    make("span", "topology-arrow", "→"),
    make("span", "topology-target", item.target_name),
    make("span", "topology-interface", item.interface)
  );

  const purposeText = lang === "zh" ? (item.purpose_zh || item.purpose) : item.purpose;
  card.append(route, make("p", "topology-lane-purpose", purposeText));
  return card;
}

/**
 * Update all static document texts based on active language.
 * @param {string} lang - Language code ('en' | 'zh').
 */
function updateStaticTexts(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = dict.lang_code;
  document.documentElement.setAttribute("data-language", lang);
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

  const vramPill = byId("vram-hover-pill");
  if (vramPill) {
    vramPill.replaceChildren(make("span", null, dict.vram_hover));
  }

  // Filter chips labels
  if (byId("chip-all")) byId("chip-all").childNodes[0].nodeValue = dict.filter_all + " ";
  if (byId("chip-compute")) byId("chip-compute").childNodes[0].nodeValue = dict.filter_compute + " ";
  if (byId("chip-boundaries")) byId("chip-boundaries").childNodes[0].nodeValue = dict.filter_boundaries + " ";
  if (byId("chip-displays")) byId("chip-displays").childNodes[0].nodeValue = dict.filter_displays + " ";
  if (byId("chip-peripherals")) byId("chip-peripherals").childNodes[0].nodeValue = dict.filter_peripherals + " ";
  if (byId("chip-power")) byId("chip-power").childNodes[0].nodeValue = dict.filter_power + " ";

  const searchInput = byId("asset-search");
  if (searchInput) {
    searchInput.placeholder = dict.search_placeholder;
    searchInput.setAttribute("aria-label", dict.search_placeholder);
  }

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

  if (byId("topology-eyebrow")) byId("topology-eyebrow").textContent = dict.topology_eyebrow;
  if (byId("topology-title")) byId("topology-title").textContent = dict.topology_title;
  if (byId("topology-desc")) byId("topology-desc").textContent = dict.topology_desc;

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
  if (byId("export-json-btn")) byId("export-json-btn").textContent = dict.export_json;
  if (byId("export-md-btn")) byId("export-md-btn").textContent = dict.export_md;

  if (byId("back-to-top")) {
    byId("back-to-top").replaceChildren(
      document.createTextNode(dict.back_to_top + " "),
      make("span", null, "↑")
    );
  }

  const toggleBtn = byId("languageToggle");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-label", dict.lang_toggle_aria);
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
  byId("power-assets").replaceChildren(...data.power_assets.map((item) => makePowerCard(item, lang)));

  // Render workspace topology matrix
  if (byId("topology-lanes") && Array.isArray(data.workspace_topology)) {
    byId("topology-lanes").replaceChildren(...data.workspace_topology.map((t) => makeTopologyCard(t, lang)));
  }

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

  // Update counts in filter bar
  if (byId("count-all")) byId("count-all").textContent = String(2 + transferredCount + excludedCount + supportingCount);
  if (byId("count-compute")) byId("count-compute").textContent = String(active.length);
  if (byId("count-boundaries")) byId("count-boundaries").textContent = String(transferredCount + excludedCount);
  if (byId("count-displays")) byId("count-displays").textContent = String(data.display_assets.length);
  if (byId("count-peripherals")) byId("count-peripherals").textContent = String(data.peripherals.length);
  if (byId("count-power")) byId("count-power").textContent = String(data.power_assets.length);
}

/**
 * Filter assets by search query and category.
 * @param {string} query - Search keyword.
 */
function applySearchFilter(query) {
  const q = query.trim().toLowerCase();
  const allCards = document.querySelectorAll(
    "#active-nodes .node-card, #inactive-nodes .boundary-item, #display-assets .display-card, #peripheral-assets .compact-asset, #power-assets .power-card"
  );

  for (const card of allCards) {
    if (!q) {
      card.style.display = "";
      continue;
    }
    const kw = card.dataset.assetKeywords || "";
    const name = card.dataset.assetName || "";
    if (kw.includes(q) || name.includes(q)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  }

  const clearBtn = byId("search-clear");
  if (clearBtn) {
    clearBtn.hidden = !q;
  }
}

/**
 * Initialize search and filter console interactions.
 */
function initFilterConsole() {
  const searchInput = byId("asset-search");
  const clearBtn = byId("search-clear");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      applySearchFilter(e.target.value);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        applySearchFilter("");
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      applySearchFilter("");
    });
  }

  const chips = document.querySelectorAll(".filter-chip[data-filter]");
  for (const chip of chips) {
    chip.addEventListener("click", () => {
      for (const c of chips) {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      }
      chip.classList.add("active");
      chip.setAttribute("aria-selected", "true");

      const filter = chip.dataset.filter;
      const targetSectionId = {
        compute: "compute",
        boundaries: "boundaries",
        displays: "workspace",
        peripherals: "controls",
        power: "power"
      }[filter];

      if (targetSectionId) {
        const target = byId(targetSectionId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }
}

/**
 * Export registry data to JSON download.
 */
function exportJson() {
  if (!cachedData) return;
  const jsonStr = JSON.stringify(cachedData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = make("a");
  a.href = url;
  a.download = `sam-huang-hardware-registry-${cachedData.last_updated || "2026-09-25"}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(currentLang === "zh" ? "JSON 檔案已下載" : "JSON export downloaded");
}

/**
 * Export registry data to Markdown download.
 */
function exportMarkdown() {
  if (!cachedData) return;
  const lines = [
    `# Hardware Capability Registry · ${cachedData.inventory_owner || "Sam Huang"}`,
    `Last updated: ${cachedData.last_updated}`,
    "",
    "## Active Compute Pool",
    ...cachedData.hardware_registry
      .filter((h) => h.status === "active")
      .map((h) => `- **${h.name}** (${h.work_role}): ${h.cpu?.model} · ${h.ram?.capacity} RAM · ${gpuLabel(h)}`),
    "",
    "## Boundary Ledger (Transferred & Excluded)",
    ...cachedData.hardware_registry
      .filter((h) => h.status !== "active")
      .map((h) => `- **${h.name}** [${h.status}]: ${h.cpu?.model} · ${gpuLabel(h)}`),
    "",
    "## Displays",
    ...cachedData.display_assets.map((d) => `- **${d.name}**: ${d.panel} (${d.use_case_en || d.use_case})`),
    "",
    "## Peripherals & Controls",
    ...cachedData.peripherals.map((p) => `- **${p.name}** [${p.category}]: ${p.use_case_en || p.use_case}`),
    "",
    "## Power Layer",
    ...cachedData.power_assets.map((pw) => `- **${pw.name}** (${pw.category}): ${pw.spec_en || pw.spec || ""}`)
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = make("a");
  a.href = url;
  a.download = `sam-huang-hardware-registry-${cachedData.last_updated || "2026-09-25"}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(currentLang === "zh" ? "Markdown 檔案已下載" : "Markdown export downloaded");
}

/**
 * Initialize export buttons.
 */
function initExportButtons() {
  const jsonBtn = byId("export-json-btn");
  if (jsonBtn) jsonBtn.addEventListener("click", exportJson);

  const mdBtn = byId("export-md-btn");
  if (mdBtn) mdBtn.addEventListener("click", exportMarkdown);
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
    const searchInput = byId("asset-search");
    if (searchInput && searchInput.value) {
      applySearchFilter(searchInput.value);
    }
  }
}

/**
 * Initialize language toggle HUD button.
 */
function initLanguageSwitch() {
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

  const toggleBtn = byId("languageToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nextLang = currentLang === "en" ? "zh" : "en";
      switchLanguage(nextLang);
    });
  }

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
  initFilterConsole();
  initExportButtons();
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
