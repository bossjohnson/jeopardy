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
    numCats;

// ================
// Helper Functions
// ================

function newRound() {
    categories = {};
    numCats = 0;
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
            checkRound();
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
    attachHandlers();
}

function attachHandlers() {
    $('.question').click(handleQuestion);
}

function handleQuestion(e) {
    $(this).attr('used', 'true');
    var clickedVal = Number($(this).text().replace('$', ''));
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
        money += question.value;
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
        money -= question.value;
        if (money < 0) {
            $('.money').css('color', 'red');
        }
    }
    $prompt.hide();
    $('.money').text('$' + money);
}

function normalizeAnswer(answer) {

    var optional = answer.match(/\(.+?\)/g);
    if (optional) {
      optional = optional[0].replace(/[\(\)]/g, '');
      console.log('Optional:', optional);
    }
    answer = answer.toLowerCase().replace(/<.+?>|-/g, '').split(' ');
    for (var word of answer) {
        var wordIndex = answer.indexOf(word);

        // word = word.replace(/<.+?>|-/g, '');

        if (word === 'a' || word === 'an' || word === 'the') {
            answer.splice(wordIndex, 1);
        }
    }
    answer = answer.reduce(function(a, b) {
      return a + b;
    });
    return [answer, optional];
}

function checkRound() {
    if (currentRound === 1) {
        clueVals = [200, 400, 600, 800, 1000];
    } else {
        clueVals = [400, 800, 1200, 1600, 2000];
    }
}

function valueSort(a, b) {
    return a.value - b.value;
}


// TODO: Add timers
// TODO: Add round 2
// TODO: Add daily doubles
// TODO: Add final jeopardy
// TODO: "SEEN HERE" stuff -      https://pixabay.com/api/?key =2505523-2af450349a0621791ec127e3b
