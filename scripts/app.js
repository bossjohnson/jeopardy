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
    cluesUsed;

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
        $('#boardFill').get(0).play();
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
    attachHandlers();
}

function attachHandlers() {
    $('.question').click(handleQuestion);
}

function handleQuestion(e) {
    $(this).attr('used', 'true');

    var clickedVal = Number($(this).text().replace('$', ''))/currentRound;
    var category = $(this).parent().children('.category').text().toLowerCase();
    var questions = categories[category].questions;
    for (var question of questions) {
        if (question.value === clickedVal) {
            promptUser(question, $(this));
            break;
        }
    }
}

function promptUser(question, cell) {
    var $prompt = $('<div class="prompt">' + question.question.toUpperCase() + '</div>');
    cell.text('');
    cell.prepend($prompt);
    $prompt.animate({
        'height': '100%',
        'width': '100%',
        'top': 0,
        'left': 0
    }, 700);
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

function checkAnswer(question, answer, $prompt) {

    var correct = normalizeAnswer(question.answer)[0];
    var user = normalizeAnswer(answer)[0];

    if (correct === user) {
        console.log("Correct!");
        money += question.value * currentRound;
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
        money -= question.value * currentRound;
        if (money < 0) {
            $('.money').css('color', 'red');
        }
    }
    $prompt.hide();
    $('.money').text('$' + money);
    // Go to next round?
    cluesUsed++;
    console.log(cluesUsed);
    if (cluesUsed === 30) {
        currentRound = 2;
        newRound();
    }
}

function normalizeAnswer(answer) {

    var optional = answer.match(/\(.+?\)/g);
    if (optional) {
        optional = optional[0].replace(/[\(\)]/g, '');
        console.log('Optional:', optional);
    }
    answer = answer.toLowerCase().replace(/<.+?>|-/g, '').split(' ');
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


// TODO: Add timers
// TODO: Add daily doubles
// TODO: Add final jeopardy
// TODO: "SEEN HERE" stuff -      https://pixabay.com/api/?key =2505523-2af450349a0621791ec127e3b
