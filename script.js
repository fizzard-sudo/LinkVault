// LinkVault JavaScript

const appState = {
    searchTerm: '',
    filterMode: 'all',
    activeTag: ''
};

let links = [];
const storageKey = 'linkvault-links';

function normalizeLink(link) {
    return {
        id: link.id,
        title: link.title,
        url: link.url,
        tags: Array.isArray(link.tags) ? link.tags : [],
        isFavorite: Boolean(link.isFavorite ?? link.favorite)
    };
}

function loadLinksFromStorage() {
    try {
        const rawLinks = window.localStorage.getItem(storageKey);

        if (!rawLinks) {
            return [];
        }

        const parsedLinks = JSON.parse(rawLinks);
        return Array.isArray(parsedLinks) ? parsedLinks.map(normalizeLink) : [];
    } catch (error) {
        console.error('Failed to load links from localStorage', error);
        return [];
    }
}

function saveLinksToStorage() {
    window.localStorage.setItem(storageKey, JSON.stringify(links.map(normalizeLink)));
}

// ================================
// SECTION NAVIGATION
// ================================

const homeSection = document.getElementById('home');
const dashboardSection = document.getElementById('dashboard');
const landingSections = [
    homeSection,
    document.querySelector('.features-section'),
    document.querySelector('.how-it-works-section'),
    document.querySelector('.cta-section'),
    document.querySelector('footer')
].filter(Boolean);

const getStartedBtn = document.querySelector('.cta-button');
const getStartedBtnSecondary = document.querySelector('.cta-button-secondary');
const navLinks = document.querySelectorAll('.nav-links a');

function showSection(sectionId) {
    const showHome = sectionId === 'home';

    landingSections.forEach(section => {
        section.classList.toggle('hidden', !showHome);
    });

    dashboardSection.classList.toggle('hidden', showHome);
}

function goToHome() {
    showSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToDashboard() {
    showSection('dashboard');
    renderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
    links = loadLinksFromStorage();
    showSection('home');
    renderDashboard();
});

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', goToDashboard);
}

if (getStartedBtnSecondary) {
    getStartedBtnSecondary.addEventListener('click', goToDashboard);
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        if (href === '#home') {
            e.preventDefault();
            goToHome();
        } else if (href === '#dashboard') {
            e.preventDefault();
            goToDashboard();
        }
    });
});

// ================================
// DASHBOARD UI
// ================================

const dashboardContainer = document.querySelector('.dashboard-container');
const dashboardHeading = dashboardContainer ? dashboardContainer.querySelector('h2') : null;
const linkForm = document.querySelector('.add-link-form');
const linksContainer = document.querySelector('.links-container');
const searchInput = document.getElementById('search-links');

const dashboardUI = {
    totalCount: null,
    favoriteCount: null,
    statusText: null,
    filterButtons: new Map()
};

if (dashboardContainer && dashboardHeading && linkForm) {
    const toolbar = createDashboardToolbar();
    dashboardContainer.insertBefore(toolbar, linkForm);
}

function createDashboardToolbar() {
    const wrapper = document.createElement('div');
    wrapper.className = 'dashboard-toolbar';

    const stats = document.createElement('div');
    stats.className = 'dashboard-stats';

    const totalCard = createStatCard('Total Links', '0');
    const favoriteCard = createStatCard('Favorites', '0');

    dashboardUI.totalCount = totalCard.querySelector('[data-count="total"]');
    dashboardUI.favoriteCount = favoriteCard.querySelector('[data-count="favorites"]');

    stats.appendChild(totalCard);
    stats.appendChild(favoriteCard);

    const filterRow = document.createElement('div');
    filterRow.className = 'filter-bar';

    [
        { key: 'all', label: 'All' },
        { key: 'favorites', label: 'Favorites' },
        { key: 'tags', label: 'Tags' }
    ].forEach(filter => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-button';
        button.dataset.filter = filter.key;
        button.textContent = filter.label;
        button.addEventListener('click', () => setFilterMode(filter.key));
        dashboardUI.filterButtons.set(filter.key, button);
        filterRow.appendChild(button);
    });

    const status = document.createElement('p');
    status.className = 'dashboard-status';
    dashboardUI.statusText = status;

    wrapper.appendChild(stats);
    wrapper.appendChild(filterRow);
    wrapper.appendChild(status);

    return wrapper;
}

function createStatCard(label, value) {
    const card = document.createElement('div');
    card.className = 'stat-card';

    const labelEl = document.createElement('span');
    labelEl.className = 'stat-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('strong');
    valueEl.className = 'stat-value';
    valueEl.dataset.count = label === 'Total Links' ? 'total' : 'favorites';
    valueEl.textContent = value;

    card.appendChild(labelEl);
    card.appendChild(valueEl);
    return card;
}

// ================================
// LINK MANAGEMENT
// ================================

if (linkForm) {
    linkForm.addEventListener('submit', addLink);
}

if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
}

function addLink(event) {
    event.preventDefault();

    const titleInput = document.getElementById('link-title');
    const urlInput = document.getElementById('link-url');
    const tagsInput = document.getElementById('link-tags');

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const tags = parseTags(tagsInput.value);

    if (!title || !url) {
        alert('Please fill in both title and URL');
        return;
    }

    links.unshift({
        id: createLinkId(),
        title,
        url,
        tags,
        isFavorite: false
    });

    saveLinksToStorage();

    clearForm();
    appState.searchTerm = '';
    appState.activeTag = '';
    appState.filterMode = 'all';

    if (searchInput) {
        searchInput.value = '';
    }

    showToast('Link added successfully');
    renderDashboard();
}

function createLinkId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return String(Date.now() + Math.random());
}

function parseTags(rawTags) {
    if (!rawTags) {
        return [];
    }

    return rawTags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
}

function clearForm() {
    const titleInput = document.getElementById('link-title');
    const urlInput = document.getElementById('link-url');
    const tagsInput = document.getElementById('link-tags');

    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
    if (tagsInput) tagsInput.value = '';
}

function handleSearchInput(event) {
    appState.searchTerm = event.target.value.trim().toLowerCase();
    renderDashboard();
}

function setFilterMode(mode) {
    appState.filterMode = mode;

    if (mode !== 'tags') {
        appState.activeTag = '';
    }

    renderDashboard();
}

function setTagFilter(tag) {
    appState.filterMode = 'tags';
    appState.activeTag = tag.toLowerCase();
    renderDashboard();
}

function toggleFavorite(id) {
    links = links.map(link => {
        if (link.id !== id) {
            return link;
        }

        return {
            ...link,
            isFavorite: !link.isFavorite
        };
    });

    const updatedLink = links.find(link => link.id === id);
    if (updatedLink) {
        showToast(updatedLink.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    }

    saveLinksToStorage();
    renderDashboard();
}

function deleteLink(id) {
    links = links.filter(link => link.id !== id);
    saveLinksToStorage();
    showToast('Link deleted');
    renderDashboard();
}

function getVisibleLinks() {
    const searchTerm = appState.searchTerm;
    const activeTag = appState.activeTag;

    return links.filter(link => {
        const searchableText = [link.title, link.url, ...link.tags].join(' ').toLowerCase();
        const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

        const matchesFilter = (() => {
            if (appState.filterMode === 'favorites') {
                return link.isFavorite;
            }

            if (appState.filterMode === 'tags') {
                return link.tags.length > 0;
            }

            return true;
        })();

        const matchesTag = !activeTag || link.tags.some(tag => tag.toLowerCase() === activeTag);

        return matchesSearch && matchesFilter && matchesTag;
    });
}

function renderDashboard() {
    updateStats();
    updateFilterButtons();
    updateStatusText();

    if (!linksContainer) {
        return;
    }

    linksContainer.innerHTML = '';

    const visibleLinks = getVisibleLinks();

    if (links.length === 0) {
        linksContainer.appendChild(createEmptyState('No links yet. Start by adding your first link!'));
        return;
    }

    if (visibleLinks.length === 0) {
        linksContainer.appendChild(createEmptyState('No links match your current filters.'));
        return;
    }

    visibleLinks.forEach(link => {
        linksContainer.appendChild(createLinkCard(link));
    });
}

function updateStats() {
    const totalLinks = links.length;
    const favoriteLinks = links.filter(link => link.isFavorite).length;

    if (dashboardUI.totalCount) {
        dashboardUI.totalCount.textContent = totalLinks;
    }

    if (dashboardUI.favoriteCount) {
        dashboardUI.favoriteCount.textContent = favoriteLinks;
    }
}

function updateFilterButtons() {
    dashboardUI.filterButtons.forEach((button, key) => {
        const isActive = appState.filterMode === key;
        button.classList.toggle('active', isActive);
    });
}

function updateStatusText() {
    if (!dashboardUI.statusText) {
        return;
    }

    if (appState.activeTag) {
        dashboardUI.statusText.textContent = `Filtering by tag: ${appState.activeTag}`;
        return;
    }

    if (appState.filterMode === 'favorites') {
        dashboardUI.statusText.textContent = 'Showing favorite links only.';
        return;
    }

    if (appState.filterMode === 'tags') {
        dashboardUI.statusText.textContent = 'Showing links that have tags.';
        return;
    }

    dashboardUI.statusText.textContent = 'Showing all saved links.';
}

function createEmptyState(message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const heading = document.createElement('h3');
    heading.textContent = message;

    const description = document.createElement('p');
    description.textContent = 'Add a title, URL, and tags to start building your vault.';

    emptyState.appendChild(heading);
    emptyState.appendChild(description);
    return emptyState;
}

function createLinkCard(link) {
    const card = document.createElement('article');
    card.className = `link-card${link.isFavorite ? ' favorite' : ''}`;
    card.dataset.id = link.id;

    const header = document.createElement('div');
    header.className = 'link-card-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'link-card-title';
    titleEl.textContent = link.title;

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = `favorite-btn${link.isFavorite ? ' active' : ''}`;
    favoriteBtn.setAttribute('aria-pressed', String(link.isFavorite));
    favoriteBtn.setAttribute('aria-label', link.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteBtn.textContent = link.isFavorite ? '⭐' : '☆';
    favoriteBtn.addEventListener('click', () => toggleFavorite(link.id));

    header.appendChild(titleEl);
    header.appendChild(favoriteBtn);

    const urlEl = document.createElement('a');
    urlEl.className = 'link-card-url';
    urlEl.href = link.url;
    urlEl.target = '_blank';
    urlEl.rel = 'noopener noreferrer';
    urlEl.textContent = link.url;

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'link-card-tags';

    link.tags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.type = 'button';
        tagButton.className = 'tag tag-pill';
        tagButton.textContent = tag;
        tagButton.addEventListener('click', () => setTagFilter(tag));
        if (appState.activeTag === tag.toLowerCase()) {
            tagButton.classList.add('active');
        }
        tagsContainer.appendChild(tagButton);
    });

    const actions = document.createElement('div');
    actions.className = 'link-card-buttons';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(urlEl);

    if (link.tags.length > 0) {
        card.appendChild(tagsContainer);
    }

    card.appendChild(actions);
    return card;
}

// ================================
// TOASTS
// ================================

let toastContainer = null;

function ensureToastContainer() {
    if (toastContainer) {
        return toastContainer;
    }

    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
    return toastContainer;
}

function showToast(message) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2200);
}

console.log('LinkVault JavaScript loaded successfully');
