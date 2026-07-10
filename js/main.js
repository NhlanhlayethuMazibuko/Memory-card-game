// this object holds all my themes
// each theme points to a folder of images named 1, 2, 3... up to however many pairs it has
// if I ever add a new theme I just add a new object here and it should work
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
        timed: true, // only memes has a timer
        timeLimit: 90 // seconds
    }
};

// these are my "global" variables that keep track of the game state
var cards = [];          // the actual deck being played (array of card objects)
var flippedCards = [];   // whatever card(s) are currently face up (max 2 at a time)
var matchedPairs = 0;    // how many pairs found so far
var moveCount = 0;       // how many times the player has flipped 2 cards
var totalPairs = 8;      // gets overwritten once a theme is picked
var isLocked = false;    // stops clicking while checking a match / when time runs out
var currentTheme = null; // the theme object the player picked
var timerInterval = null; // holds the setInterval so I can clear it later
var timeRemaining = 0;    // seconds left on the clock (memes theme only)

// basic shuffle function, found this online (fisher-yates shuffle)
// swaps random pairs of items so the deck order is random every time
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

// builds one button per theme on the start screen
function renderThemeButtons() {
    var grid = document.getElementById('themeGrid');
    grid.innerHTML = '';

    // loop through every key in the themes object (anime, gta6, memes)
    for (var key in themes) {
        if (!themes.hasOwnProperty(key)) continue; // just a safety check, good practice for for..in loops
        var theme = themes[key];

        var btn = document.createElement('button');
        btn.className = 'theme-btn';
        var previewSrc = 'assets/' + theme.folder + '/1.' + theme.ext; // just uses the first image as a preview
        btn.innerHTML =
            '<img class="theme-btn-img" src="' + previewSrc + '" alt="" onerror="this.style.display=\'none\'">' +
            '<span class="theme-btn-name">' + theme.name + '</span>' +
            '<span class="theme-btn-meta">' + theme.difficulty + ' &middot; ' + theme.pairs + ' pairs</span>';

        // had to wrap this in a function like this (IIFE) so each button remembers
        // its OWN key and not just whatever key was last in the loop
        (function (themeKey) {
            btn.addEventListener('click', function () {
                selectTheme(themeKey);
            });
        })(key);

        grid.appendChild(btn);
    }
}

// runs when the player clicks a theme button
function selectTheme(themeKey) {
    currentTheme = themes[themeKey];
    totalPairs = currentTheme.pairs;

    document.getElementById('activeThemeTitle').textContent = 'Memory Match - ' + currentTheme.name;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';

    // tells the container to go full height now that we actually have a grid to fill
    document.querySelector('.game-container').classList.add('in-game');

    // if this theme has more than 8 pairs, use the bigger grid layout (more columns)
    var grid = document.getElementById('cardGrid');
    grid.classList.toggle('card-grid-large', totalPairs > 8);

    // only show the timer box if this theme actually uses a timer
    document.getElementById('timeBox').style.display = currentTheme.timed ? 'block' : 'none';

    startGame();
}

// goes back to the theme picker
function backToMenu() {
    stopTimer(); // don't want the timer running in the background on the menu
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';

    // shrink the box back down to fit the menu instead of staying full height
    document.querySelector('.game-container').classList.remove('in-game');
}

// ---------- TIMER (only used by the memes theme) ----------

// turns raw seconds into something like "1:05"
function formatTime(totalSeconds) {
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs; // adds a leading 0 if secs < 10
}

function startTimer() {
    stopTimer(); // clear any old timer first so they don't stack up

    if (!currentTheme.timed) return; // skip if this theme has no timer

    timeRemaining = currentTheme.timeLimit;
    document.getElementById('timeValue').textContent = formatTime(timeRemaining);

    // counts down every second
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

// called when the countdown hits 0
function handleTimeUp() {
    stopTimer();
    isLocked = true; // stops the player from flipping any more cards

    var message = document.getElementById('winMessage');
    message.style.color = '#ef4444'; // red, since this is a "lose" message
    message.textContent = "Time's up! You matched " + matchedPairs + '/' + totalPairs + ' pairs.';
    message.style.opacity = '1';
}

// ---------- CARD SETUP ----------

// builds the deck: makes 2 of every image, then shuffles it
function createCards() {
    var deck = [];
    for (var i = 0; i < totalPairs; i++) {
        // builds the image path like assets/GTA6/1.jpg
        var imgSrc = 'assets/' + currentTheme.folder + '/' + (i + 1) + '.' + currentTheme.ext;
        deck.push({ img: imgSrc, id: i }); // id is used later to check if 2 cards match
        deck.push({ img: imgSrc, id: i }); // pushing the same image twice = a pair
    }
    return shuffle(deck);
}

// draws all the cards onto the page
function renderCards() {
    var grid = document.getElementById('cardGrid');
    grid.innerHTML = ''; // clear out old cards first

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

        // card-front = the image side, card-back = the plain side you see first
        cardEl.innerHTML =
            '<div class="card-inner">' +
                '<div class="card-front">' +
                    '<img class="card-img" src="' + card.img + '" alt="">' +
                '</div>' +
                '<div class="card-back">' +
                    '<div class="card-pattern"></div>' +
                '</div>' +
            '</div>';

        // same trick as the theme buttons above - wrapping in a function so
        // each card keeps track of its OWN index instead of sharing the loop's i
        (function (index, el) {
            var img = el.querySelector('.card-img');

            // if the image path is wrong/missing this will fire, so I add a
            // class to flag it visually instead of it just looking blank
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
    // basically a list of reasons to just ignore the click
    if (isLocked) return;              // waiting on a mismatch to flip back / time ran out
    if (cards[index].flipped) return;  // already face up
    if (cards[index].matched) return;  // already matched, nothing to do
    if (flippedCards.length >= 2) return; // 2 cards already showing, don't allow a 3rd

    cards[index].flipped = true;
    cardEl.classList.add('flipped');
    flippedCards.push({ index: index, element: cardEl });

    // once 2 cards are flipped, that counts as one "move"
    if (flippedCards.length === 2) {
        moveCount++;
        updateStats();
        checkMatch();
    }
}

// compares the 2 flipped cards to see if they match
function checkMatch() {
    var first = flippedCards[0];
    var second = flippedCards[1];

    if (cards[first.index].id === cards[second.index].id) {
        handleMatch(first, second);
    } else {
        handleMismatch(first, second);
    }
}

// they matched! mark them as matched and update the pair counter
function handleMatch(first, second) {
    cards[first.index].matched = true;
    cards[second.index].matched = true;

    // small delay just so the player actually sees both cards before they lock in
    setTimeout(function () {
        first.element.classList.add('matched');
        second.element.classList.add('matched');
        flippedCards = [];
        matchedPairs++;
        updateStats();

        // if every pair has been found, the game is won
        if (matchedPairs === totalPairs) {
            handleWin();
        }
    }, 300);
}

// they didn't match, flip them back over after a short pause
function handleMismatch(first, second) {
    isLocked = true; // stop clicks while the player looks at the wrong pair

    // quick "wrong" shake animation before flipping back
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
        isLocked = false; // ok to click again now
    }, 900);
}

// just updates the numbers shown at the top of the game
function updateStats() {
    document.getElementById('moveCount').textContent = moveCount;
    document.getElementById('pairCount').textContent = matchedPairs + '/' + totalPairs;
}

// called when the player finds every pair
function handleWin() {
    stopTimer();

    var message = document.getElementById('winMessage');
    message.style.color = '#10b981'; // green, since this is a "win" message
    message.textContent = 'You matched all pairs in ' + moveCount + ' moves.';
    message.style.opacity = '1';

    // fade the message out after a few seconds
    setTimeout(function () {
        message.style.opacity = '0';
    }, 4000);
}

// starts/restarts a game with the current theme
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
    startTimer(); // does nothing if the theme isn't timed
}

// "New Game" button just calls this, kept it as its own function
// in case I want to add more reset logic later
function resetStats() {
    startGame();
}

// kick everything off by showing the theme buttons as soon as the page loads
renderThemeButtons();