
var filename; // Code to get filename for data file goes here
// E.g. var filename = new URL(window.location.href).searchParams.get("filename");
var pID; // Code to get participant ID goes here
// E.g. var pID = new URL(window.location.href).searchParams.get("pID");

//Change these variables to customize the experiment
var noRptsWithin                = 4; // There cannot be repeated numbers within this number of stimuli
// I.e. if it is set to 4, the following sequence would not be generated: [1,2,3,1].
// But this sequence might be: [1,2,3,4,1].
var preFixationMs = 500;
var fixationMs = 1000;
var postFixationMs = 500;
var digitMs = 1000;
var interDigitMs = 500;
var postSeqMs = 500;
var gamify = false; // Set this to "true" to get the game-y version;; else "false"
var nFeedbackFrames             = 120; // Number of frames feedback is shown (only matters if gamify = true)
var feedbackMs = 2000;
var practice_nDgtsToShow        = [2,2]; // Governs the number of digits shown in the practice trials (also governs the number of practice trials--set to [] for no practice).

var blockwise_nTrials = [5,5,5,5,5,5,5];
var blockwise_nDgtsToShow = [2,3,4,5,6,7,8];
var blockwise_minCorrect = [3,3,3,3,3,3,3];
var blockCount;

var nPointsPerCorrect = 30;

var trialCount, frameCount = 0, dgtCount = 0;
var outputText = "Trial,NumbersShown,Input\n";
var dgts = [];
var isPractice = true;
var userInput;
if (gamify) {
    var score = 0;
    var scoreArea = document.getElementById("scoreArea");
}
var trialwise_nDgtsToShow = practice_nDgtsToShow;
var allCorrect, nAllCorrect = 0;

var ALL = document.getElementsByTagName("html")[0];
var dialogArea = document.getElementById("dialogArea");
var numberDisplayArea = document.getElementById("numberDisplayArea");
var inputArea = document.getElementById("inputArea");
var fieldArea = document.getElementById("fieldArea");
var submitButton = document.getElementById('submitButton');

function startPractice(){
    blockCount = 0;
    trialCount = 0;
    if(practice_nDgtsToShow.length > 0) {
        dgts = generatePracticeStimuli();
        ALL.style.cursor = "none";
        dialogArea.style.display = "none";
        if (preFixationMs > 0) {
            setTimeout(fixationCross, preFixationMs);
        } else {
            fixationCross();
        }
    } else {
        startTask();
    }
}

function afterPracticeScreen(){
    blockCount = 0;
    score = 0;
    if(gamify){
        scoreArea.textContent = "Score: " + score;
        scoreArea.style.visibility = "visible";
    }
    ALL.style.cursor = "default";
    while (dialogArea.children.length > 0) {
        dialogArea.removeChild(dialogArea.children[0]);
    }
    dialogArea.style.display = "block";
    textArray = 
        [
            "That was the end of the practice round.",
            "Click to start the game for real.",
            "There won't be any retries from here on"
        ];
    var i, currText;
    for (i = 0; i < textArray.length; i++) {
        currText = document.createElement('p');
        currText.className = 'dialog';
        currText.textContent = textArray[i];
        dialogArea.appendChild(currText);
    }
    var startButton = document.createElement('button');
    startButton.textContent = 'Start game';
    startButton.onclick = startTask;
    dialogArea.appendChild(startButton);
}

function startTask(){
    trialCount = 0;
    if(gamify) scoreArea.style.visibility = "hidden";
    dialogArea.style.display = "none";
    isPractice = false;
    ALL.style.cursor = "none";
    dgts = generateStimuli();
    if (preFixationMs > 0) {
        setTimeout(fixationCross, preFixationMs);
    } else {
        fixationCross();
    }
}

function fixationCross(){
    numberDisplayArea.style.display = "block";
    numberDisplayArea.textContent = "\u2022"; //dot
    if (postFixationMs > 0) {
        setTimeout(function() {
            numberDisplayArea.textContent = '';
            setTimeout(showDgt, postFixationMs);
        }, fixationMs);
    } else {
        setTimeout(showDgt, fixationMs);
    }
}

function showDgt(){
    numberDisplayArea.textContent = dgts[trialCount][dgtCount];
    dgtCount++;
    setTimeout(function() {
        if(dgtCount == dgts[trialCount].length){//Get user input
            numberDisplayArea.style.display = 'none';
            if (postSeqMs > 0) {
                setTimeout(getInput, postSeqMs);
            } else {
                getInput();
            }
        }
        else{//Show the next digit
            if (interDigitMs > 0) {
                numberDisplayArea.textContent = '';
                setTimeout(showDgt, interDigitMs);
            } else {
                showDgt();
            }
        }
    }, digitMs);
}

function getInput(){
    ALL.style.cursor = "default";
    inputArea.style.display = "block";
    while(fieldArea.children.length > dgts[trialCount].length){
        fieldArea.removeChild(fieldArea.children[0]);
    }
    while(fieldArea.children.length < dgts[trialCount].length){
        fieldArea.appendChild(fieldArea.children[0].cloneNode());
    }
    var i;
    for(i = 0; i < fieldArea.children.length; i++){
        fieldArea.children[i].value = "";
        fieldArea.children[i].disabled = true;
    }
    fieldArea.children[0].disabled = false;
    var instructions = document.createElement('p');
    instructions.className = 'dialog';
    var currInstructions = document.createElement('span');
    currInstructions.textContent = 'Input the digits ';
    instructions.appendChild(currInstructions);
    currInstructions = document.createElement('span');
    currInstructions.style.color = 'blue';
    currInstructions.textContent = 'IN REVERSE';
    instructions.appendChild(currInstructions);
    while (inputArea.children.length > 0) {
        inputArea.removeChild(inputArea.children[0]);
    }
    inputArea.appendChild(instructions);
    inputArea.appendChild(fieldArea);
    inputArea.appendChild(submitButton);
    fieldArea.children[0].focus();
}

function evaluateSubmission(){
    // Collect inputs from form fields, push onto outputText
    // Decide whether to move onto the next trial
    var i, reverseDigits = dgts[trialCount].slice(0).reverse();
    allCorrect = true;
    for(i = 0; i < fieldArea.children.length; i++){
        if(Number(fieldArea.children[i].value) != reverseDigits[i]){
            allCorrect = false;
            break;
        }
    }
    if(allCorrect){
        nAllCorrect++;
    }
    userInput = [];
    var currValue;
    for(i = 0; i < fieldArea.children.length; i++){
        if(fieldArea.children[i].value == "" || fieldArea.children[i].value == " "){
            currValue = "_";
        }
        else if(isNaN(Number(fieldArea.children[i].value))){
            currValue = fieldArea.children[i].value;
        }
        else {
            currValue = Number(fieldArea.children[i].value);
        }
        userInput.push(currValue);
    }
    outputText += (isPractice?0:(trialCount+1)) + "," +
                  dgts[trialCount].toString().replace(/,/g,'-') + "," +
                  userInput.toString().replace(/,/g,'-') + "\n";
    if (gamify || (!allCorrect && isPractice)) {
        feedBackScreen();
    } else {
        nextTrial();
    }
}

function feedBackScreen() {
    ALL.style.cursor = "none";
    inputArea.style.display = "none";
    while (dialogArea.children.length > 0) {
        dialogArea.removeChild(dialogArea.children[0]);
    }
    dialogArea.style.display = "block";
    var nNewPoints, replay = document.createElement('p'), revDgts = dgts[trialCount].slice(0).reverse();
    replay.className = 'replay';
    for(i = 0; i < dgts[trialCount].length; i++){
        currText = document.createElement('span');
        if(revDgts[i] == userInput[i]) {
            nNewPoints++;
            currText.style.color = 'green';
        } else {
            currText.style.color = 'red';
        }
        if (i < dgts[trialCount].length) {
            currText.textContent = revDgts[i] + ' ';
        }
        replay.appendChild(currText);
    }
    var i, currText, textArray = new Array(), classNameArray = new Array();
    if (isPractice && !allCorrect) {
        textArray = textArray.concat(
            [
                'Forward, the digits were:',
                dgts[trialCount].join(' '),
                'So you should have typed:'
            ]);
        classNameArray = classNameArray.concat(
            [
                'dialog',
                'replay',
                'dialog'
            ]);
        for (i = 0; i < textArray.length; i++) {
            currText = document.createElement('p');
            currText.className = classNameArray[i];
            currText.textContent = textArray[i];
            dialogArea.appendChild(currText);
        }
        for (i = 0; i < nNewPoints; i++) {
            setTimeout(function(){score += nPointsPerCorrect;
                                  scoreArea.textContent = "Score: " + score;},
                                  Math.floor(nFeedbackFrames*1000/60/8) + 
                                  i*Math.floor(nFeedbackFrames*1000/60/30));
        }
        var retryButton = document.createElement('button');
        retryButton.onclick = nextTrial;
        retryButton.textContent = 'Try again';
        dialogArea.appendChild(replay);
        dialogArea.appendChild(retryButton);
        ALL.style.cursor = 'default';
    } else {
        if (gamify) {
            scoreArea.textContent = "Score: " + score;
            setTimeout(nextTrial, feedbackMs);
        }
        dialogArea.appendChild(replay);
    }
}

function nextTrial(){
    if(gamify || (isPractice && !allCorrect)) {
        if (gamify) {
            scoreArea.style.visibility = "hidden";
        }
        dialogArea.style.display = "none";
    } else {
        inputArea.style.display = "none";
    }
    trialCount++;
    dgtCount = 0;
    ALL.style.cursor = "none";
    if(isPractice){
        if(nAllCorrect != trialCount){
            trialCount--;
        }
    }
    if(trialCount == dgts.length){
        if(isPractice){
            afterPracticeScreen();
        } else {
            saveDataAndRedirect(filename, outputText, workerID);
        }
        return;
    }
    if(!isPractice && dgts[trialCount-1].length && dgts[trialCount].length != dgts[trialCount-1].length){
        if(nAllCorrect < blockwise_minCorrect[blockCount]){
            saveDataAndRedirect(filename, outputText, workerID);
        } else {
            blockCount++;
            nAllCorrect = 0;
        }
    }
    if (preFixationMs > 0) {
        setTimeout(fixationCross, preFixationMs);
    } else {
        fixationCross();
    }
}

function generatePracticeStimuli(){
    var localDigits = [];
    trialwise_nDgtsToShow = [2,2];
    for(trialIdx = 0; trialIdx < trialwise_nDgtsToShow.length; trialIdx++){
        trialDgts = [];
        while(trialDgts.length < trialwise_nDgtsToShow[trialIdx]){
            cand = Math.floor(Math.random()*10);
            if(!trialDgts.slice(Math.max(0,trialDgts.length-noRptsWithin+1)).includes(cand)) trialDgts.push(cand);
        }
        localDigits.push(trialDgts);
    }
    return localDigits;
}
function generateStimuli(){
    var localDigits = [], i, trialwise_nDgtsToShow = [];
    for(i = 0; i < blockwise_nTrials.length; i++){
        trialwise_nDgtsToShow = trialwise_nDgtsToShow.concat(Array(blockwise_nTrials[i]).fill(blockwise_nDgtsToShow[i]));
    }
    var trialDgts, cand, trialIdx;
    for(trialIdx = 0; trialIdx < trialwise_nDgtsToShow.length; trialIdx++){
        trialDgts = [];
        while(trialDgts.length < trialwise_nDgtsToShow[trialIdx]){
            cand = Math.floor(Math.random()*10);
            if(!trialDgts.slice(Math.max(0,trialDgts.length-noRptsWithin+1)).includes(cand)) trialDgts.push(cand);
        }
        localDigits.push(trialDgts);
    }
    return localDigits;
}

function move(){
    var i = Array.prototype.slice.call(fieldArea.children).indexOf(event.target);
    if(event.key == "Backspace" && i > 0 && fieldArea.children[i].value == ""){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i-1].disabled = false;
        fieldArea.children[i-1].focus();
        event.preventDefault();
    }
    
    else if(event.key == "ArrowLeft"){
        /*if(i > 0){
            fieldArea.children[i-1].focus();
        }*/
        event.preventDefault();
    }
    else if(event.key == "ArrowRight" && i < fieldArea.children.length-1){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i+1].disabled = false;
        fieldArea.children[i+1].focus();
    }
}

function autotab(){
    var i = Array.prototype.slice.call(fieldArea.children).indexOf(event.target);
    if(i < fieldArea.children.length-1 && fieldArea.children[i].value != ""){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i+1].disabled = false;
        fieldArea.children[i+1].focus();
    }
    if(fieldArea.children[i].value == " "){
        fieldArea.children[i].value = "";
    }
}

function saveDataAndRedirect(filename, txt, pID) {
	var form = document.createElement('form');
    document.body.appendChild(form);
    form.method = 'post';
	form.action = 'saveData.php';
	var data = {
		filename: filename,
		txt: txt,
		pID: pID
	}
	var name;
    for (name in data) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = data[name];
        form.appendChild(input);
    }
    form.submit();
}
