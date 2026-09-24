"use strict";

const DATA_URL = "data.json";

const byId = (id) => document.getElementById(id);

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

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

function gpuLabel(item) {
  if (typeof item.gpu === "string") return item.gpu;
  return [item.gpu?.external, item.gpu?.internal].filter(Boolean).join(" · ");
}

function specEntries(item) {
  return [
    ["CPU", [item.cpu?.model, item.cpu?.architecture].filter(Boolean).join(" · ")],
    ["RAM", [item.ram?.capacity, item.ram?.spec].filter(Boolean).join(" · ")],
    ["GPU", gpuLabel(item)],
    ["STORAGE", item.storage?.primary]
  ].filter(([, value]) => value);
}

function makeSpecList(item) {
  const list = make("dl", "spec-list");
  for (const [label, value] of specEntries(item)) {
    const row = make("div", "spec-row");
    row.append(make("dt", null, label), make("dd", null, value));
    list.append(row);
  }
  return list;
}

function makeNodeCard(item) {
  const isPrimary = item.work_role === "primary";
  const card = make("article", `node-card ${isPrimary ? "node-card-primary" : "node-card-secondary"}`);
  card.id = item.id.toLowerCase();

  const media = make("div", "node-media");
  const status = make("span", "status-chip", item.status_note);
  media.append(status, makeImage(item.image_path, ""));

  const content = make("div", "node-content");
  content.append(
    make("p", "node-kicker", `${isPrimary ? "PRIMARY" : "BACKGROUND"} / ${item.role_label}`),
    make("h3", null, item.name),
    make("p", "node-summary", item.summary)
  );

  const workloads = make("ul", "workload-list");
  workloads.setAttribute("aria-label", "適合工作");
  for (const workload of item.workloads ?? []) workloads.append(make("li", null, workload));
  content.append(workloads, makeSpecList(item));

  if (item.constraint) content.append(make("p", "constraint-note", item.constraint));
  card.append(media, content);
  return card;
}

const statusCopy = {
  transferred: { label: "TRANSFERRED / 已移交", note: "不在工作池" },
  excluded: { label: "EXCLUDED / 工作池排除", note: "散熱考量" }
};

function makeBoundaryItem(item) {
  const card = make("article", "boundary-item");
  card.id = item.id.toLowerCase();

  const thumb = make("div", "boundary-thumb");
  thumb.append(makeImage(item.image_path, ""));

  const main = make("div", "boundary-main");
  const state = make("div", "boundary-state");
  const copy = statusCopy[item.status] ?? { label: item.status, note: item.status_note };
  state.append(make("strong", null, copy.label), make("span", null, copy.note));
  main.append(state, make("h3", null, item.name), make("p", null, item.summary));

  const specs = make("div", "boundary-spec");
  const cpu = make("span");
  cpu.append(make("b", null, "CPU"), document.createTextNode(item.cpu?.model ?? "—"));
  const gpu = make("span");
  gpu.append(make("b", null, "GPU"), document.createTextNode(gpuLabel(item) || "—"));
  specs.append(cpu, gpu);

  card.append(thumb, main, specs);
  return card;
}

function makeDisplayCard(item, index) {
  const card = make("article", "display-card");
  card.id = item.id.toLowerCase();

  const visual = make("div", "display-image");
  visual.append(makeImage(item.image_path, ""));

  const content = make("div", "display-content");
  content.append(
    make("span", "asset-index", `DISPLAY / ${String(index + 1).padStart(2, "0")}`),
    make("h3", null, item.name),
    make("p", "display-panel", item.panel),
    make("p", "display-use", item.use_case)
  );
  card.append(visual, content);
  return card;
}

function makeCompactAsset(item) {
  const card = make("article", "compact-asset");
  card.id = item.id.toLowerCase();

  const visual = make("div", "compact-image");
  visual.append(makeImage(item.image_path, ""));

  const copy = make("div", "compact-copy");
  copy.append(
    make("span", "compact-category", item.category),
    make("h3", null, item.name),
    make("p", "compact-use", item.use_case)
  );
  card.append(visual, copy);
  return card;
}

function makePowerCard(item) {
  const card = make("article", "power-card");
  card.id = item.id.toLowerCase();
  const visual = make("div", "power-image");
  visual.append(makeImage(item.image_path, ""));
  card.append(visual, make("h3", null, item.name));
  return card;
}

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

function renderRegistry(data) {
  const { active, inactive } = validateRegistry(data);
  active.sort((a, b) => (a.work_role === "primary" ? -1 : 1) - (b.work_role === "primary" ? -1 : 1));

  const activeNodes = byId("active-nodes");
  activeNodes.replaceChildren(...active.map(makeNodeCard));

  const inactiveNodes = byId("inactive-nodes");
  inactiveNodes.replaceChildren(...inactive.map(makeBoundaryItem));

  byId("display-assets").replaceChildren(...data.display_assets.map(makeDisplayCard));
  byId("peripheral-assets").replaceChildren(...data.peripherals.map(makeCompactAsset));
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

  const transferredCount = data.hardware_registry.filter((item) => item.status === "transferred").length;
  const excludedCount = data.hardware_registry.filter((item) => item.status === "excluded").length;
  const supportingCount = data.display_assets.length + data.peripherals.length + data.power_assets.length;
  byId("footer-summary").textContent = `Active ${active.length} · Transferred ${transferredCount} · Excluded ${excludedCount} · Supporting ${supportingCount}`;
}

function renderFailure(error) {
  console.error("Hardware registry failed to load:", error);
  const message = "硬體清冊暫時無法讀取。請確認 data.json 與頁面位於同一目錄。";
  for (const id of ["active-nodes", "inactive-nodes", "display-assets", "peripheral-assets", "power-assets"]) {
    const target = byId(id);
    const alert = make("p", "error-state", message);
    alert.setAttribute("role", "alert");
    target.replaceChildren(alert);
  }
}

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
      if (entry.section.getBoundingClientRect().top <= threshold) current = entry.navId;
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

async function start() {
  initNavigation();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderRegistry(await response.json());
  } catch (error) {
    renderFailure(error);
  }
}

start();
