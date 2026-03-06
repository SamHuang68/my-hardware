document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            renderApp(data);
        })
        .catch(err => console.error('Error loading gear list:', err));
});

function renderApp(data) {
    const systemsGrid = document.getElementById('systems-grid');
    const displaysGrid = document.getElementById('displays-grid');
    const peripheralsGrid = document.getElementById('peripherals-grid');
    const powerGrid = document.getElementById('power-grid');

    // Systems
    data.hardware_registry.forEach((item, index) => {
        const card = createCard(item, 'System', index);
        systemsGrid.appendChild(card);
    });

    // Displays
    data.display_assets.forEach((item, index) => {
        const card = createCard({
            ...item,
            form_factor: 'Display',
            specs_list: [
                { label: 'Panel', value: item.panel }
            ]
        }, 'Display', index);
        displaysGrid.appendChild(card);
    });

    // Peripherals
    data.peripherals.forEach((item, index) => {
        const card = createCard({
            ...item,
            form_factor: item.category
        }, 'Peripheral', index);
        peripheralsGrid.appendChild(card);
    });

    // Power
    data.power_assets.forEach((item, index) => {
        const card = createCard({
            ...item,
            form_factor: item.category
        }, 'Power', index);
        powerGrid.appendChild(card);
    });

    // Update Footer
    document.getElementById('last-updated').textContent = data.last_updated;
}

function createCard(item, type, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;

    const imgPath = item.image_path || 'images/default.png';
    const fallbackSVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='%230a0c10'/><text x='50%' y='50%' fill='%23333' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12'>NO IMAGE</text></svg>`;

    let specsHtml = '';

    if (type === 'System') {
        const gpuStr = typeof item.gpu === 'object' ?
            `${item.gpu.internal} / ${item.gpu.external}` : item.gpu;

        specsHtml = `
            <ul class="specs">
                <li><strong>CPU</strong> <span>${item.cpu.model}</span></li>
                <li><strong>RAM</strong> <span>${item.ram.capacity} ${item.ram.spec || ''}</span></li>
                <li><strong>GPU</strong> <span>${gpuStr}</span></li>
                <li><strong>DISK</strong> <span>${item.storage.primary}</span></li>
                ${item.power_supply ? `<li><strong>PSU</strong> <span>${item.power_supply}</span></li>` : ''}
                ${item.motherboard ? `<li><strong>MOBO</strong> <span>${item.motherboard}</span></li>` : ''}
            </ul>
        `;
    } else if (item.specs_list) {
        specsHtml = `<ul class="specs">` +
            item.specs_list.map(s => `<li><strong>${s.label}</strong> <span>${s.value}</span></li>`).join('') +
            `</ul>`;
    }

    card.innerHTML = `
        <div class="badge">${item.form_factor || type}</div>
        <img src="${imgPath}" alt="${item.name}" onerror="this.src='${fallbackSVG}'">
        <h3>${item.name}</h3>
        ${specsHtml}
    `;

    return card;
}
