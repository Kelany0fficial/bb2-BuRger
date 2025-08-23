// api.js
const api = {
  async load(path) {
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) throw new Error('فشل تحميل ' + path);
    return await r.json();
  }
};

// store.js
const CART_KEY = 'bb2-cart';
const FAV_KEY = 'bb2-favorites';
const store = {
  cart: JSON.parse(localStorage.getItem(CART_KEY) || '[]'),
  favorites: JSON.parse(localStorage.getItem(FAV_KEY) || '[]'),
  saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(this.cart)); },
  saveFavorites() { localStorage.setItem(FAV_KEY, JSON.stringify(this.favorites)); },
  addToCart(item) {
    this.cart.push(item);
    this.saveCart();
  },
  removeFromCart(i) {
    this.cart.splice(i, 1);
    this.saveCart();
  },
  updateQty(i, qty) {
    this.cart[i].qty = qty;
    this.saveCart();
  },
  clearCart() {
    this.cart = [];
    this.saveCart();
  },
  toggleFavorite(id) {
    const index = this.favorites.indexOf(id);
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(id);
    }
    this.saveFavorites();
  },
  isFavorite(id) {
    return this.favorites.includes(id);
  }
};

// pricing.js
function lineTotal(it) {
  const addonsTotal = (it.addons || []).reduce((s, a) => s + a.price, 0);
  const base = it.unitPrice;
  const combo = it.combo ? it.combo.extra : 0;
  return (base + addonsTotal + combo) * it.qty;
}
function cartTotal(cart) {
  return cart.reduce((s, it) => s + lineTotal(it), 0);
}

// formatters.js
const egp = n => `${n.toLocaleString('ar-EG')} ج`;
const encode = str => encodeURIComponent(str);

// Common functions
function showToast(msg) {
  const toast = document.querySelector('#toast');
  if (toast) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2000);
  }
}

function updateStickyCart() {
  const stickyCart = document.querySelector('#sticky-cart');
  if (stickyCart) {
    const count = store.cart.length;
    const total = cartTotal(store.cart);
    document.querySelector('#cart-count').textContent = `${count} عناصر`;
    document.querySelector('#cart-total').textContent = egp(total);
    stickyCart.style.display = count > 0 ? 'flex' : 'none';
  }
}

function createProductCard(item) {
  const card = document.createElement('div');
  card.classList.add('card', 'product');
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="flex">
      <img src="${item.image}" alt="${item.name}" width="120" height="120" loading="lazy">
      <div class="ml">
        <h3>${item.name}</h3>
        <p class="muted">${item.desc}</p>
        <div class="price">سينجل ${egp(item.price.single)} — دابل ${egp(item.price.double)}</div>
      </div>
    </div>
    <div class="flex actions">
      <button class="fav-btn ${store.isFavorite(item.id) ? 'favorited' : ''}" data-id="${item.id}">❤️</button>
      <button class="add-cart-btn" data-id="${item.id}">أضف للسلة</button>
    </div>
  `;

  card.addEventListener('click', e => {
    if (!e.target.classList.contains('fav-btn') && !e.target.classList.contains('add-cart-btn')) {
      window.location.href = `product.html?id=${item.id}`;
    }
  });
  return card;
}

// Load footer data
async function loadFooterData() {
  const settings = await api.load('settings.json');
  const addressEl = document.querySelector('#footer-address');
  const hoursEl = document.querySelector('#footer-hours');
  if (addressEl) addressEl.textContent = settings.address;
  if (hoursEl) hoursEl.textContent = settings.hours;
}

// Event listeners for fav and add
document.addEventListener('click', e => {
  if (e.target.classList.contains('fav-btn')) {
    const id = e.target.dataset.id;
    store.toggleFavorite(id);
    e.target.classList.toggle('favorited');
    showToast(store.isFavorite(id) ? 'أضيف للمفضلة' : 'أزيل من المفضلة');
    if (document.querySelector('#favorites-grid')) {
      loadFavorites();
    }
  }
  if (e.target.classList.contains('add-cart-btn')) {
    const id = e.target.dataset.id;
    window.location.href = `product.html?id=${id}`;
  }
  if (e.target.classList.contains('remove-fav-btn')) {
    const id = e.target.dataset.id;
    store.toggleFavorite(id);
    showToast('أزيل من المفضلة');
    loadFavorites();
  }
});

// Load logo
async function loadLogo() {
  const settings = await api.load('settings.json');
  const logoImgs = document.querySelectorAll('#logo-img');
  logoImgs.forEach(img => img.src = settings.logo);
}

// Load favorites
async function loadFavorites() {
  const items = await api.load('items.json');
  const categories = await api.load('categories.json');
  const grid = document.querySelector('#favorites-grid');
  const noFavorites = document.querySelector('#no-favorites');
  if (grid && noFavorites) {
    grid.innerHTML = '';
    const favoriteItems = items.filter(item => store.isFavorite(item.id));
    if (favoriteItems.length === 0) {
      noFavorites.style.display = 'block';
    } else {
      noFavorites.style.display = 'none';
      favoriteItems.forEach(item => {
        const card = createProductCard(item, categories);
        const favBtn = card.querySelector('.fav-btn');
        favBtn.classList.remove('fav-btn');
        favBtn.classList.add('remove-fav-btn');
        favBtn.innerHTML = '<i class="fas fa-trash"></i> إزالة';
        favBtn.title = 'إزالة من المفضلة';
        grid.appendChild(card);
      });
    }
  }
}

// Init based on page
if (document.querySelector('#featured-grid')) { // home.js
  (async () => {
    const settings = await api.load('settings.json');
    const items = await api.load('items.json');
    const grid = document.querySelector('#featured-grid');
    const count = settings.featuredCount || 6;
    items.filter(item => item.featured).slice(0, count).forEach(item => grid.appendChild(createProductCard(item)));

    // Banner slider
    const slider = document.querySelector('#banner-slider');
    if (slider && Array.isArray(settings.banners) && settings.banners.length > 0) {
      settings.banners.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Banner ${index + 1}`;
        if (index === 0) img.classList.add('active');
        slider.appendChild(img);
      });

      let current = 0;
      const animations = ['fadeIn', 'slideInLeft', 'zoomIn'];
      setInterval(() => {
        const imgs = slider.querySelectorAll('img');
        imgs.forEach(img => {
          img.classList.remove('active', ...animations);
        });
        current = (current + 1) % imgs.length;
        imgs[current].classList.add('active', animations[current % animations.length]);
      }, 2500);
    }

    updateStickyCart();
    window.addEventListener('storage', updateStickyCart);
    loadLogo();
    loadFooterData();
  })();
} else if (document.querySelector('#items-grid')) { // menu.js
  (async () => {
    const categories = await api.load('categories.json');
    const items = await api.load('items.json');

    const filters = document.querySelector('.filters');
    const allBtn = document.createElement('button');
    allBtn.classList.add('btn');
    allBtn.textContent = 'الكل';
    allBtn.addEventListener('click', () => filterItems('all'));
    filters.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.classList.add('btn');
      btn.textContent = cat.title;
      btn.addEventListener('click', () => filterItems(cat.id));
      filters.appendChild(btn);
    });

    const grid = document.querySelector('#items-grid');
    function filterItems(catId) {
      const filtered = catId === 'all' ? items : items.filter(i => i.category === catId);
      grid.innerHTML = '';
      filtered.forEach(item => grid.appendChild(createProductCard(item, categories)));
    }

    filterItems('all');

    updateStickyCart();
    window.addEventListener('storage', updateStickyCart);
    loadLogo();
    loadFooterData();
  })();
} else if (document.querySelector('#product-name')) { // product.js
  (async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return document.body.innerHTML = '<h1>منتج غير موجود</h1>';

    const items = await api.load('items.json');
    const addons = await api.load('addons.json');
    const combos = await api.load('combos.json');
    const item = items.find(i => i.id === id);
    if (!item) return document.body.innerHTML = '<h1>منتج غير موجود</h1>';

    document.querySelector('#product-name').textContent = item.name;
    document.querySelector('#product-image').src = item.image;
    document.querySelector('#product-image').alt = item.name;
    document.querySelector('#product-desc').textContent = item.desc;
    document.querySelector('#product-price').textContent = `سينجل ${egp(item.price.single)} — دابل ${egp(item.price.double)}`;

    const addonsList = document.querySelector('#addons-list');
    addons.forEach(addon => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" data-id="${addon.id}" data-price="${addon.price}"> ${addon.name} (+${egp(addon.price)})`;
      addonsList.appendChild(label);
    });

    const sizeSelect = document.querySelector('#size-select');
    const comboCheck = document.querySelector('#combo-check');
    const qty = document.querySelector('#qty');
    const totalPrice = document.querySelector('#total-price');
    const addBtn = document.querySelector('#add-to-cart');

    function updatePrice() {
      const size = sizeSelect.value;
      const basePrice = item.price[size];
      const comboExtra = comboCheck.checked ? combos[0].extra : 0;
      const addonsTotal = Array.from(addonsList.querySelectorAll('input:checked')).reduce((s, inp) => s + parseInt(inp.dataset.price), 0);
      const total = (basePrice + comboExtra + addonsTotal) * parseInt(qty.value);
      totalPrice.textContent = `السعر الإجمالي: ${egp(total)}`;
    }

    sizeSelect.addEventListener('change', updatePrice);
    comboCheck.addEventListener('change', updatePrice);
    qty.addEventListener('input', updatePrice);
    addonsList.addEventListener('change', updatePrice);
    updatePrice();

    addBtn.addEventListener('click', () => {
      const size = sizeSelect.value;
      const selectedAddons = Array.from(addonsList.querySelectorAll('input:checked')).map(inp => ({
        id: inp.dataset.id,
        name: addons.find(a => a.id === inp.dataset.id).name,
        price: parseInt(inp.dataset.price)
      }));
      const combo = comboCheck.checked ? combos[0] : null;
      const newItem = {
        id: item.id,
        name: item.name,
        size: size === 'single' ? 'سينجل' : 'دابل',
        unitPrice: item.price[size],
        qty: parseInt(qty.value),
        addons: selectedAddons,
        combo
      };
      store.addToCart(newItem);
      showToast('تمت الإضافة إلى السلة ✓');
      updateStickyCart();
    });

    updateStickyCart();
    loadLogo();
    loadFooterData();
  })();
} else if (document.querySelector('#cart-list')) { // cart.js (بدون دليفري)
  (async () => {
    const settings = await api.load('settings.json');
    const phone = settings.whatsapp;

    const name = document.querySelector('#name');
    const mobile = document.querySelector('#mobile');
    const address = document.querySelector('#address');
    const notes = document.querySelector('#notes');
    const payment = document.querySelector('#payment'); // لازم يتعرّف هنا
    const cartList = document.querySelector('#cart-list');
    const grandTotalEl = document.querySelector('#grand-total');

    function updateCart() {
      cartList.innerHTML = '';
      store.cart.forEach((it, i) => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `
          <h3>${it.name} - ${it.size}</h3>
          <p>إضافات: ${(it.addons || []).map(a => a.name).join(', ') || 'بدون'}</p>
          <p>كومبو: ${it.combo ? 'نعم' : 'لا'}</p>
          <label>الكمية: <input type="number" class="qty-input" data-i="${i}" value="${it.qty}" min="1"></label>
          <p>السعر: ${egp(lineTotal(it))}</p>
          <button class="btn btn-danger remove-btn" data-i="${i}">إزالة</button>
        `;
        cartList.appendChild(div);
      });

      const grand = cartTotal(store.cart);
      grandTotalEl.textContent = egp(grand);
    }

    cartList.addEventListener('click', e => {
      if (e.target.classList.contains('remove-btn')) {
        store.removeFromCart(e.target.dataset.i);
        updateCart();
      }
    });

    cartList.addEventListener('input', e => {
      if (e.target.classList.contains('qty-input')) {
        const i = e.target.dataset.i;
        const qty = parseInt(e.target.value);
        if (qty >= 1) {
          store.updateQty(i, qty);
          updateCart();
        }
      }
    });

    document.querySelector('#whatsapp-order').addEventListener('click', () => {
      const lines = [];
      lines.push(`*طلب جديد - ${settings.brand}*`);
      store.cart.forEach((it, idx) => {
        const addons = (it.addons || []).map(a => a.name).join('، ') || 'بدون إضافات';
        const combo = it.combo ? ` + كومبو` : '';
        lines.push(`${idx + 1}) ${it.name} - ${it.size}${combo} عدد (${it.qty})`);
        lines.push(`   إضافات: ${addons}`);
        lines.push(`   السعر: ${egp(lineTotal(it))}`);
      });
      lines.push(`—`);
      lines.push(`*المجموع*: ${egp(cartTotal(store.cart))}`);
      lines.push(`—`);
      lines.push(`الاسم: ${name.value}`);
      lines.push(`موبايل: ${mobile.value}`);
      lines.push(`العنوان: ${address.value}`);
      if (notes.value) lines.push(`ملاحظات: ${notes.value}`);
      lines.push(`*طريقة الدفع*: ${payment.value}`); // ✅ إضافة طريقة الدفع
      const msg = encode(lines.join('\n'));
      const url = `https://wa.me/${phone}?text=${msg}`;
      window.location.href = url;
      store.clearCart();
    });

    updateCart();
    loadLogo();
    loadFooterData();
  })();
} else if (document.querySelector('#favorites-grid')) { // favorites.js
  (async () => {
    updateStickyCart();
    window.addEventListener('storage', updateStickyCart);
    loadLogo();
    loadFooterData();
    loadFavorites();
  })();
}
