const productsEl = document.getElementById("products");
const cartEl = document.getElementById("cartContent");
const cartPill = document.getElementById("cartPill");
const clearCartBtn = document.getElementById("clearCartBtn");

/**
 * Generic API helper
 * - Sends JSON requests
 * - Throws an error if response is not OK
 */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // If backend returns an error, capture it properly
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Load and render products
 */
async function loadProducts() {
  try {
    const products = await api("/api/products");

    productsEl.innerHTML = products
      .map(
        (p) => `
      <article class="card">
        <img src="${p.image_url}" alt="${p.name}" />
        <div class="content">
          <h3>${p.name}</h3>
          <p class="price">$${Number(p.price).toFixed(2)}</p>
          <button class="btn" data-add="${p.id}">Add to cart</button>
        </div>
      </article>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Failed to load products:", err);

    // User-facing fallback UI
    productsEl.innerHTML = `
      <p class="muted">
        Failed to load products. Please refresh the page.
      </p>
    `;
  }
}

/**
 * Add product to cart (event delegation)
 * - Uses event bubbling to handle all buttons in one listener
 */
productsEl.addEventListener("click", async (e) => {
  try {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;

    const productId = Number(btn.dataset.add);

    await api("/api/cart", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    });

    await refreshCart();
  } catch (err) {
    console.error("Add to cart failed:", err);
    alert("Could not add item to cart.");
  }
});

/**
 * Fetch and render cart
 * - Also updates cart count pill
 */
async function refreshCart() {
  try {
    const items = await api("/api/cart");

    // Total item count
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    if (cartPill) {
      cartPill.textContent = `Cart • ${count} item${count === 1 ? "" : "s"}`;
    }

    // Empty cart UI
    if (items.length === 0) {
      cartEl.innerHTML = "<p class='muted'>Cart is empty</p>";
      return;
    }

    // Calculate total price
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Render cart items
    cartEl.innerHTML = `
      ${items
        .map(
          (i) => `
        <div class="cartRow">
          <span>${i.name}</span>
          <span>${i.quantity} × $${i.price}</span>
          <button data-inc="${i.cart_item_id}">+</button>
          <button data-dec="${i.cart_item_id}">-</button>
          <button data-del="${i.cart_item_id}">Remove</button>
        </div>
      `,
        )
        .join("")}
      <hr/>
      <strong>Total: $${total.toFixed(2)}</strong>
    `;
  } catch (err) {
    console.error("Failed to refresh cart:", err);

    // Fallback UI if cart fails to load
    cartEl.innerHTML = `
      <p class="muted">Failed to load cart</p>
    `;
  }
}

/**
 * Handle cart button clicks (+, -, remove)
 * Uses event delegation for dynamic content
 */
cartEl.addEventListener("click", async (e) => {
  try {
    const inc = e.target.dataset.inc;
    const dec = e.target.dataset.dec;
    const del = e.target.dataset.del;

    // Increase quantity
    if (inc) {
      const items = await api("/api/cart");
      const item = items.find((i) => i.cart_item_id == inc);
      if (!item) return;

      await api(`/api/cart/${inc}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: item.quantity + 1 }),
      });

      await refreshCart();
    }

    // Decrease quantity OR remove if 1
    if (dec) {
      const items = await api("/api/cart");
      const item = items.find((i) => i.cart_item_id == dec);
      if (!item) return;

      if (item.quantity > 1) {
        await api(`/api/cart/${dec}`, {
          method: "PUT",
          body: JSON.stringify({ quantity: item.quantity - 1 }),
        });
      } else {
        await api(`/api/cart/${dec}`, { method: "DELETE" });
      }

      await refreshCart();
    }

    // Remove item completely
    if (del) {
      await api(`/api/cart/${del}`, { method: "DELETE" });
      await refreshCart();
    }
  } catch (err) {
    console.error("Cart action failed:", err);
    alert("Something went wrong with the cart.");
  }
});

/**
 * Clear entire cart
 * - Uses Promise.all for parallel deletion (faster)
 */
if (clearCartBtn) {
  clearCartBtn.addEventListener("click", async () => {
    if (!confirm("Clear all items from cart?")) return;

    try {
      const items = await api("/api/cart");

      // Delete all items in parallel
      await Promise.all(
        items.map((it) =>
          api(`/api/cart/${it.cart_item_id}`, { method: "DELETE" }),
        ),
      );

      await refreshCart();
    } catch (err) {
      console.error(err);
      alert("Could not clear cart.");
    }
  });
}

/**
 * App entry point
 * - Loads products and cart on startup
 */
async function init() {
  try {
    await loadProducts();
    await refreshCart();
  } catch (err) {
    console.error("Init failed:", err);
    alert("Failed to initialize app.");
  }
}

init();