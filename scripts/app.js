// Set up the Game
$(function() {
    currentRound = 1;
    money = 0;
    $('#feedbackContainer').hide();
    $('#wrong').hide();
    $('#correct').hide();
    newRound();
});




// ================
// Global Variables
// ================
var categories,
    money,
    currentRound,
    clueVals,
    numCats,
    cluesUsed,
    wager,
    thisIsADailyDouble;

// ================
// Helper Functions
// ================

function newRound() {
    categories = {};
    numCats = 0;
    cluesUsed = 0;
    $('body').addClass('waiting');
    getCategory();
}

function getCategory() {
    // Get a random question
    $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'http://jservice.io/api/random'
    }).done(function(data) {
        // Get that question's category
        var catName = data[0].category.title;
        var catID = data[0].category_id;
        categories[catName] = {
            id: data[0].category.id,
            questions: []
        };
        $.ajax({
            method: 'GET',
            dataType: 'json',
            url: 'http://jservice.io/api/category?id=' + catID
        }).done(function(data) {
            clueVals = [200, 400, 600, 800, 1000];
            // Make sure category has appropriate values for the round and no null values
            for (var clue of data.clues) {
                var clueIndex = clueVals.indexOf(clue.value);
                if (clueIndex !== -1) {
                    clueVals.splice(clueIndex, 1);
                    categories[catName].questions.push(clue);
                }
            }
            if (categories[catName].questions.length >= 5) {
                categories[catName].questions.sort(valueSort);
            } else {
                delete categories[catName];
            }
            numCats = Object.keys(categories).length;
            // Ensure that we have 6 categories
            if (numCats < 6) {
                getCategory();
            } else {
                populateCategories();
            }
        });
    });
}

function populateCategories() {
    var i = 1;
    for (var category in categories) {
        $('.column:nth-child(' + i + ') .category').text(category.toUpperCase());
        i++;
    }
    $('body').removeClass('waiting');
    populateQuestionValues();
}

function populateQuestionValues() {
    for (var i = 1; i < 7; i++) {
        $('#boardFillSound').get(0).play();
        window.setTimeout(function() {
            $('.column:nth-of-type(' + i + ') .question:nth-of-type(2)').text('$' + (200 * currentRound));
            $('.column:nth-of-type(' + (((i + 2) % 6) + 1) + ') .question:nth-of-type(3)').text('$' + (400 * currentRound));
            $('.column:nth-of-type(' + (((i + 4) % 6) + 1) + ') .question:nth-of-type(4)').text('$' + (600 * currentRound));
            $('.column:nth-of-type(' + (((i + 6) % 6) + 1) + ') .question:nth-of-type(5)').text('$' + (800 * currentRound));
            $('.column:nth-of-type(' + (((i + 8) % 6) + 1) + ') .question:nth-of-type(6)').text('$' + (1000 * currentRound));
            i++;
        }, 350 * i);
    }
    i = 1;
    // Attach click handlers
    addDailyDoubles();
    $('.question').click(handleQuestion);
}

function handleQuestion(e) {
    $(this).attr('used', 'true');

    var clickedVal = Number($(this).text().replace('$', '')) / currentRound;
    var category = $(this).parent().children('.category').text().toLowerCase();
    var questions = categories[category].questions;
    for (var question of questions) {
        if (question.value === clickedVal) {
            // Is it a Daily Double?
            if ($(this).attr('dailyDouble')) {
                thisIsADailyDouble = true;
                dailyDouble(question, $(this));
                return;
            }
            thisIsADailyDouble = false;
            promptUser(question, $(this));
            break;
        }
    }
}

function promptUser(question, cell) {
    var $prompt = $('<div class="prompt">' + question.question.toUpperCase() + '</div>');
    cell.text('');
    cell.prepend($prompt);

    if (!thisIsADailyDouble) {
        $prompt.animate({
            'height': '100%',
            'width': '100%',
            'top': 0,
            'left': 0
        }, 700);
    } else {
        $prompt.css({
            'height': '100%',
            'width': '100%',
            'top': 0,
            'left': 0
        });
    }
    cell.off('click');
    var $answerField = $('<input type="text" id="answer">');
    $prompt.append($answerField);
    $answerField.before('<br><br><label for="answer">What is </label>');
    $answerField.after('<label for="answer">?</label>');
    $answerField.focus();
    $answerField.keypress(function(key) {
        if (key.keyCode === 13) {
            var answer = $answerField.val();
            checkAnswer(question, answer, $prompt);
        }
    });
}

function dailyDouble(question, cell) {
    $('#dailyDoubleSound').get(0).play();
    $('body').prepend($('<div id="dailyDouble"></div>'));
    $('#dailyDouble').animate({
        'height': '100%',
        'width': '100%'
    }, 700);
    window.setTimeout(function() {
        var $wager = $('<div><label for="wager">How much would you like to wager?</label><input type="number" id="wager"></div>');
        var $trueDD = $('<br><button id="trueDD">I\'d like to make it a true Daily Double!</button>');
        $('#dailyDouble').append($wager);
        $('#dailyDouble div').prepend($('<span>You currently have <span id="yourMoney">$' + money + '</span>.</span><br>'));
        if (money < 0) {
            $('#yourMoney').css('color', 'red');
        }
        $('#wager').focus();
        $('#wager').after($trueDD);

        // Attach event handlers
        $('#trueDD').click(function() {
            if (money > 0) {
                wager = money;
                $('#dailyDouble').remove();
                promptUser(question, cell);
            } else {
              console.log("nope");
            }
        });

        $('#wager').keypress(function(key) {
            if (key.keyCode === 13) {
                var wagerAmt = Number($('#wager').val());
                if (wagerAmt > money && wagerAmt > (1000 * currentRound)) {
                    console.log("You can't wager that much!");
                    $('#wager').css('border', '5px solid red');
                    $('#wager').animate({
                        'border-width': '1px'
                    }, 100);
                } else {
                    wager = wagerAmt;
                    $('#dailyDouble').remove();
                    promptUser(question, cell);
                }
            }
        });
    }, 1400);
}

function checkAnswer(question, answer, $prompt) {

    var correct = normalizeAnswer(question.answer)[0];
    var user = normalizeAnswer(answer)[0];

    if (correct === user) {
        if (!thisIsADailyDouble) {
            money += question.value * currentRound;
        } else {
            money += wager;
            $('#applause').get(0).play()
        }
        $('#feedbackContainer').show();
        $('#wrong').hide();
        $('#correct').show();
        $('#feedbackContainer').fadeOut(1000);
        if (money >= 0) {
            $('.money').css('color', 'white');
        }
    } else {
        console.log("The correct answer was", correct + ", but you guessed", user);
        $('#feedbackContainer').show();
        $('#correct').hide();
        $('#wrong').show();
        $('#feedbackContainer').fadeOut(1000);
        if (!thisIsADailyDouble) {
            money -= question.value * currentRound;
        } else {
            money -= wager;
            $('#bummer').get(0).play()
        }
        if (money < 0) {
            $('.money').css('color', 'red');
        }
    }
    $prompt.hide();
    $('.money').text('$' + money);
    // Go to next round?
    cluesUsed++;
    console.log("Clues used:", cluesUsed);
    if (cluesUsed === 30) {
        currentRound = 2;
        newRound();
    }
}

// TODO: Enhance this function to be more awesomer and great
function normalizeAnswer(answer) {

    var optional = answer.match(/\(.+?\)/g);
    if (optional) {
        optional = optional[0].replace(/[\(\)]/g, '');
        console.log('Optional:', optional);
    }
    answer = answer.toLowerCase().replace(/<.+?>|-|\./g, '').split(' ');
    for (var i = 0; i < answer.length; i++) {
        var word = answer[i];
        var wordIndex = answer.indexOf(word);
        if (word === 'a' || word === 'an' || word === 'the' || word === 'and') {
            answer.splice(wordIndex, 1);
            i--;
        }
        if (word[word.length - 1] === 's' && word[word.length - 2] !== 's') {
            word.slice(word.length - 1, 1);
        }
    }
    answer = answer.reduce(function(a, b) {
        return a + b;
    });
    return [answer, optional];
}

function valueSort(a, b) {
    return a.value - b.value;
}

function addDailyDoubles() {
    if (currentRound === 1) {
        var row = Math.floor(Math.random() * 4) + 1;
        var col = Math.floor(Math.random() * 5) + 1;
        $('.column:nth-of-type(' + col + ') .question:nth-child(' + (row + 1) + ')').attr('dailyDouble', 'true');
        // $('.column:nth-of-type(' + col + ') .question:nth-child(' + (row + 1) + ')').css('background-color', 'red');
    } else {
        var row1 = Math.floor(Math.random() * 4) + 1;
        var col1 = Math.floor(Math.random() * 5) + 1;
        var row2 = Math.floor(Math.random() * 4) + 1;
        var col2 = Math.floor(Math.random() * 5) + 1;
        // Make sure we have two different cells!
        // TODO: Debug this!  It puts up three daily doubles sometimes???
        if (row1 === row2 && col1 === col2) {
            console.log("Trying again!");
            addDailyDoubles();
        }
        $('.column:nth-of-type(' + col1 + ') .question:nth-child(' + (row1 + 1) + ')').attr('dailyDouble', 'true');
        $('.column:nth-of-type(' + col2 + ') .question:nth-child(' + (row2 + 1) + ')').attr('dailyDouble', 'true');
    }
}


// TODO: Add timers
// TODO: Add final jeopardy
// TODO: "SEEN HERE" stuff -      https://pixabay.com/api/?key =2505523-2af450349a0621791ec127e3b
