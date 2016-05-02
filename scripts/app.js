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
    getCategory();
}

function getCategory() {
    // Get a random question
    promises.push($.ajax({
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
            if (numCats < 6) {
                getCategory();
            }
        });
    }));
    Promise.all(promises).then(populateCategories);
}


function populateCategories() {
    var i = 1;
    for (var category in categories) {
        $('.column:nth-child(' + i + ') .category').text(category.toUpperCase());
        i++;
    }
    getQuestions();
}

function getQuestions() {
  console.log("Categories:", Object.keys(categories).length, categories);
    //     var promises = [];
    //     for (var cat of data) {
    //         var prom = $.ajax({
    //             method: 'GET',
    //             dataType: 'json',
    //             url: 'http://jservice.io/api/clues?category=' + cat.category_id
    //         });
    //         promises.push(prom);
    //     }
    //     Promise.all(promises).then(function(data) {
    //         for (var category of data) {
    //             for (var i = 0; i < category.length; i++) {
    //                 var catName = category[i].category.title;
    //                 categories[catName].questions.push(category[i]);
    //             }
    //         }
    //     });
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

function valueSort(a, b) {
    return a.value - b.value;
}
