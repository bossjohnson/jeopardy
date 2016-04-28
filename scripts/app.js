$(function() {
    $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'http://jservice.io/api/random?count=6'
    }).done(setCategories);

}); //End of wrapper function

// =======
// Helpers
// =======
// function logClues(clues) {
//   for (var clue of clues) {
//     console.log(clue.category.title.toUpperCase(), clue.category.id);
//   }
// }


function setCategories(data) {
    for (var i = 0; i < data.length; i++) {
        var category = data[i].category.title.toUpperCase();
        $('.column:nth-child(' + (i + 1) + ') .category').text(category);
        console.log(data[i]);
    }
}
