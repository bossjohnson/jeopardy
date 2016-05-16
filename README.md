# jeopardy
The heart of this app was the jService API at http://jservice.io/.  It provides an archive of categorized Jeopardy questions along with their answers.  There was no option to directly request random categories, but by querying the API for random questions I could then extract category names and use them to get entire categories in a random fashion.  Since some questions had a null value for their answers, I added some basic filtering to discard these questions.

The board itself was built with HTML and CSS with a heavy reliance on flexbox technology.  Click events and the expanding animations were handled with jQuery.  The flow of the game itself mostly relies on a series of functions which call each other when appropriate.  I used some global variables to track things like the number of questions that had been used each round, they player's money, the current round, etc.  Timers were created with setTimeout().