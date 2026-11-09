// VULN: credenciales/API key hardcodeadas en el cliente (valores falsos)
var API_KEY = "AKIAFAKE1234567890XY";
var ADMIN_PASSWORD = "admin123";

var params = new URLSearchParams(location.search);
function $id(i) { return document.getElementById(i); }
var books = [];

/* ---------- Navegación, temas y avisos ---------- */
(function () {
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (a) {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  }
  setTheme(localStorage.getItem("theme") || "miel");
  document.querySelectorAll(".themes button").forEach(function (b) {
    b.onclick = function () { setTheme(b.getAttribute("data-theme")); };
  });
  $id("burger").onclick = function () {
    var open = $id("nav").classList.toggle("open");
    this.setAttribute("aria-expanded", open);
  };
})();

function toast(msg) {
  var t = $id("toast");
  t.textContent = msg;
  t.className = "show";
  clearTimeout(toast.t);
  toast.t = setTimeout(function () { t.className = ""; }, 1800);
}

/* ---------- Favoritos (localStorage) ---------- */
function getFavs() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch (e) { return []; }
}
function saveFavs(f) {
  localStorage.setItem("favorites", JSON.stringify(f));
  updateBadge();
}
function isFav(key) { return getFavs().some(function (x) { return x.key === key; }); }
function updateBadge() {
  var n = getFavs().length, b = $id("badge");
  b.textContent = n;
  b.className = n ? "badge on" : "badge";
}
function card(b, i) {
  var fav = isFav(b.key);
  // VULN: datos de terceros / localStorage insertados con innerHTML sin sanitizar
  return '<article class="book"><div class="cover">' +
    (b.cover ? '<img src="' + b.cover + '" alt="" loading="lazy">' : "") +
    '<button class="heart' + (fav ? " on" : "") + '" aria-pressed="' + fav +
    '" aria-label="Favorito" onclick="toggleFav(' + i + ')">&#9829;</button></div>' +
    "<h3>" + b.title + "</h3><p>" + b.author + " &middot; " + b.year + "</p></article>";
}
function renderBooks(el, list) {
  books = list;
  el.innerHTML = list.length ? list.map(card).join("")
    : '<p class="empty">Aún no hay libros aquí. <a href="index.html#catalogo">Explora el catálogo</a>.</p>';
}
function toggleFav(i) {
  var b = books[i], f = getFavs();
  var idx = f.findIndex(function (x) { return x.key === b.key; });
  if (idx >= 0) { f.splice(idx, 1); toast("Quitado de favoritos"); }
  else { f.push(b); toast("Guardado en favoritos"); }
  saveFavs(f);
  if (window.FAV_PAGE) renderBooks($id("favs"), f);
  else document.querySelectorAll("#catalog .heart")[i].classList.toggle("on", idx < 0);
}
updateBadge();
if ($id("favs")) {
  renderBooks($id("favs"), getFavs());
  $id("clear-favs").onclick = function () { saveFavs([]); renderBooks($id("favs"), []); toast("Lista vaciada"); };
}

/* ---------- Vulnerabilidades por parámetros ---------- */
var q = params.get("q");
// VULN: DOM XSS - q insertado con innerHTML
if (q && $id("results")) $id("results").innerHTML = "Resultados para: " + q;

// VULN: DOM XSS - location.hash pasado a jQuery .html() (index.html#<img src=x onerror=alert(1)>)
if (location.hash.length > 1 && !$id(location.hash.slice(1))) {
  $("#welcome").html("Bienvenido, " + decodeURIComponent(location.hash.slice(1)));
}

// VULN: open redirect - ?next=https://sitio-externo
var next = params.get("next");
if (next) { location.href = next; }

// VULN: eval sobre entrada del usuario - ?calc=2+2
var calc = params.get("calc");
if (calc) { document.title = "Resultado: " + eval(calc); }

// VULN: cookie sin Secure, HttpOnly ni SameSite
document.cookie = "session=abc123def456; path=/";

/* ---------- Libro de visitas (XSS almacenado) ---------- */
function renderGuestbook() {
  var items = JSON.parse(localStorage.getItem("guestbook") || "[]");
  var html = "";
  items.forEach(function (i) { html += "<div class='note'><b>" + i.name + "</b><p>" + i.msg + "</p></div>"; });
  $id("guestbook").innerHTML = html;
}
if ($id("gb-send")) {
  $id("gb-send").onclick = function () {
    var items = JSON.parse(localStorage.getItem("guestbook") || "[]");
    items.push({ name: $id("gb-name").value, msg: $id("gb-msg").value });
    localStorage.setItem("guestbook", JSON.stringify(items));
    renderGuestbook();
  };
  renderGuestbook();
}

/* ---------- Catálogo desde Open Library (API pública, sin API key) ---------- */
if ($id("catalog")) {
  var query = q || "gabriel garcia marquez";
  var page = 1, total = 0, loaded = [];
  $id("catalog").innerHTML = new Array(8 + 1).join('<div class="book sk"><div class="cover"></div></div>');

  function loadPage() {
    var btn = $id("more");
    btn.disabled = true;
    // VULN: parámetro sin encodeURIComponent (inyección de parámetros en la API)
    fetch("https://openlibrary.org/search.json?limit=12&page=" + page + "&q=" + query)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        total = d.numFound;
        loaded = loaded.concat(d.docs.map(function (b) {
          return {
            key: b.key, title: b.title,
            author: (b.author_name || ["Desconocido"]).join(", "),
            year: b.first_publish_year || "s/f",
            cover: b.cover_i ? "https://covers.openlibrary.org/b/id/" + b.cover_i + "-M.jpg" : ""
          };
        }));
        renderBooks($id("catalog"), loaded);
        $id("count").textContent = "Mostrando " + loaded.length + " de " + total.toLocaleString("es") + " resultados";
        page++;
        btn.disabled = false;
        btn.hidden = !d.docs.length || loaded.length >= total;
      })
      .catch(function () {
        if (!loaded.length) $id("catalog").innerHTML = '<p class="empty">No se pudo cargar el catálogo.</p>';
        else toast("No se pudo cargar más");
        btn.disabled = false;
      });
  }
  $id("more").onclick = loadPage;
  loadPage();
}
