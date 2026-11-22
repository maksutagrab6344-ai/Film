

const API_URL = "https://v3-cinemeta.strem.io";

const search = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const movie = document.getElementById("movie");
const notFound = document.getElementById("notFound");
const libraryList = document.getElementById("libraryList");

const poster = movie.querySelector(".poster");
const title = movie.querySelector("h2");
const rating = movie.querySelector(".rating b");
const description = movie.querySelector(".description");
const movieLink = document.getElementById("movieLink");
const addButton = document.getElementById("addToLibrary");

let currentMovie = {
    id: "interstellar-demo",
    name: "Інтерстеллар",
    poster: poster.src,
    rating: "8.7",
    description: description.textContent.trim(),
    imdbUrl: movieLink.href
};

let library = [];

try {
    library = JSON.parse(localStorage.getItem("movieLibrary")) || [];
} catch (error) {
    library = [];
}

// Отримання даних
async function getJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Помилка HTTP ${response.status}`);
    }

    return response.json();
}

// Збереження бібліотеки
function saveLibrary() {
    localStorage.setItem("movieLibrary", JSON.stringify(library));
}

// Перевірка наявності фільму
function isInLibrary() {
    return library.some(item => item.id === currentMovie.id);
}

// Оновлення кнопки
function updateAddButton() {
    if (isInLibrary()) {
        addButton.textContent = "✓ Уже в бібліотеці";
        addButton.disabled = true;
    } else {
        addButton.textContent = "+ Додати до бібліотеки";
        addButton.disabled = false;
    }
}

// Відображення бібліотеки
function renderLibrary() {
    libraryList.replaceChildren();

    if (library.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-library";
        empty.textContent = "Тут поки немає фільмів";
        libraryList.appendChild(empty);
        return;
    }

    library.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "library-item";

        const img = document.createElement("img");
        img.className = "library-poster";
        img.src = item.poster || "";
        img.alt = `Постер ${item.name}`;
        img.addEventListener("click", () => openMovie(item));

        const info = document.createElement("div");
        info.className = "library-info";
        info.addEventListener("click", () => openMovie(item));

        const name = document.createElement("p");
        name.className = "library-title";
        name.textContent = item.name;

        const movieRating = document.createElement("p");
        movieRating.className = "library-rating";
        movieRating.textContent = `★ ${item.rating}`;

        info.append(name, movieRating);

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-button";
        removeBtn.textContent = "×";
        removeBtn.title = "Видалити з бібліотеки";

        removeBtn.addEventListener("click", () => {
            library.splice(index, 1);
            saveLibrary();
            renderLibrary();
            updateAddButton();
        });

        card.append(img, info, removeBtn);
        libraryList.appendChild(card);
    });
}

// Відображення фільму
function displayMovie(item) {
    currentMovie = item;

    title.textContent = item.name;
    rating.textContent = item.rating || "—";
    description.textContent = item.description || "Опису немає.";

    if (item.poster) {
        poster.src = item.poster;
        poster.alt = `Постер фільму «${item.name}»`;
        poster.style.display = "block";
    } else {
        poster.removeAttribute("src");
        poster.style.display = "none";
    }

    if (item.imdbUrl) {
        movieLink.href = item.imdbUrl;
        movieLink.style.display = "inline-block";
    } else {
        movieLink.style.display = "none";
    }

    movie.style.display = "block";
    notFound.style.display = "none";
    addButton.style.display = "block";

    updateAddButton();
}

// Відкриття фільму з бібліотеки
function openMovie(item) {
    displayMovie(item);
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Додавання до бібліотеки
addButton.addEventListener("click", () => {
    if (!currentMovie || isInLibrary()) return;

    library.push({ ...currentMovie });

    saveLibrary();
    renderLibrary();
    updateAddButton();
});

// Повідомлення
function showMessage(message) {
    movie.style.display = "none";
    addButton.style.display = "none";
    notFound.textContent = message;
    notFound.style.display = "block";
}

// Пошук фільму
async function searchMovie() {
    const name = search.value.trim();

    if (!name || searchBtn.disabled) return;

    searchBtn.disabled = true;
    showMessage("Шукаємо фільм...");

    try {
        const query = encodeURIComponent(name);

        const results = await getJson(
            `${API_URL}/catalog/movie/top/search=${query}.json`
        );

        const firstMovie = results.metas?.[0];

        if (!firstMovie) {
            showMessage("Фільм не знайдено 😕");
            return;
        }

        const { meta } = await getJson(
            `${API_URL}/meta/movie/${firstMovie.id}.json`
        );

        const foundMovie = {
            id: meta.id || firstMovie.id,
            name: meta.name || firstMovie.name,
            poster: meta.poster || firstMovie.poster || "",
            rating: meta.imdbRating || "—",
            description: meta.description || "Опису немає.",
            imdbUrl: meta.imdb_id
                ? `https://www.imdb.com/title/${meta.imdb_id}/`
                : ""
        };

        displayMovie(foundMovie);

    } catch (error) {
        console.error(error);
        showMessage("Не вдалося завантажити фільм. Спробуй ще раз.");

    } finally {
        searchBtn.disabled = false;
    }
}

// Кнопка пошуку
searchBtn.addEventListener("click", searchMovie);

// Пошук через Enter
search.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchMovie();
    }
});

// Початкове завантаження
renderLibrary();
updateAddButton();
