$(function() {
    var categories = $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'http://jservice.io/api/random?count=6'
    }).done(setCategories);

}); //End of wrapper function







// =======
// Helpers
// =======
var categoriesThisRound = {};

function setCategories(data) {

    for (var i = 0; i < data.length; i++) {
        categoriesThisRound[data[i].category.title] = data[i].category.id;
        $('.column:nth-child(' + (i + 1) + ') .category').text(data[i].category.title.toUpperCase());
    }

    var categoryIDs = [];
    for (var category of data) {
        var clue = $.ajax({
            method: 'GET',
            dataType: 'json',
            url: 'http://jservice.io/api/clues?category=' + category.category_id
        });
        categoryIDs.push(clue);
    }
    Promise.all(categoryIDs).then(setQuestionValues);
}

function setQuestionValues(categories) {

    for (var category of categories) {
        var questions = [];
        for (var question of category) {
            // console.log("Question: ", question.question);
            questions.push(question);
        }
        questions.sort(function(a, b) {
            return a.value - b.value;
        });
        // console.log(questions, questions.length);

        // for (var i = 1; i < 7; i++) {
        //   var $column = $('.column:nth-of-type(' + i +')');
        //   console.log("i:", i);
        //   for (var j = 1; j < 6; j++) {
        //     console.log("j:", j);
        //   }

            // console.log(questions[i]);
        // }
    }
}
