/*export const ProductView = {
  render(list, containerID) {
    const container = document.getElementById(containerID);
    if (!container) return;

    container.innerHTML = "";
    list.forEach(p => {
      container.innerHTML += `
        <div class="product-card">
          <img src="${p.img}" alt="${p.name}">
          <h4>${p.brand}</h4>
          <p>${p.name}</p>
          <div class="price">$${p.price}</div>
        </div>
      `;
    });
  }
};
*/

// /js/views/productViews.js
    export const ProductView = {
      render(list, containerID) {
        const container = document.getElementById(containerID);
        if (!container) return;

        container.innerHTML = "";

        list.forEach(p => {
          container.innerHTML += `
            <div class="product-card">
              <img src="${p.img}" alt="${p.name}" class="product-img">

              <div class="product-info">
                <span class="product-brand">${p.brand}</span>
                <p class="product-name">${p.name}</p>

                <div class="product-bottom">
                  <span class="product-price">$${p.price}</span>

                  <!-- cart icon on the right -->
                  <button class="product-cart-btn" data-id="${p.id}" aria-label="Add ${p.name} to cart">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
                        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="8" cy="17" r="1.2"></circle>
                      <circle cx="15" cy="17" r="1.2"></circle>
                      <path d="M1 1h3l2 10h11l1.6-6.5H6"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        });
      }
};
