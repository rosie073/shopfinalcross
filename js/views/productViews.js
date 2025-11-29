export const ProductView = {
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