// Set up the Game
$(function() {
    $('#jeopardyTheme').get(0).play();
    $('.money').click(function(key) {
          console.log("final");
            finalJeopardy();
    });

    // TODO: Add help page

    currentRound = 1;
    money = 0;
    $('#feedbackContainer').hide();
    $('#wrong').hide();
    $('#correct').hide();
    $('.money').hide();
    $('.playerName').hide();
    $podium = $(`<div id="namePrompt">Please enter your name
                <div class="podium">
                <div class="podiumSidebar"></div>
                <div class="podiumCenter">
                <div class="podiumTopBottom"></div>
                <div class="podiumDisplay">$0</div>
                <div class="podiumDisplay">
                <input id="yourName" type="text">
                </div>
                <div class="podiumTopBottom"></div>
                </div>
                <div class="podiumSidebar"></div>
                </div>
                </div>`);
    $('body').prepend($podium);
    $('#yourName').focus();
    newRound();
    $('#yourName').keypress(function(key) {
        if (key.keyCode === 13 && $('#yourName').val() !== '') {
            playerName = $('#yourName').val();
            playerName = playerName.slice(0, 1).toUpperCase() + playerName.slice(1, playerName.length);
            $podium.remove();
            $('.money').show();
            $('.playerName').text(playerName);
            $('.playerName').show();
            populateQuestionValues();
        }
    });
});

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
                categories[catName].questions.sort(valueSort, '');
            } else {
                delete categories[catName];
            }
            numCats = Object.keys(categories).length;
            // Ensure that we have 6 categories
            if (numCats < 6) {
                getCategory();
            } else {
                populateCategories();
                if (currentRound === 2) {
                    populateQuestionValues();
                }
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
}

function populateQuestionValues() {
    for (var i = 1; i < 7; i++) {
        $('#jeopardyTheme').get(0).pause();
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
    $('.question').attr('used', 'false');

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
        var expandFrom = document.getElementsByClassName('prompt')[0].getBoundingClientRect();
        var left = expandFrom.left;
        var top = expandFrom.top;
        $prompt.css({
            'top': top + 'px',
            'left': left + 'px'
        });
        $prompt.animate({
            'height': '100%',
            'width': '100%',
            'top': '-=' + top + 'px',
            'left': '-=' + left + 'px'
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
    $prompt.append('<br><button id="answerButton">Answer</button>');
    $prompt.append('<br><button id="skip">Skip</button>');

    $(document).keydown(function(key) {
        if (key.keyCode === 13) {
            window.clearInterval(ringIn);

            $(document).off('keydown');
            $('#answerButton').remove();
            $('#skip').remove();
            var $answerField = $('<input type="text" id="answer">');
            $prompt.append($answerField);
            $answerField.before('<label for="answer">What is </label>');
            $answerField.after('<label for="answer">?</label>');
            $answerField.focus();

            var $timerBar = $('<div class="timerBar"></div>');
            var $block = $('<div class="redBlock"></div>');

            for (var i = 0; i < 10; i++) {
                var newBlock = $block.clone();
                $timerBar.append(newBlock);
            }

            $prompt.append($timerBar);

            var timeLeft = 5;
            window.clearInterval(timeToAnswer);
            timeToAnswer = window.setInterval(function() {
                if (!timeLeft) {
                    $('#timesUp').get(0).play();
                    checkAnswer(question, $answerField.val(), $prompt);
                }
                $timerBar.children().first().remove();
                $timerBar.children().last().remove();
                timeLeft--;
            }, 2000);

            $answerField.keydown(function(key) {
                if (key.keyCode === 13) {
                    var answer = $answerField.val();
                    checkAnswer(question, answer, $prompt);
                }
            });
        } else if (key.keyCode === 27) {
            $('#skip').click();
        }
    });

    $('#answerButton').click(function() {
        e = $.Event('keydown');
        e.keyCode = 13;
        $(document).trigger(e);
    });
    $('#skip').click(function() {
        outOfTime(ringIn, $prompt, question);
    });

    // Timer for player to ring in
    var timeToRingIn = 7;
    var ringIn = window.setInterval(function() {
        timeToRingIn--;

        if (timeToRingIn < 0) {
            outOfTime(ringIn, $prompt, question);
        }
    }, 1000);
}

function outOfTime(ringIn, $prompt, question) {
    window.clearInterval(ringIn);
    $('#timesUp').get(0).play();
    $prompt.remove();
    $('#shouldaSaid').html('The answer we were looking for was <br>' + question.answer.replace(/<.+?>|-|\.|\\|\'|\"|\&/g, '') + '.');
    $('#shouldaSaid').show();
    // Go to next round?
    cluesUsed++;
    console.log("Clues used:", cluesUsed);
    if (cluesUsed === 30) {
        if (currentRound === 1) {
            currentRound = 2;
            newRound();
        } else {
            finalJeopardy();
        }
    }
}

function dailyDouble(question, cell) {
    $('#dailyDoubleSound').get(0).play();
    var $dd = $('<div id="dailyDouble"></div>');
    cell.prepend($dd);
    var expandFrom = document.getElementById('dailyDouble').getBoundingClientRect();
    var left = expandFrom.left;
    var top = expandFrom.top;
    $dd.css({
        'top': top + 'px',
        'left': left + 'px'
    });
    $dd.animate({
        'height': '100%',
        'width': '100%',
        'top': '-=' + top + 'px',
        'left': '-=' + left + 'px'
    }, 700);
    window.setTimeout(function() {
        var $wager = $('<div><label for="wager">How much would you like to wager?</label><input type="number" id="wager"></div>');
        var $submitWager = $('<br><button id="submitWager">Submit</button>');
        var $trueDD = $('<br><button id="trueDD">I\'d like to make it a true Daily Double!</button>');
        $('#dailyDouble').append($wager);
        $('#dailyDouble div').prepend($('<span>You currently have <span id="yourMoney">$' + money + '</span>.</span><br>'));
        if (money < 0) {
            $('#yourMoney').css('color', 'red');
        }
        $('#wager').focus();
        $('#wager').after($trueDD);
        $('#wager').after($submitWager);

        // Attach event handlers

        $('#trueDD').click(function() {
            if (money > 0) {
                wager = money;
                $('#dailyDouble').remove();
                promptUser(question, cell);
            }
        });

        $('#submitWager').click(function() {
          var e = $.Event('keypress');
          e.keyCode = 13;
          $('#wager').trigger(e);
        });

        $('#wager').keypress(function(key) {
            if (key.keyCode === 13 && $('#wager').val() !== '') {
                var wagerAmt = Number($('#wager').val());


                if (wagerAmt > money && wagerAmt > (1000 * currentRound) || wagerAmt < 0) {
                    $('#wager').css('border', '5px solid red');
                    $('#wager').animate({
                        'border-width': '1px'
                    }, 100);
                    $('#wager').focus();
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
    window.clearInterval(timeToAnswer);

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
        $('#shouldaSaid').hide();
        if (money >= 0) {
            $('.money').css('color', 'white');
        }
    } else {
        $('#feedbackContainer').show();
        $('#correct').hide();
        $('#wrong').show();
        $('#shouldaSaid').html('The answer we were looking for was <br>' + question.answer.replace(/<.+?>|-|\.|\\|\'|\"|\&/g, '') + '.');
        console.log("The answer was", correct);
        console.log("You said", user);
        $('#shouldaSaid').show();

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
    $prompt.remove();
    $('.money').text('$' + money);

    // Go to next round?
    cluesUsed++;
    console.log("Clues used:", cluesUsed);
    if (cluesUsed === 30) {
        if (currentRound === 1) {
            currentRound = 2;
            newRound();
        } else {
            finalJeopardy();
        }
    }
}

// TODO: Enhance this function to be more awesomer and great
function normalizeAnswer(answer) {

    var optional = answer.match(/\(.+?\)/g);
    if (optional) {
        answer = answer.replace(optional, '');
        optional = optional[0].replace(/[\(\)]|or /g, '');
        console.log('Optional:', optional);
    }

    // Ignore plurals
    if (answer[answer.length - 1] === 's') {
        answer = answer.slice(0, -1);
    }

    answer = answer.toLowerCase().replace(/<.+?>|-|\.|\\|\'|\"|\&/g, '')
        .replace('10', 'ten')
        .replace('9', 'nine')
        .replace('8', 'eight')
        .replace('7', 'seven')
        .replace('6', 'six')
        .replace('5', 'five')
        .replace('4', 'four')
        .replace('3', 'three')
        .replace('2', 'two')
        .replace('1', 'one')
        .split(' ');
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
    }, '');
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
        $('.column:nth-of-type(' + col + ') .question:nth-child(' + (row + 1) + ')').css('background-color', 'red');
    } else {
        var row1 = Math.floor(Math.random() * 4) + 1;
        var col1 = Math.floor(Math.random() * 5) + 1;
        var row2 = Math.floor(Math.random() * 4) + 1;
        var col2 = Math.floor(Math.random() * 5) + 1;

        // Make sure we have two different cells!
        // TODO: Debug this!  It puts up three daily doubles sometimes???
        if (row1 === row2 && col1 === col2) {
            console.log("Duplicates!");
            addDailyDoubles();
            return;
        }
        $('.column:nth-of-type(' + col1 + ') .question:nth-child(' + (row1 + 1) + ')').attr('dailyDouble', 'true');
        $('.column:nth-of-type(' + col2 + ') .question:nth-child(' + (row2 + 1) + ')').attr('dailyDouble', 'true');
        // $('.column:nth-of-type(' + col1 + ') .question:nth-child(' + (row1 + 1) + ')').css('background-color', 'red');
        // $('.column:nth-of-type(' + col2 + ') .question:nth-child(' + (row2 + 1) + ')').css('background-color', 'red');
    }
}

function finalJeopardy() {
    $('#shouldaSaid').hide();

    if (money <= 0) {
        endGame();
        return;
    }

    var question;
    var answer;
    $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'http://jservice.io/api/random'
    }).done(function(data) {
        question = data[0].question;
        answer = data[0].answer;


        var $finalJeopardy = $('<div id="finalJeopardy"></div>');
        $('body').prepend($finalJeopardy);
        $finalJeopardy.animate({
            'height': '100%',
        }, 700, function() {
            var $wager = $('<div><label for="wager">How much would you like to wager?</label><input type="number" id="wager"></div>');
            var $submitWager = $('<br><button id="submitWager">Submit</button>');
            $finalJeopardy.append($wager);
            $('#wager').after($submitWager);
            $('#finalJeopardy div').prepend($('<span>You currently have <span id="yourMoney">$' + money + '</span>.</span><br>'));
            $('#finalJeopardy div').prepend($('<span>The category is: <span class="finalJeopardyCategory">' + data[0].category.title.toUpperCase() + '</span></span>'));
            $('#wager').focus();

            $('#submitWager').click(function() {
              var e = $.Event('keypress');
              e.keyCode = 13;
              $('#wager').trigger(e);
            });

            $('#wager').keypress(function(key) {
                if (key.keyCode === 13 && $('#wager').val() !== '') {
                    var wagerAmt = Number($('#wager').val());

                    if (wagerAmt > money || wagerAmt < 0) {
                        $('#wager').css('border', '5px solid red');
                        $('#wager').animate({
                            'border-width': '1px'
                        }, 100);
                        $('#wager').focus();
                    } else {
                        wager = wagerAmt;
                        $('#finalJeopardy div').remove();
                        finalPrompt(question, answer);
                    }
                }
            });
        });
    });
}

function finalPrompt(question, answer) {
    $('#think').get(0).play();
    $('#think').on('ended', function() {
        finalCheck(answer, $answerField.val());
    })
    var $prompt = $('<div id="finalPrompt" class="prompt">' + question.toUpperCase() + '</div>');
    $('#finalJeopardy').prepend($prompt);
    $('#finalJeopardy').addClass('question');
    var $answerField = $('<input type="text" id="answer">');
    $prompt.append($answerField);
    $answerField.before('<br><br><label for="answer">What is </label>');
    $answerField.after('<label for="answer">?</label>');
    $answerField.focus();
    $prompt.css('display', 'inline-block');
    $prompt.css('text-align', 'center');
    $answerField.keypress(function(key) {
        if (key.keyCode === 13) {
            finalCheck(answer, $answerField.val());
        }
    });
}

function finalCheck(correctAnswer, userAnswer) {
    $('#think').get(0).pause();
    $('#think').off('ended');
    $('#finalJeopardy').remove();
    $('main *').remove();
    var correct = normalizeAnswer(correctAnswer)[0];
    var user = normalizeAnswer(userAnswer)[0];

    if (correct === user) {
        $('#feedbackContainer').show();
        $('#wrong').hide();
        $('#correct').show();
        $('#feedbackContainer').fadeOut(3000);
        money += wager;
        endGame();
    } else {
        $('#feedbackContainer').show();
        $('#correct').hide();
        $('#wrong').show();
        $('#shouldaSaid').html('The answer we were looking for was <br>' + correctAnswer.replace(/<.+?>|-|\.|\\|\'|\"|\&/g, '') + '.');
        $('#shouldaSaid').show();

        console.log("The answer was", correct);
        console.log("You said", user);
        // console.log("The answer was", correct);
        $('#feedbackContainer').fadeOut(3000);
        money -= wager;
        endGame();
    }
}

function endGame() {
    $('#jeopardyTheme').get(0).play()
    var $endGame = $('<div id="endGame">Game Over!</div>');
    $('main *').remove();
    $('main').css('justify-content', 'center');
    $('main').css('align-items', 'center');
    $('.money').text('$' + money);
    $('main').append($endGame);
    $endGame.append('<br>Your total score: $' + money);


    if (window.localStorage.getItem('highScores') === null) {
        var highScores = {
            'Alex Trebek': 5000,
            'Ken Jennings': 4000,
            'Arthur Chu': 3000,
            'Darth Vader': 2000,
            'Batman': 1000
        }
    } else {
        var highScores = JSON.parse(window.localStorage.getItem('highScores'));
    }

    highScores[playerName] = money;
    window.localStorage.setItem('highScores', JSON.stringify(highScores));
    var $highScores = '<div id="highScores"><span>High Scores:</span><br></div>';
    $('main').append($highScores);

    var scoreList = [];
    for (var key in highScores) {
        scoreList.push(highScores[key]);
    }
    scoreList.sort(function(a, b) {
        return b - a;
    });
    for (var i = 0; i < 5; i++) {
        for (var person in highScores) {
            if (highScores[person] === scoreList[i]) {
                $('#highScores').append('<br>' + person, ': $' + scoreList[i]);
            }
        }
    }
}


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
    thisIsADailyDouble,
    playerName,
    timeToAnswer;



    // TODO: "SEEN HERE" stuff -       https://pixabay.com/api/?key =2505523-2af450349a0621791ec127e3b
    // TODO: Remove need to ring in on daily doubles
