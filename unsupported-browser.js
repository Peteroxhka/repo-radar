(function () {
  function check() {
    if (document.documentElement.getAttribute("data-catalog-ready")==="true") return;
    var status = document.getElementById("status");
    if (!status) return;
    status.textContent = "Не удалось запустить каталог. Обнови страницу. / Could not start the catalog. Reload this page.";
    status.setAttribute("role", "alert");
    var grid = document.getElementById("grid");
    if (grid) grid.textContent = "";
  }
  window.addEventListener("load", check);
}());
