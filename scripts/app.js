// Set up the Game
$(function() {
    currentRound = 1;
    checkRound();
    getCategories()
        .then(populateCategories)
        .then(getQuestions)
        .then(attachHandlers);
});



// =======
// Helpers
// =======

var categories,
    currentRound,
    clueVals;

function getCategories() {
    return $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'http://jservice.io/api/random?count=6'
    });
}

function populateCategories(data) {
    categories = {};
    for (var i = 0; i < data.length; i++) {
        var catName = data[i].category.title;
        categories[catName] = {
            id: data[i].category.id,
            questions: []
        };
        // Populate Category divs
        $('.column:nth-child(' + (i + 1) + ') .category').text(data[i].category.title.toUpperCase());
    }
    return data;
}

function getQuestions(data) {
    var promises = [];
    for (var cat of data) {
        var prom = $.ajax({
            method: 'GET',
            dataType: 'json',
            url: 'http://jservice.io/api/clues?category=' + cat.category_id
        });
        promises.push(prom);
    }
    Promise.all(promises).then(function(data) {
        for (var category of data) {
            for (var i = 0; i < category.length; i++) {
                var catName = category[i].category.title;
                categories[catName].questions.push(category[i]);
            }
        }
    });
}

function handleQuestion(e) {
    var clickedVal = Number($(this).text().replace('$', ''));
    var category = $(this).parent().children('.category').text().toLowerCase();
    var questions = categories[category].questions;
    for (var question of questions) {
        if (question.value === clickedVal) {
            console.log(question.question);
            break;
        }
    }
}

function checkRound() {
    if (currentRound === 1) {
        clueVals = [200, 400, 600, 800, 1000];
    } else {
        clueVals = [400, 800, 1200, 1600, 2000];
    }
}

function attachHandlers() {
    $('.question').click(handleQuestion);
}
