var themes = {
    anime: {
        name: 'Anime',
        difficulty: 'Easy',
        folder: 'anime',
        ext: 'jpeg',
        pairs: 8
    },
    gta6: {
        name: 'GTA 6',
        difficulty: 'Hard',
        folder: 'GTA6',
        ext: 'jpg',
        pairs: 12
    },
    memes: {
        name: 'Memes',
        difficulty: 'Hard',
        folder: 'Memes(hard)',
        ext: 'jpeg',
        pairs: 12,
        timed: true, 
        timeLimit: 90 
    }
};

var cards = [];        
var flippedCards = [];  
var matchedPairs = 0;    
var moveCount = 0;       
var totalPairs = 8;     
var isLocked = false;    
var currentTheme = null; 
var timerInterval = null; 
var timeRemaining = 0;    

function shuffle(array) {
    var shuffled = array.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

// ---------- START SCREEN ----------
function renderThemeButtons() {
    var grid = document.getElementById('themeGrid');
    grid.innerHTML = '';
    for (var key in themes) {
        if (!themes.hasOwnProperty(key)) continue; 
        var theme = themes[key];

        var btn = document.createElement('button');
        btn.className = 'theme-btn';
        btn.innerHTML =
            '<span class="theme-btn-name">' + theme.name + '</span>' +
            '<span class="theme-btn-meta">' + theme.difficulty + ' &middot; ' + theme.pairs + ' pairs</span>';

        (function (themeKey) {
            btn.addEventListener('click', function () {
                selectTheme(themeKey);
            });
        })(key);

        grid.appendChild(btn);
    }
}

function selectTheme(themeKey) {
    currentTheme = themes[themeKey];
    totalPairs = currentTheme.pairs;

    document.getElementById('activeThemeTitle').textContent = 'Memory Match - ' + currentTheme.name;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.querySelector('.game-container').classList.add('in-game');
    var grid = document.getElementById('cardGrid');
    grid.classList.toggle('card-grid-large', totalPairs > 8);
    document.getElementById('timeBox').style.display = currentTheme.timed ? 'block' : 'none';

    startGame();
}

function backToMenu() {
    stopTimer(); 
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.querySelector('.game-container').classList.remove('in-game');
}

// ---------- TIMER ----------
function formatTime(totalSeconds) {
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs; 
}

function startTimer() {
    stopTimer(); 

    if (!currentTheme.timed) return; 

    timeRemaining = currentTheme.timeLimit;
    document.getElementById('timeValue').textContent = formatTime(timeRemaining);

    timerInterval = setInterval(function () {
        timeRemaining--;
        document.getElementById('timeValue').textContent = formatTime(timeRemaining);

        if (timeRemaining <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleTimeUp() {
    stopTimer();
    isLocked = true; 

    var message = document.getElementById('winMessage');
    message.style.color = '#ef4444'; 
    message.textContent = "Time's up! You matched " + matchedPairs + '/' + totalPairs + ' pairs.';
    message.style.opacity = '1';
}

// ---------- CARD SETUP ----------
function createCards() {
    var deck = [];
    for (var i = 0; i < totalPairs; i++) {
        var imgSrc = 'assets/' + currentTheme.folder + '/' + (i + 1) + '.' + currentTheme.ext;
        deck.push({ img: imgSrc, id: i }); 
        deck.push({ img: imgSrc, id: i }); 
    }
    return shuffle(deck);
}

function renderCards() {
    var grid = document.getElementById('cardGrid');
    grid.innerHTML = ''; 
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-index', i);

        if (card.matched) {
            cardEl.classList.add('matched');
        }

        if (card.flipped) {
            cardEl.classList.add('flipped');
        }

        // card-front 
        cardEl.innerHTML =
            '<div class="card-inner">' +
                '<div class="card-front">' +
                    '<img class="card-img" src="' + card.img + '" alt="">' +
                '</div>' +
                '<div class="card-back">' +
                    '<div class="card-pattern"></div>' +
                '</div>' +
            '</div>';

        (function (index, el) {
            var img = el.querySelector('.card-img');

            img.addEventListener('error', function () {
                el.classList.add('img-broken');
            });

            el.addEventListener('click', function () {
                handleCardClick(index, el);
            });
        })(i, cardEl);

        grid.appendChild(cardEl);
    }
}

// runs every time a card is clicked
function handleCardClick(index, cardEl) {
    if (isLocked) return;              
    if (cards[index].flipped) return;  
    if (cards[index].matched) return;  
    if (flippedCards.length >= 2) return; 

    cards[index].flipped = true;
    cardEl.classList.add('flipped');
    flippedCards.push({ index: index, element: cardEl });

    if (flippedCards.length === 2) {
        moveCount++;
        updateStats();
        checkMatch();
    }
}

function checkMatch() {
    var first = flippedCards[0];
    var second = flippedCards[1];

    if (cards[first.index].id === cards[second.index].id) {
        handleMatch(first, second);
    } else {
        handleMismatch(first, second);
    }
}

function handleMatch(first, second) {
    cards[first.index].matched = true;
    cards[second.index].matched = true;

    setTimeout(function () {
        first.element.classList.add('matched');
        second.element.classList.add('matched');
        flippedCards = [];
        matchedPairs++;
        updateStats();

        if (matchedPairs === totalPairs) {
            handleWin();
        }
    }, 300);
}

function handleMismatch(first, second) {
    isLocked = true; 

    setTimeout(function () {
        first.element.classList.add('wrong');
        second.element.classList.add('wrong');
    }, 200);

    setTimeout(function () {
        cards[first.index].flipped = false;
        cards[second.index].flipped = false;
        first.element.classList.remove('flipped', 'wrong');
        second.element.classList.remove('flipped', 'wrong');
        flippedCards = [];
        isLocked = false; 
    }, 900);
}

function updateStats() {
    document.getElementById('moveCount').textContent = moveCount;
    document.getElementById('pairCount').textContent = matchedPairs + '/' + totalPairs;
}

function handleWin() {
    stopTimer();

    var message = document.getElementById('winMessage');
    message.style.color = '#10b981'; 
    message.textContent = 'You matched all pairs in ' + moveCount + ' moves.';
    message.style.opacity = '1';

    setTimeout(function () {
        message.style.opacity = '0';
    }, 4000);
}

function startGame() {
    cards = createCards();
    flippedCards = [];
    matchedPairs = 0;
    moveCount = 0;
    isLocked = false;

    var message = document.getElementById('winMessage');
    message.textContent = '';
    message.style.color = '#10b981';

    updateStats();
    renderCards();
    startTimer(); 
}

function resetStats() {
    startGame();
}

renderThemeButtons();