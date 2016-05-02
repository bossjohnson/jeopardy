// Set up the Game
$(function() {
    currentRound = 1;
    newRound();
});




// ================
// Global Variables
// ================
var categories,
    currentRound,
    clueVals,
    promises,
    numCats;

// ================
// Helper Functions
// ================

function newRound() {
    promises = [];
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
    var clickedVal = Number($(this).text().replace('$', ''));
    var category = $(this).parent().children('.category').text().toLowerCase();
    var questions = categories[category].questions;
    for (var question of questions) {
        if (question.value === clickedVal) {
            promptUser(question.question, $(this));
            break;
        }
    }
}

function promptUser(question, cell) {
    // console.log(question);
    var $prompt = $('<div class="prompt">' + question.toUpperCase() + '</div>');
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
    $answerField.before('<br><br><label for="answer">What is...</label>');
    $answerField.click(function(e) {
      e.stopPropagation();
    });
$('label').click(function(e) {
      e.stopPropagation();
    });
    $prompt.click(function() {
      $(this).hide();
    });
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
