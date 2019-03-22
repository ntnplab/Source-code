
var filename; // Code to get filename for data file goes here
// E.g. var filename = new URL(window.location.href).searchParams.get("filename");
var pID; // Code to get participant ID goes here
// E.g. var pID = new URL(window.location.href).searchParams.get("pID");

var ALL = document.getElementsByTagName("html")[0];
var dialogArea = document.getElementById("dialogArea");
var textArea = document.getElementById("textArea");

var goInstructions = 'As soon as you see a letter other than "X", press the space bar or tap your touch screen if you have one. React as quickly as you can.';
var noGoInstructions = 'When you see "X", do not do anything.';
var goStim = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z'];
var noGoStim = ['X'];

dialogArea.innerHTML = '<p class="dialog">' + goInstructions + '<br><br>' + noGoInstructions + '</p>';

var preFixationMs = 500;
var fixationMs = 500;
var postFixationMs = 0;
var stimDisplayMs = 500;
var allowResponsesMs = 1000; // How long before the trial ends? (responses afterward are still recorded)

var responsesTruncateTrials = false;
var responsesHideStim = true;

var masterBlockwiseLengths = Array(1).fill(200);
var masterBlockwisePpnGos = Array(1).fill(0.8);
var masterIsGo = generateStimuli(masterBlockwiseLengths, masterBlockwisePpnGos)

var gamify = false;
if (gamify) {
	var maxPoints = 50, pointLoss = -2*maxPoints, currPoints;
	var pointsBarTimeIncr = 1000/60; // Roughly screen rate
	var addPointsTimeIncr = 1000/60; // Roughly screen rate
	var postFeedbackMs = 500;
    var pointsBarHolder = document.getElementById("pointsBarHolder");
    var pointsBar = document.getElementById("pointsBar");
    var pointsBarStopId;
    var score = 0;
}

var isPractice = true;
var practiceFeedback = true;
if (isPractice) {
	var practiceBlockwiseLengths = [5, 5];
	var practiceBlockwisePpnGos = [0.8, 0.8];
	var practiceIsGo = generateStimuli(practiceBlockwiseLengths, practiceBlockwisePpnGos)
	var goFeedback = '<p class="dialog">Too slow!<br><br>' + goInstructions + '</p>';
	var noGoFeedback = '<p class="dialog">Incorrect.<br><br>' + noGoInstructions + '</p>';
	dialogArea.innerHTML += '<button onclick="start()">Start practice</button>';
} else {
	dialogArea.innerHTML += '<button onclick="start()">Start</button';
}

var timeoutID, hideStimTimeoutID, trialIdx, wasResponse = false, presentationTime = 0, responseTimeHolder, responseTime = 0;

window.addEventListener("touchstart", respondToInput, false);
window.onkeydown = respondToInput;
var allowResponses = false;

var outputText = 'time,event\n';

function start() {
	if (isPractice) {
		outputText += performance.now() + ',practice_start\n';
		isGo = practiceIsGo;
	} else {
		outputText += performance.now() + ',task_start\n';
		isGo = masterIsGo;
	}
	
	ALL.style.cursor = "none";
    dialogArea.style.display = "none";
	textArea.style.display = 'block';
	
	trialIdx = 0;
	runTrial();
}

function runTrial() {
	setTimeout(function() {
		if (fixationMs > 0) {
			fixationCross();
		}
		setTimeout(function() {
			if (postFixationMs > 0) {
				textArea.textContent = '';
				setTimeout(showStim, postFixationMs);
			} else {
				showStim();
			}
		}, fixationMs);
	}, preFixationMs);
}

function fixationCross() {
	textArea.textContent = "\u2022";
	outputText += performance.now() + ',fixation\n';
}

function showStim() {
	if (isGo[trialIdx]) {
		textArea.textContent = goStim[Math.floor(Math.random()*goStim.length)];
	} else {
		textArea.textContent = noGoStim[Math.floor(Math.random()*noGoStim.length)];
	}
	wasResponse = false;
	allowResponses = true;
	timeoutID = setTimeout(endTrial, allowResponsesMs);
	hideStimTimeoutID = setTimeout(hideStim, stimDisplayMs);
	if (gamify) {
		currPoints = maxPoints;
		pointsBarStopId = setTimeout(function() {
			pointsBar.style.display = 'block';
			showPointsBar();
		}, pointsBarTimeIncr);
	}
	outputText += performance.now() + ',' + (isGo[trialIdx] ? 'go' : 'nogo') + '\n';
}

function hideStim() {
	textArea.textContent = '';
}

function showPointsBar() {
    if (currPoints >= 0) {
        pointsBar.style.backgroundColor = "rgb(" + 255*(maxPoints-currPoints)/maxPoints + "," + 255*currPoints/maxPoints + ",0)";
        pointsBar.style.height = currPoints/maxPoints*pointsBarHolder.clientHeight + 'px';
        pointsBar.style.top = (1 - currPoints/maxPoints)*pointsBarHolder.clientHeight + 'px';
        currPoints--;
        pointsBarStopId = setTimeout(showPointsBar,pointsBarTimeIncr);
    }
}

function respondToInput(event) {
	if (event.code != undefined && event.code != 'Space') { // Don't record non-spacebar presses
		return;
	}
	outputText += event.timeStamp + ',response\n'; // Record everything else, regardless of whether the trial has been cut off
	if (allowResponses) {
		wasResponse = true;
		allowResponses = false;
		if (responsesHideStim) {
			clearTimeout(hideStimTimeoutID);
			hideStim();
		}
		if (responsesTruncateTrials) {
			clearTimeout(timeoutID);
			clearTimeout(hideStimTimeoutID);
			endTrial();
		}
	}
}

function endTrial() {
	allowResponses = false;
	textArea.textContent = '';
	if (gamify) {
        pointsBar.style.display = 'none';
		scoreArea.style.display = 'block';
        clearTimeout(pointsBarStopId);
		if (!isGo[trialIdx]) {
			if (wasResponse) {
				currPoints = pointLoss;
			} else {
				currPoints = maxPoints;
			}
		}
		addPoints(nextTrial);
    } else if (isPractice && practiceFeedback) {
        if ((wasResponse && !isGo[trialIdx]) || (!wasResponse && isGo[trialIdx])) {
            practiceFeedbackScreen();
        } else {
            nextTrial();
        }
    } else {
        nextTrial();
    }
}

function addPoints(nextFunction) {
    if (currPoints != 0) {
		incr = Math.sign(currPoints);
		if (incr < 0) {
			scoreArea.style.color = 'red';
		} else {
			scoreArea.style.color = 'green';
		}
        currPoints -= incr;
		score += incr;
		score = Math.max(0, score); // Don't allow negative scores
        scoreArea.textContent = "Score: " + score;
        setTimeout(
            function() {
                addPoints(nextFunction)
            },
            addPointsTimeIncr
        );
    } else {
        setTimeout(function() {
			scoreArea.style.display = 'none';
			nextFunction();
		}, postFeedbackMs);
    }
}

function practiceFeedbackScreen() {
	ALL.style.cursor = "default";
    textArea.style.display = 'none';
    dialogArea.style.display = 'block';
    if (wasResponse && !isGo[trialIdx]) {
        dialogArea.innerHTML = noGoFeedback;
    } else if (!wasResponse && isGo[trialIdx]) {
        dialogArea.innerHTML = goFeedback;
    }
	dialogArea.innerHTML += '<button class="dialog" onclick="nextTrial()">Continue</button>';
    trialIdx--;
}

function nextTrial() {
	ALL.style.cursor = "none";
    dialogArea.style.display = 'none';
    textArea.style.display = 'block';
	trialIdx++;
	if (trialIdx == isGo.length) {
		if (isPractice) {
			postPracticeScreen();
		} else {
			saveDataAndRedirect(filename, outputText, pID);
		}
	} else {
		runTrial();
	}
}

function postPracticeScreen() {
	isPractice = false;
	ALL.style.cursor = "default";
    dialogArea.style.display = "block";
	textArea.style.display = 'none';
	dialogArea.innerHTML = '<p class="dialog">That was the end of the practice round.<br><br>Click to start the game for real.<br><br>' +
		'<button onclick="start()">Start game</button>';
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

function generateStimuli(lens, ppnGos) {
	var allBlocks = new Array();
	for (i = 0; i < lens.length; i++) {
		currBlock = Array(Math.round(lens[i]*ppnGos[i])).fill(true).concat(
			Array(Math.round(lens[i]*(1 - ppnGos[i]))).fill(false));
		allBlocks = allBlocks.concat(sample(currBlock, currBlock.length));
	}
	return allBlocks;
}

function sample(urInArray, nSamples) {
	// If nSamples > 1, return array, else return single element
	var inArray = urInArray.slice(0); // Don't alter original array
	var outArray = [], i, idx;
	for (i = 0; i < nSamples; i++) {
		idx = Math.floor(Math.random()*inArray.length);
		outArray.push(inArray.splice(idx, 1)[0]);
	}
	if (nSamples > 1) {
		return outArray;
	} else {
		return outArray[0];
	}
}
