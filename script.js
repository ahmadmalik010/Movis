let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let commentsData = JSON.parse(localStorage.getItem('commentsData')) || {};
let customMovies = JSON.parse(localStorage.getItem('customMovies')) || [];
let currentMovie = null;

const moviesContainer = document.getElementById('moviesContainer');
const searchBox = document.getElementById('searchBox');
const modal = document.getElementById('movieModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalInfo = document.getElementById('modalInfo');
const modalDesc = document.getElementById('modalDesc');
const modalVideo = document.getElementById('modalVideo');
const videoContainer = document.getElementById('videoContainer');
const favBtn = document.getElementById('favBtn');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');
const addMovieModal = document.getElementById('addMovieModal');

let fallbackMovies = [];

// سیستەمی ڕێنمایی بۆ بەکارهێنەری نوێ کاتێک بۆ یەکەمجار لینکەکە دەكاتەوە
window.addEventListener('DOMContentLoaded', () => {
    let hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
        alert("بەخێر هاتیت بۆ سینەما پڵەس! 🎬\n\nڕێنمایی بەکارهێنان:\n١. بۆ زیادکردنی فیلم یان زنجیرە، کلیک لەسەر دوگمەی (➕ فیلمی نوێ) بکە لە سەرەوە.\n٢. ناوی فیلمەکە بنووسە یان پۆلێنێک هەڵبژێرە و لەوێوە فیلمەکان هەڵبژێرە.\n٣. فیلمەکان ڕاستەوخۆ لە سەرەتای ریزەکەدا پاشەکەوت دەبن بۆت!");
        localStorage.setItem('hasSeenGuide', 'true');
    }
});

// هەموو ١٢ سێرڤەرە سەرەکییەکە بۆ فیلم و زنجیرە
function getServers(imdbID, isSeries = false, season = 1, episode = 1) {
    const id = imdbID || 'tt0111161';
    
    if (isSeries) {
        return [
            { name: "سێرڤەری 1 (VidSrc Pro)", url: `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
            { name: "سێرڤەری 2 (VidSrc Net)", url: `https://vidsrc.net/embed/tv?imdb=${id}&season=${season}&episode=${episode}` },
            { name: "سێرڤەری 3 (VidSrc Me)", url: `https://vidsrc.me/embed/tv?imdb=${id}&season=${season}&episode=${episode}` },
            { name: "سێرڤەری 4 (VidSrc Icu)", url: `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}` },
            { name: "سێرڤەری 5 (VidSrc Vip)", url: `https://vidsrc.vip/embed/tv/${id}/${season}/${episode}` },
            { name: "سێرڤەری 6 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
            { name: "سێرڤەری 7 (AutoEmbed)", url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
            { name: "سێرڤەری 8 (2Embed)", url: `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` },
            { name: "سێرڤەری 9 (SmashyStream)", url: `https://player.smashystream.com/tv/${id}?s=${season}&e=${episode}` },
            { name: "سێرڤەری 10 (MoviesAPI)", url: `https://moviesapi.club/tv/${id}-${season}-${episode}` },
            { name: "سێرڤەری 11 (SuperEmbed)", url: `https://superembed.stream/embed/tv/?imdb=${id}&season=${season}&episode=${episode}` },
            { name: "سێرڤەری 12 (NerdEmbed)", url: `https://vidsrc.xyz/embed/tv?imdb=${id}&season=${season}&episode=${episode}` }
        ];
    } else {
        return [
            { name: "سێرڤەری 1 (VidSrc Pro)", url: `https://vidsrc.cc/v2/embed/movie/${id}` },
            { name: "سێرڤەری 2 (VidSrc Net)", url: `https://vidsrc.net/embed/movie?imdb=${id}` },
            { name: "سێرڤەری 3 (VidSrc Me)", url: `https://vidsrc.me/embed/${id}` },
            { name: "سێرڤەری 4 (VidSrc Icu)", url: `https://vidsrc.icu/embed/movie/${id}` },
            { name: "سێرڤەری 5 (VidSrc Vip)", url: `https://vidsrc.vip/embed/movie/${id}` },
            { name: "سێرڤەری 6 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
            { name: "سێرڤەری 7 (AutoEmbed)", url: `https://player.autoembed.cc/embed/movie/${id}` },
            { name: "سێرڤەری 8 (2Embed)", url: `https://www.2embed.cc/embed/${id}` },
            { name: "سێرڤەری 9 (SmashyStream)", url: `https://player.smashystream.com/movie/${id}` },
            { name: "سێرڤەری 10 (MoviesAPI)", url: `https://moviesapi.club/movie/${id}` },
            { name: "سێرڤەری 11 (SuperEmbed)", url: `https://superembed.stream/embed/movie/?imdb=${id}` },
            { name: "سێرڤەری 12 (NerdEmbed)", url: `https://vidsrc.xyz/embed/movie?imdb=${id}` }
        ];
    }
}

function loadFallbackDisplay() {
    let formattedCustom = customMovies.map(m => {
        let isSer = m.category === 'Series' || m.title.toLowerCase().includes('game of thrones') || m.title.toLowerCase().includes('season');
        return {
            ...m,
            servers: m.servers || getServers(m.imdbID, isSer)
        };
    });
    displayMovies(formattedCustom);
}

function fetchDefaultMovies(query = "action") {
    loadFallbackDisplay();
}

async function searchAutoFetchMovies(query) {
    if (!query || query.trim() === "") {
        loadFallbackDisplay();
        return;
    }

    if (query === "favorites") {
        displayFavorites();
        return;
    }

    let matched = customMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    displayMovies(matched);
}

function displayMovies(moviesList) {
    if(!moviesContainer) return;
    moviesContainer.innerHTML = '';
    if (!moviesList || moviesList.length === 0) {
        moviesContainer.innerHTML = '<p style="color:#777; text-align:center; grid-column:1/-1; margin-top:20px;">هیچ فیلمێک لێرە نییە، تکایە لە ڕێگەی دوگمەی (➕ فیلمی نوێ) فیلم زیاد بکە!</p>';
        return;
    }
    
    moviesList.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.onclick = () => openModal(movie);
        
        const posterUrl = (movie.image && movie.image !== "N/A" && movie.image.startsWith("http")) 
            ? movie.image 
            : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";
        
        card.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.year} • ⭐ ${movie.rating}</p>
            </div>
        `;
        moviesContainer.appendChild(card);
    });
}

function openAddMovieModal() {
    if(addMovieModal) addMovieModal.style.display = "block";
}

function closeAddMovieModal() {
    if(addMovieModal) addMovieModal.style.display = "none";
}

function translateKurdishToEnglish(text) {
    let t = text.trim().toLowerCase();
    const dictionary = {
        "باتمان": "batman",
        "پیاوی جاڵجاڵۆکە": "spider-man",
        "خێرا و تووڕە": "fast and furious",
        "جۆکەر": "joker",
        "گولە": "john wick",
        "تاریک": "dark",
        "خەیاڵی": "sci-fi",
        "ترسنۆک": "horror",
        "ئەکشن": "action",
        "ئەنیمەیشن": "animation",
        "تایتانیک": "titanic",
        "ماتریكس": "matrix",
        "گەیم ئۆف ثڕۆنز": "game of thrones",
        "game of throns": "game of thrones",
        "بریکینگ باد": "breaking bad"
    };
    return dictionary[t] || text;
}

let fetchedApiResults = [];
async function fetchMoviesByCategory(catName) {
    const resultsContainer = document.getElementById("apiSearchResults");
    try {
        resultsContainer.innerHTML = '<p style="color: #e50914; font-size: 11px; text-align: center;">خەریکی هێنانی فیلمە جیهانییەکانە...</p>';
        const apiKey = "trilogy";
        let keywords = [];

        if (catName === 'Action') {
            keywords = ["Fast", "Mission", "John Wick", "Avengers", "Batman", "Spider"];
        } else if (catName === 'Horror') {
            keywords = ["Conjuring", "Insidious", "Annabelle", "It", "Saw", "Exorcist"];
        } else if (catName === 'Animation') {
            keywords = ["Toy Story", "Frozen", "Moana", "Shrek", "Minions", "Cars"];
        }

        let combinedMovies = [];
        for (let kw of keywords) {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(kw)}`);
            const data = await res.json();
            if (data.Response === "True" && data.Search) {
                combinedMovies = [...combinedMovies, ...data.Search];
            }
        }

        let uniqueMovies = Array.from(new Set(combinedMovies.map(m => m.imdbID)))
            .map(id => combinedMovies.find(m => m.imdbID === id));

        if (uniqueMovies.length > 0) {
            fetchedApiResults = uniqueMovies;
            resultsContainer.innerHTML = '';
            uniqueMovies.forEach((movie, index) => {
                const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = "display: flex; align-items: center; gap: 10px; padding: 6px; border-bottom: 1px solid #222;";
                itemDiv.innerHTML = `
                    <input type="checkbox" value="${index}" style="width: 16px; height: 16px; cursor: pointer;">
                    <img src="${poster}" style="width: 30px; height: 45px; object-fit: cover; border-radius: 3px;">
                    <div style="flex: 1; font-size: 12px; color: #fff;">
                        <strong>${movie.Title}</strong> (${movie.Year})
                    </div>
                `;
                resultsContainer.appendChild(itemDiv);
            });
        } else {
            resultsContainer.innerHTML = '<p style="color: #777; font-size: 11px; text-align: center;">هیچ فیلمێک نەدۆزرایەوە.</p>';
        }
    } catch (err) {
        resultsContainer.innerHTML = '<p style="color: #e50914; font-size: 11px; text-align: center;">هەڵەیەک ڕووی دا.</p>';
    }
}

async function searchMoviesByQuery() {
    let rawTerm = document.getElementById("searchApiTitle").value.trim();
    const resultsContainer = document.getElementById("apiSearchResults");
    if (!rawTerm) return;

    const term = translateKurdishToEnglish(rawTerm);

    try {
        resultsContainer.innerHTML = '<p style="color: #e50914; font-size: 11px; text-align: center;">خەریکی هێنانی زنجیرە و فیلمەکانە...</p>';
        const apiKey = "trilogy";
        
        let searchQueries = [term];
        let tLower = term.toLowerCase();
        
        if (tLower.includes("game of thrones")) {
            searchQueries = ["Game of Thrones", "Game of Thrones Season"];
        } else if (tLower.includes("breaking bad")) {
            searchQueries = ["Breaking Bad", "Breaking Bad Season"];
        }

        let combinedMovies = [];
        for (let q of searchQueries) {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.Response === "True" && data.Search) {
                combinedMovies = [...combinedMovies, ...data.Search];
            }
        }

        let uniqueMovies = Array.from(new Set(combinedMovies.map(m => m.imdbID)))
            .map(id => combinedMovies.find(m => m.imdbID === id));

        if (uniqueMovies.length > 0) {
            fetchedApiResults = uniqueMovies;
            resultsContainer.innerHTML = '';
            uniqueMovies.forEach((movie, index) => {
                const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = "display: flex; align-items: center; gap: 10px; padding: 6px; border-bottom: 1px solid #222;";
                itemDiv.innerHTML = `
                    <input type="checkbox" value="${index}" style="width: 16px; height: 16px; cursor: pointer;">
                    <img src="${poster}" style="width: 30px; height: 45px; object-fit: cover; border-radius: 3px;">
                    <div style="flex: 1; font-size: 12px; color: #fff;">
                        <strong>${movie.Title}</strong> (${movie.Year}) - <span style="color:#f39c12;">${movie.Type === 'series' ? 'زنجیرە' : 'فیلم'}</span>
                    </div>
                `;
                resultsContainer.appendChild(itemDiv);
            });
        } else {
            resultsContainer.innerHTML = '<p style="color: #777; font-size: 11px; text-align: center;">هیچ ئەنجامێک نەدۆزرایەوە.</p>';
        }
    } catch (err) {
        resultsContainer.innerHTML = '<p style="color: #e50914; font-size: 11px; text-align: center;">هەڵەیەک ڕووی دا.</p>';
    }
}

async function searchMoviesByActor() {
    let rawActor = document.getElementById("searchActorInput").value.trim();
    const resultsContainer = document.getElementById("apiSearchResults");
    if (!rawActor) return;

    let actorName = rawActor.toLowerCase();
    if (actorName.includes("جیسۆن") || actorName.includes("ستەیسەم")) actorName = "jason statham";
    else if (actorName.includes("تۆم") || actorName.includes("کروز")) actorName = "tom cruise";
    else if (actorName.includes("لۆناردۆ") || actorName.includes("دیکابریۆ")) actorName = "leonardo dicaprio";
    else if (actorName.includes("کیانو") || actorName.includes("ریڤز")) actorName = "keanu reeves";

    try {
        resultsContainer.innerHTML = '<p style="color: #f39c12; font-size: 11px; text-align: center;">خەریکی گەڕان بەدوای فیلمەکانی ئەکتەر...</p>';
        
        const apiKey = "trilogy";
        let searchKeywords = [actorName];

        if (actorName.includes("jason statham")) {
            searchKeywords = ["Transporter", "Fast", "Meg", "Expendables", "Crank", "Mechanic"];
        } else if (actorName.includes("tom cruise")) {
            searchKeywords = ["Mission Impossible", "Top Gun", "Jack Reacher", "Edge of Tomorrow"];
        } else if (actorName.includes("leonardo")) {
            searchKeywords = ["Inception", "Titanic", "Interstellar", "Wolf of Wall Street"];
        } else if (actorName.includes("keanu")) {
            searchKeywords = ["John Wick", "Matrix", "Constantine"];
        }

        let combinedMovies = [];
        for (let kw of searchKeywords) {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(kw)}`);
            const data = await res.json();
            if (data.Response === "True" && data.Search) {
                combinedMovies = [...combinedMovies, ...data.Search];
            }
        }

        let uniqueMovies = Array.from(new Set(combinedMovies.map(m => m.imdbID)))
            .map(id => combinedMovies.find(m => m.imdbID === id));

        if (uniqueMovies.length > 0) {
            fetchedApiResults = uniqueMovies;
            resultsContainer.innerHTML = '';
            uniqueMovies.forEach((movie, index) => {
                const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = "display: flex; align-items: center; gap: 10px; padding: 6px; border-bottom: 1px solid #222;";
                itemDiv.innerHTML = `
                    <input type="checkbox" value="${index}" style="width: 16px; height: 16px; cursor: pointer;">
                    <img src="${poster}" style="width: 30px; height: 45px; object-fit: cover; border-radius: 3px;">
                    <div style="flex: 1; font-size: 12px; color: #fff;">
                        <strong>${movie.Title}</strong> (${movie.Year})
                    </div>
                `;
                resultsContainer.appendChild(itemDiv);
            });
        } else {
            resultsContainer.innerHTML = '<p style="color: #777; font-size: 11px; text-align: center;">هیچ فیلمێک بۆ ئەم ئەکتەرە نەدۆزرایەوە.</p>';
        }
    } catch (err) {
        resultsContainer.innerHTML = '<p style="color: #e50914; font-size: 11px; text-align: center;">هەڵەیەک ڕووی دا.</p>';
    }
}

function addSelectedMoviesToDisplay() {
    const checkboxes = document.querySelectorAll("#apiSearchResults input[type='checkbox']:checked");
    if (checkboxes.length === 0) {
        alert("تکایە لانیکەم فیلمێک هەڵبژێرە!");
        return;
    }

    checkboxes.forEach(chk => {
        const index = parseInt(chk.value);
        const movie = fetchedApiResults[index];
        if (movie) {
            let assignedCategory = "Action";
            let tLower = movie.Title.toLowerCase();
            
            if (tLower.includes("frozen") || tLower.includes("toy story") || tLower.includes("moana") || tLower.includes("shrek") || tLower.includes("avatar") || tLower.includes("animation") || tLower.includes("toons") || tLower.includes("disney") || tLower.includes("pixar") || tLower.includes("minions") || tLower.includes("cars")) {
                assignedCategory = "Animation";
            } else if (tLower.includes("conjuring") || tLower.includes("exorcist") || tLower.includes("it") || tLower.includes("insidious") || tLower.includes("nightmare") || tLower.includes("nun") || tLower.includes("annabelle") || tLower.includes("sinister") || tLower.includes("saw") || tLower.includes("halloween") || tLower.includes("scream") || tLower.includes("horror")) {
                assignedCategory = "Horror";
            } else if (tLower.includes("star") || tLower.includes("matrix") || tLower.includes("space") || tLower.includes("interstellar") || tLower.includes("arrival") || tLower.includes("contact") || tLower.includes("gravity") || tLower.includes("dune") || tLower.includes("blade runner")) {
                assignedCategory = "Sci-Fi";
            } else if (tLower.includes("game of thrones") || tLower.includes("breaking bad") || tLower.includes("season") || movie.Type === 'series') {
                assignedCategory = "Series";
            }

            let isSer = assignedCategory === 'Series';
            const newCustomMovie = {
                id: Date.now() + Math.random(),
                imdbID: movie.imdbID,
                title: movie.Title,
                category: assignedCategory,
                year: movie.Year,
                rating: "8.9/10",
                desc: `زنجیرە یان فیلمی جیهانی ${movie.Title} بەرهەمی ساڵی ${movie.Year}.`,
                image: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                servers: getServers(movie.imdbID, isSer)
            };
            // unshift بەکاردێت تاوەکو فیلمە نوێیەکان ببنە یەکەم لە ریزەکەدا
            customMovies.unshift(newCustomMovie);
        }
    });

    localStorage.setItem('customMovies', JSON.stringify(customMovies));
    closeAddMovieModal();
    document.getElementById("searchApiTitle").value = "";
    document.getElementById("searchActorInput").value = "";
    document.getElementById("apiSearchResults").innerHTML = '<p style="color: #777; font-size: 11px; text-align: center;">هیچ ئەنجامێک نییە...</p>';
    loadFallbackDisplay();
}

function deleteCurrentMovie() {
    if (!currentMovie) return;
    
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی فیلمی "${currentMovie.title}"؟`)) {
        return;
    }

    customMovies = customMovies.filter(m => m.id !== currentMovie.id);
    localStorage.setItem('customMovies', JSON.stringify(customMovies));

    favorites = favorites.filter(id => id !== currentMovie.id);
    localStorage.setItem('favorites', JSON.stringify(favorites));

    closeModal();
    loadFallbackDisplay();
}

function openModal(movie) {
    currentMovie = movie;
    modal.style.display = "block";
    
    modalImg.src = (movie.image && movie.image !== "N/A" && movie.image.startsWith("http")) 
        ? movie.image 
        : "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg";
    modalImg.style.display = "block";
    modalTitle.textContent = movie.title;
    modalInfo.textContent = `پۆلێن: ${movie.category || 'Action'} | ساڵ: ${movie.year} | هەڵسەنگاندن: ${movie.rating}`;
    modalDesc.textContent = movie.desc;
    
    videoContainer.style.display = "none";
    modalVideo.src = "";
    modalVideo.removeAttribute('sandbox');

    updateFavButtonText();
    loadComments();
    renderServersList();
}

function renderServersList() {
    let serversDiv = document.getElementById('serversSelection');
    if (!serversDiv) {
        serversDiv = document.createElement('div');
        serversDiv.id = 'serversSelection';
        serversDiv.style.cssText = "margin: 10px 0; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;";
        const playBtn = document.getElementById('watchBtn') || document.querySelector("button[onclick*='playTrailer']");
        if (playBtn) {
            playBtn.parentNode.insertBefore(serversDiv, playBtn.nextSibling);
        }
    }

    serversDiv.innerHTML = '';
    
    let isSeries = currentMovie.category === 'Series' || currentMovie.title.toLowerCase().includes('game of thrones') || currentMovie.title.toLowerCase().includes('season');
    let currentSeason = document.getElementById('selectSeason') ? document.getElementById('selectSeason').value : 1;
    let currentEpisode = document.getElementById('selectEpisode') ? document.getElementById('selectEpisode').value : 1;
    
    let id = currentMovie.imdbID || 'tt0944947';
    let sList = getServers(id, isSeries, currentSeason, currentEpisode);

    sList.forEach((server) => {
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = "display: flex; gap: 3px; align-items: center;";

        const btn = document.createElement('button');
        btn.innerHTML = server.name;
        btn.style.cssText = "background: #222; color: #fff; border: 1px solid #e50914; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;";
        
        btn.onclick = () => {
            playServer(server.url);
        };

        btnGroup.appendChild(btn);

        if (isSeries) {
            const extBtn = document.createElement('a');
            extBtn.href = server.url;
            extBtn.target = "_blank";
            extBtn.innerHTML = "▶ VLC";
            extBtn.title = "کردنەوە لە ئەپی VLC";
            extBtn.style.cssText = "background: #e50914; color: #fff; padding: 6px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold;";
            
            extBtn.onclick = (e) => {
                let confirmVlc = confirm("بۆ باشتر کارکردنی زنجیرەکە، پێویستە ئەپی VLCت هەبێت. ئایا ئەپەکەت دابەزاندووە؟\n\nئەگەر نا، دایبگرە!");
                if (!confirmVlc) {
                    e.preventDefault();
                    window.open("https://www.videolan.org/vlc/", "_blank");
                }
            };

            btnGroup.appendChild(extBtn);
        }

        serversDiv.appendChild(btnGroup);
    });

    if (isSeries) {
        let seasonSelectorHtml = `
            <div style="width: 100%; display: flex; gap: 5px; justify-content: center; margin-top: 10px;">
                <select id="selectSeason" onchange="renderServersList()" style="background: #222; color: #fff; padding: 5px; border: 1px solid #e50914; border-radius: 4px;">
                    <option value="1" ${currentSeason == 1 ? 'selected' : ''}>وەرزی 1</option>
                    <option value="2" ${currentSeason == 2 ? 'selected' : ''}>وەرزی 2</option>
                    <option value="3" ${currentSeason == 3 ? 'selected' : ''}>وەرزی 3</option>
                    <option value="4" ${currentSeason == 4 ? 'selected' : ''}>وەرزی 4</option>
                    <option value="5" ${currentSeason == 5 ? 'selected' : ''}>وەرزی 5</option>
                    <option value="6" ${currentSeason == 6 ? 'selected' : ''}>وەرزی 6</option>
                    <option value="7" ${currentSeason == 7 ? 'selected' : ''}>وەرزی 7</option>
                    <option value="8" ${currentSeason == 8 ? 'selected' : ''}>وەرزی 8</option>
                </select>
                <select id="selectEpisode" onchange="renderServersList()" style="background: #222; color: #fff; padding: 5px; border: 1px solid #e50914; border-radius: 4px;">
                    <option value="1" ${currentEpisode == 1 ? 'selected' : ''}>ئەڵقەی 1</option>
                    <option value="2" ${currentEpisode == 2 ? 'selected' : ''}>ئەڵقەی 2</option>
                    <option value="3" ${currentEpisode == 3 ? 'selected' : ''}>ئەڵقەی 3</option>
                    <option value="4" ${currentEpisode == 4 ? 'selected' : ''}>ئەڵقەی 4</option>
                    <option value="5" ${currentEpisode == 5 ? 'selected' : ''}>ئەڵقەی 5</option>
                    <option value="6" ${currentEpisode == 6 ? 'selected' : ''}>ئەڵقەی 6</option>
                    <option value="7" ${currentEpisode == 7 ? 'selected' : ''}>ئەڵقەی 7</option>
                    <option value="8" ${currentEpisode == 8 ? 'selected' : ''}>ئەڵقەی 8</option>
                    <option value="9" ${currentEpisode == 9 ? 'selected' : ''}>ئەڵقەی 9</option>
                    <option value="10" ${currentEpisode == 10 ? 'selected' : ''}>ئەڵقەی 10</option>
                </select>
            </div>
        `;
        serversDiv.innerHTML += seasonSelectorHtml;
    }
}

function playServer(url) {
    modalImg.style.display = "none";
    videoContainer.style.display = "block";
    
    modalVideo.removeAttribute('sandbox');
    modalVideo.src = url;

    let shield = document.getElementById('clickShield');
    if (!shield) {
        shield = document.createElement('div');
        shield.id = 'clickShield';
        shield.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; background: transparent;";
        videoContainer.style.position = "relative";
        videoContainer.appendChild(shield);

        shield.onclick = function() {
            shield.style.pointerEvents = "none";
        };
    } else {
        shield.style.pointerEvents = "auto";
        shield.style.display = "block";
    }
}

function playTrailer() {
    let isSeries = currentMovie.category === 'Series' || currentMovie.title.toLowerCase().includes('game of thrones');
    let sList = getServers(currentMovie.imdbID, isSeries);
    if (sList.length > 0) {
        playServer(sList[0].url);
    }
}

function closeModal() {
    modal.style.display = "none";
    modalVideo.src = "";
    modalVideo.removeAttribute('sandbox');
    const serversDiv = document.getElementById('serversSelection');
    if (serversDiv) serversDiv.innerHTML = '';
    const shield = document.getElementById('clickShield');
    if (shield) {
        shield.style.display = "none";
        shield.style.pointerEvents = "auto";
    }
}

function toggleFavorite() {
    const index = favorites.findIndex(id => id === currentMovie.id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(currentMovie.id);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavButtonText();
}

function displayFavorites() {
    let favList = customMovies.filter(m => favorites.includes(m.id));
    displayMovies(favList);
}

function updateFavButtonText() {
    const isFav = favorites.includes(currentMovie.id);
    favBtn.textContent = isFav ? "⭐ لادان لە دڵخوازەکان" : "⭐ زیادکردن بۆ دڵخوازەکان";
    favBtn.style.backgroundColor = isFav ? "#e50914" : "#333";
}

function loadComments() {
    commentsList.innerHTML = '';
    const mComments = commentsData[currentMovie.id] || [];
    if (mComments.length === 0) {
        commentsList.innerHTML = '<p style="color:#777; text-align:center; margin:5px 0;">هیچ تێبینییەک نییە</p>';
        return;
    }
    mComments.forEach(c => {
        const div = document.createElement('div');
        div.classList.add('comment-item');
        div.textContent = c;
        commentsList.appendChild(div);
    });
}

function addComment() {
    const text = commentInput.value.trim();
    if (!text) return;
    
    if (!commentsData[currentMovie.id]) {
        commentsData[currentMovie.id] = [];
    }
    commentsData[currentMovie.id].push(text);
    localStorage.setItem('commentsData', JSON.stringify(commentsData));
    
    commentInput.value = '';
    loadComments();
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == addMovieModal) closeAddMovieModal();
}

function filterCategory(category) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');

    if (category === 'all') {
        loadFallbackDisplay();
    } else if (category === 'favorites') {
        displayFavorites();
    } else if (category === 'Series') {
        let seriesFiltered = customMovies.filter(m => {
            let cat = m.category ? m.category.trim().toLowerCase() : "";
            let title = m.title ? m.title.toLowerCase() : "";
            return cat === 'series' || title.includes('game of thrones') || title.includes('breaking bad') || title.includes('season') || title.includes('series');
        });
        displayMovies(seriesFiltered);
    } else {
        let filtered = customMovies.filter(m => {
            let cat = m.category ? m.category.trim().toLowerCase() : "";
            let title = m.title ? m.title.toLowerCase() : "";
            
            if (category.toLowerCase() === 'animation') {
                return cat === 'animation' || title.includes('toy story') || title.includes('frozen') || title.includes('moana') || title.includes('shrek') || title.includes('avatar') || title.includes('toons') || title.includes('disney') || title.includes('pixar') || title.includes('minions') || title.includes('cars');
            } else if (category.toLowerCase() === 'horror') {
                return cat === 'horror' || title.includes('conjuring') || title.includes('exorcist') || title.includes('it') || title.includes('insidious') || title.includes('saw');
            } else if (category.toLowerCase() === 'sci-fi') {
                return cat === 'sci-fi' || title.includes('interstellar') || title.includes('matrix') || title.includes('dune');
            }
            
            return cat === category.trim().toLowerCase();
        });
        displayMovies(filtered);
    }
}

let searchTimeout;
searchBox.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const term = e.target.value.trim();
    
    searchTimeout = setTimeout(() => {
        searchAutoFetchMovies(term);
    }, 500);
});

loadFallbackDisplay();
