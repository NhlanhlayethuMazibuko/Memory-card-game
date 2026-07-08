var icons = [
    'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H'
];

var cards = [];
var flippedCards = [];
var matchedPairs = 0;
var moveCount = 0;
var totalPairs = 8;
var isLocked = false;

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

function createCards() {
    var deck = [];
    for (var i = 0; i < totalPairs; i++) {
        deck.push({ icon: icons[i], id: i });
        deck.push({ icon: icons[i], id: i });
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

        cardEl.innerHTML =
            '<div class="card-inner">' +
                '<div class="card-front">' +
                    '<span class="card-icon">' + card.icon + '</span>' +
                '</div>' +
                '<div class="card-back">' +
                    '<div class="card-pattern"></div>' +
                '</div>' +
            '</div>';

        cardEl.addEventListener('click', function () {
            handleCardClick(i, cardEl);
        });

        grid.appendChild(cardEl);
    }
}

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

    if (cards[first.index].icon === cards[second.index].icon) {
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
    var message = document.getElementById('winMessage');
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

    document.getElementById('winMessage').textContent = '';
    updateStats();
    renderCards();
}

function resetStats() {
    startGame();
}

startGame();