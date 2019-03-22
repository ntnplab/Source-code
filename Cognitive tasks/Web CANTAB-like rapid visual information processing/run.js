
var filename; // Code to get filename for data file goes here
// E.g. var filename = new URL(window.location.href).searchParams.get("filename");
var pID; // Code to get participant ID goes here
// E.g. var pID = new URL(window.location.href).searchParams.get("pID");

// For 100 digits/minute, per cantab specs, make these two sum to 36
var preFixationMs = 0;
var fixationMs = 2000;
var postFixationMs = 600;
var digitMs = 600;

var alreadyCorrect;
var allowPresses;

var stim = [];
var minTargSep = 3; // Minimum separation between the end of one target and the beginning of another
var noRptsWitin = 2; // No repeated digits within this many
var noRptsWithin = 2;
var practiceTargTypes = [[3,5,7]];
var blockwise_nPracticeDgts = [7,8,7,8];
var blockwise_nPracticeTargs = [1,1,1,1];
var taskTargTypes = [[3,5,7],[2,4,6],[4,6,8]];
var blockwise_nTaskDgts = [200,200];
var blockwise_nTaskTargs = [16,16];
var legalDigits = [2,3,4,5,6,7,8,9];

// Variables governing the type of feedback displayed
var gamify = false;
if (gamify) {
    var score;
    var allowNegativeScores = false;
    var nPointsPerCorrect = 40;
    var nPointsPerIncorrect = 20;
}
var colourHints, underliningHints, textHints;
var timingFeedback, categoricalFeedback, anyFeedback, feedbackTextStopId;
var responseAllowanceMs = 1800; // These could be named better
var lateResponseAllowanceMs = 2500;
var nTextMs = 1000; // Number of ms for which feedback text is displayed


var nDecPts = 3;

var ALL = document.getElementsByTagName("html")[0];
if (gamify) {
    var score;
    var scoreArea = document.getElementById('scoreArea');
    scoreArea.style.visibility = 'visible';
}
var digitDisplayArea = document.getElementById('digitDisplayArea');
var digitDisplayP = document.getElementById('digitDisplayP');
var targetDisplayArea = document.getElementById('targetDisplayArea');
var feedbackTextArea = document.getElementById('feedbackTextArea');
var dialogArea = document.getElementById('dialogArea');
var dialogP = document.getElementById('dialogP');

var currDigitCount, nextDigitCount;

var isPractice = true; // Set to false to eliminate the practice round

var lastTargTime;
var outputText = 'Time,Event\n';

function inputHandler(e) {
    if(allowPresses){
        var eventText;
        if (e.constructor.name == 'KeyboardEvent') {
            eventText = e.code;
        } else if (e.constructor.name == 'TouchEvent') {
            eventText = 'TouchEvent';
        }
        outputText += e.timeStamp.toFixed(nDecPts) + ',' + eventText + '\n';
        if (anyFeedback) {
            determineFeedback(e.timeStamp);
        }
    }
}

window.addEventListener('keydown', inputHandler, false);
window.addEventListener('touchstart', inputHandler, false);

function determineFeedback(responseTime) {
    var correctResponse = false, lateResponse = false, earlyResponse = false, incorrectResponse = false;
    if (alreadyCorrect) {
        incorrectResponse = true;
    } else if (responseTime > lastTargTime
               && responseTime < lastTargTime + responseAllowanceMs) {
        correctResponse = true;
        alreadyCorrect = true;
        setTimeout(function() {
            alreadyCorrect = false;
        }, lastTargTime + lateResponseAllowanceMs - performance.now());
    } else if (responseTime > lastTargTime
               && responseTime < lastTargTime + lateResponseAllowanceMs) {
        lateReponse = true;
    } else if (stim.isTarg[currDigitCount]) {
        earlyResponse = true;
    } else {
        incorrectResponse = true;
    }
    if (gamify) {
        if (correctResponse) {
            score += nPointsPerCorrect;
        } else {
            score -= nPointsPerIncorrect;
            if (score < 0 && !allowNegativeScores) {
                score = 0;
            }
        }
        scoreArea.textContent = 'Score: ' + score;
    }
    if (timingFeedback && (earlyResponse || lateResponse)) {
        if (earlyResponse) {
            displayFeedback('Too soon!');
        } else if (lateResponse) {
            displayFeedback('Too late!');
        }
    } else if (categoricalFeedback) {
        if (correctResponse) {
            displayFeedback('Correct!');
        } else {
            displayFeedback('Wrong!');
        }
    }
}

function displayFeedback(text) {
    feedbackTextArea.textContent = text;
    if (feedbackTextStopId) {
        clearTimeout(feedbackTextStopId);
    }
    feedbackTextStopId = setTimeout(function(){
        if(feedbackTextArea.textContent == text){
            feedbackTextArea.textContent = ''
        }
    }, nTextMs);
}

function start() {
    nextDigitCount = 0;
    feedbackTextArea.textContent = '';
    ALL.style.cursor = 'none';
    if (gamify) {
        score = 0;
        categoricalFeedback = true;
    }
    stim.digits = stim.isTarg = [];
    var i;
    if (isPractice) {
        colourHints = underliningHints = textHints = true;
        categoricalFeedback = timingFeedback = true;
        outputText += performance.now().toFixed(nDecPts) + ',' + 'Practice start\n';
        for(i = 0; i < blockwise_nPracticeDgts.length; i++){
            tempStim = new initializeDigits(blockwise_nPracticeTargs[i],blockwise_nPracticeDgts[i],practiceTargTypes);
            stim.digits = stim.digits.concat(tempStim.digits);
            stim.isTarg = stim.isTarg.concat(tempStim.isTarg);
        }
        targetDisplayArea.children[1].style.visibility = 'hidden';
        targetDisplayArea.children[2].style.visibility = 'hidden';
    } else {
        colourHints = underliningHints = textHints = false;
        categoricalFeedback = timingFeedback = false;
        outputText += performance.now().toFixed(nDecPts) + ',' + 'Task start\n';
        stim = new initializeDigits(blockwise_nTaskTargs[0],blockwise_nTaskDgts[0],taskTargTypes);
        if(blockwise_nTaskDgts.length > 1){
            var i, tempStim;
            for(i = 1; i < blockwise_nTaskDgts.length; i++){
                tempStim = new initializeDigits(blockwise_nTaskTargs[i],blockwise_nTaskDgts[i],taskTargTypes);
                stim.digits = stim.digits.concat(tempStim.digits);
                stim.isTarg = stim.isTarg.concat(tempStim.isTarg);
            }
        }
        targetDisplayArea.children[1].style.visibility = 'visible';
        targetDisplayArea.children[2].style.visibility = 'visible';
    }
    stim.digits = elimRepeats(stim.digits, stim.isTarg, noRptsWithin);
    stim.digits = elimSpuriousTargs(stim.digits, stim.isTarg, taskTargTypes);
    dialogArea.style.display = 'none';
    digitDisplayArea.style.display = 'block';
    targetDisplayArea.style.display = 'block';
    if (gamify || timingFeedback || categoricalFeedback) {
        anyFeedback = true;
    }
    feedbackTextArea.style.display = 'block';
    feedbackTextArea.textContent = '';
    if(preFixationMs > 0){
        setTimeout(fixationCross, preFixationMs);
    } else {
        fixationCross();
    }
}

function fixationCross(){
    digitDisplayP.style.color = 'black';
    digitDisplayP.style.textDecoration = 'none';
    digitDisplayP.textContent = '\u2022';
    setTimeout(function() {
        if(postFixationMs > 0){
            digitDisplayP.textContent = '';
            setTimeout(showDigit, postFixationMs);
        } else {
            showDigit();
        }
    }, fixationMs);
}

function showDigit(){
    currDigitCount = nextDigitCount++;
    digitDisplayP.textContent = stim.digits[currDigitCount];
    presentationTime = performance.now();
    outputText += presentationTime.toFixed(nDecPts) + ',' + digitDisplayP.textContent + '\n';
    allowPresses = true;
    if (stim.isTarg[currDigitCount] && !stim.isTarg[currDigitCount+1]) {
        lastTargTime = presentationTime;
    }
    determineHints();
    setTimeout(interTrialCtrlFunc, digitMs);
}

function determineHints() {
    if (stim.isTarg[currDigitCount]) {
        if (colourHints) {
            digitDisplayP.style.color = 'Yellow';
        }
        if (underliningHints) {
            digitDisplayP.style.textDecoration = 'underline';
            digitDisplayP.style.textDecorationColor = 'red';
        }
        if (!stim.isTarg[currDigitCount+1] && textHints) {
            feedbackTextArea.textContent = 'Press now!';
        }
    } else {
        digitDisplayP.style.color = 'black';
        digitDisplayP.style.textDecoration = 'none';
        if(feedbackTextArea.textContent == 'Press now!'){
            feedbackTextArea.textContent = '';
        }
    }
}

function interTrialCtrlFunc() {
    if (nextDigitCount == stim.digits.length) {
        if (isPractice) {
            feedbackTextArea.textContent = '';
            digitDisplayP.textContent = '';
            digitDisplayP.style.color = 'black';
            digitDisplayP.style.textDecoration = 'none';
            setTimeout(afterPracticeScreen, responseAllowanceMs);
        } else {
            showBlank();
            setTimeout(function() {saveDataAndRedirect(filename, outputText, workerID)}, lateResponseAllowanceMs);
        }
    } else {
        if (postDigitMs > 0) {
            showBlank();
            setTimeout(showDigit, postDigitMs);
        } else {
            showDigit();
        }
    }
}

function showBlank(){ // Add to this, otherwise not worth having as its own function
    digitDisplayP.textContent = '';
}

function afterPracticeScreen() {
    isPractice = false;
    if (gamify) {
        score = 0;
        scoreArea.textContent = "Score: " + score;
    }
    allowPresses = false;
    ALL.style.cursor = 'default';
    dialogArea.style.display = 'block';
    digitDisplayArea.style.display = 'none';
    targetDisplayArea.style.display = 'none';
    feedbackTextArea.style.display = 'none';
    while (dialogArea.lastChild) {
        dialogArea.removeChild(dialogArea.lastChild);
    }
    var centered = document.createElement('center');
    instructionsArray =
        [
            "That was the end of the practice round. Now you'll have to look out for 3 sequences (they will be shown off to the side in case you forget them)",
            "3 5 7",
            "2 4 6",
            "4 6 8",
            "Press space as soon as you've seen any of them (i.e. press space as soon as you see the last digit).",
            "React as fast as you can, but avoid making mistakes. This time the game won't tell you when you're seeing a sequence.",
            "Click to start the game for real"
        ];
    var i, currInstructions;
    for (i = 0; i < instructionsArray.length; i++) {
        currInstructions = document.createElement('p');
        currInstructions.className = 'dialog';
        currInstructions.textContent = instructionsArray[i];
        centered.appendChild(currInstructions);
    }
    var startButton = document.createElement('button');
    startButton.textContent = 'Start game';
    startButton.onclick = start;
    centered.appendChild(startButton);
    dialogArea.appendChild(centered);
}

function initializeDigits(nTargs,nDigits,targTypes) {
    var maxTargLen = Math.max.apply(null, targTypes.map(function(x) {return x.length}));
    var i, j, candTargStart, localDigits = Array(nDigits), isTarg = Array(nDigits).fill(false), targTypeIdx = 0;
    for (i = 0; i < nTargs; i++) { // Fill out targets
        while (true) {
            candTargStart = Math.floor(minTargSep + (nDigits - maxTargLen+1 - 2*minTargSep)*Math.random());
            if (!isTarg.slice(candTargStart-minTargSep,candTargStart).includes(true) &&
                !isTarg.slice(candTargStart,candTargStart+targTypes[targTypeIdx].length+minTargSep).includes(true)) {
                    for (j = 0; j < targTypes[targTypeIdx].length; j++) {
                        isTarg[candTargStart+j] = true;
                        localDigits[candTargStart+j] = targTypes[targTypeIdx][j];
                    }
                    targTypeIdx = targTypeIdx==targTypes.length-1 ? 0 : targTypeIdx+1; // cycle through target types
                    break; // out of while loop
            }
        }
    }
    for (i = 0; i < localDigits.length; i++) {
        if (!isTarg[i]) {
            localDigits[i] = sample(legalDigits,1)[0];
        }
    }
    this.digits = localDigits;
    this.isTarg = isTarg;
}

function elimRepeats(gStimArray, indicatorArray, noRptsWithin) {
    var stimArray = gStimArray.slice(0); // Local copy of global variable
    var stimIdx, localElements, unavailableElements, availableElements, preIdx, postIdx;
    for (stimIdx = 0; stimIdx < stimArray.length; stimIdx++) {
        if (!indicatorArray[stimIdx]) { // Don't alter target sequences
            unavailableElements = getLocalUniques(stimArray, stimIdx, noRptsWithin);
            if (unavailableElements.includes(stimArray[stimIdx])) {
                availableElements = legalDigits.slice(0);
                var i;
                for (i = 0; i < unavailableElements.length; i++) {
                    availableElements.splice(availableElements.indexOf(unavailableElements[i]), 1);
                }
                stimArray[stimIdx] = sample(availableElements, 1)[0];
            }
        }
    }
    return(stimArray);
}


function uniqueElements(inArray) {
    var i, collection = new Array();
    for (i = 0; i < inArray.length; i++) {
        if (!collection.includes(inArray[i])) {
            collection.push(inArray[i]);
        }
    }
    return(collection);
}

function getLocalUniques(inArray, idx, n) {
    var preIdx = idx - n, localElements = new Array();
    if (preIdx >= 0 && preIdx + n - 1 < idx) {
        localElements = localElements.concat(inArray.slice(0).splice(preIdx, n));
    }
    postIdx = idx + 1;
    if (postIdx < inArray.length) {
        localElements = localElements.concat(inArray.slice(0).splice(postIdx, n));
    }
    return(uniqueElements(localElements));
}

function elimSpuriousTargs(gStimArray, gIndicatorArray, targArray) {
    var stimArray = gStimArray.slice(0); // Local copies of global variables
    var indicatorArray = gIndicatorArray.slice(0);
    var stimIdx, targIdx, currSeq, currTarg, currIndic, tbrIdx, availableReplacements; // Variables for level 1
    var stimIdx2, targIdx2, candIdx, unavailableReplacements, candRep, candStimArray, flag2, startIdx; // Variables for level 2
    var tbrIdxs, subTbrIdx, tbrIdx, flag1; // These names really need to be changed at some point
    for (targIdx = 0; targIdx < targArray.length; targIdx++) { // Cycle through target sequences to detect spurious occurrences
        currTarg = targArray[targIdx];
        for (stimIdx = 0; stimIdx < stimArray.length; stimIdx++) { // Inspect entire length of stimArray
            currSeq = stimArray.slice(0).splice(stimIdx, currTarg.length);
            currIndic = indicatorArray.slice(0).splice(stimIdx, currTarg.length);
            if (arrayCmp(currSeq, currTarg) && currIndic.includes(false)) { // Spurious sequence detected
                tbrIdxs = findIndices(currIndic, false);
                flag1 = false;
                for (subTbrIdx = 0; subTbrIdx < tbrIdxs.length; subTbrIdx++) {
                    if (flag1) {
                        break;
                    }
                    tbrIdx = tbrIdxs[subTbrIdx];
                    availableReplacements = legalDigits;
                    unavailableReplacements = getLocalUniques(stimArray, stimIdx, noRptsWithin);
                    for (candIdx = 0; candIdx < availableReplacements.length; candIdx++) { // Find candidates that would introduce a spurious target sequence
                        candStimArray = stimArray.slice(0);
                        candRep = availableReplacements[candIdx];
                        candStimArray[tbrIdx] = candRep; 
                        flag2 = false;
                        for (targIdx2 = 0; targIdx2 < targArray.length; targIdx2++) { // Cycle through target sequences to test candidate replacement
                            if (flag2) {
                                break;
                            }
                            currTarg2 = targArray[targIdx2];
                            startIdx = Math.max(0, tbrIdx - currTarg2.length + 1);
                            for (stimIdx2 = startIdx; stimIdx2 <= tbrIdx; stimIdx2++) {
                                if (arrayCmp(currTarg2, candStimArray.slice(0).splice(stimIdx2, currTarg2.length))) { // A spurious target would be introduced
                                    unavailableReplacements.push(candRep);
                                    flag2 = true; // Go to next candidate replacement digit
                                    break;
                                }
                            }
                        }
                    }
                    // The digits that would spurious sequences are now stored in unavailableReplacements
                    var unavailableIdx;
                    var currUnavail;
                        for (unavaialbeIdx = 0; unavailableIdx < unavailableReplacements.length; unavailableIdx++) {
                        currUnavail = unavaiableReplacements[unavailableIdx];
                        availableReplacements.splice(availableReplacements.indexOf(currUnavail));
                    }
                    if (availableReplacements.length > 0) {
                        stimArray[stimIdx] = sample(availableReplacements, 1)[0];
                        flag1 = true; // Go to next element in stimArray
                    }
                }
            }
        }
    }
    return(stimArray);
}

function sample(inArray,k) { // Sample k elements without replacement
	var arrayToSubsample = inArray.slice(0); // Don't alter original array
	outArray = new Array(k);
	var i;
	for (i = 0; i < k; i++) {
		currIdx = Math.floor(Math.random()*arrayToSubsample.length);
		outArray[i] = arrayToSubsample[currIdx];
		arrayToSubsample.splice(currIdx,1);
	}
    return outArray;
}

function arrayCmp(array1, array2) {
    if (array1.length != array2.length) {
        return false;
    }
    var i, returnVal = true;
    for (i = 0; i < array1.length; i++) {
        if (array1[i] != array2[i]) {
            returnVal = false;
            break;
        }
    }
    return returnVal;
}

function isMember(array1, array2) {
    var i;
    for (i = 0; i < array2.length; i++) {
        if(arrayCmp(array1, array2.slice(0).splice(i, array1.length))) {
            return true;
        }
    }
    return false;
}

function findIndices(array, element) {
    var i, indices = new Array();
    for (i = 0; i < array.length; i++) {
        if (array[i] == element) {
            indices.push(i);
        }
    }
    return(indices);
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