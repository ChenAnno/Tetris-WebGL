var canvas;
var gl;
var program;

var colNum = 12; // 12 <-> 2 * 3 * 4
var rowNum = 20;
var backGround = [];
var currentBlock = {};
var interval;
var speed = 500; // to set the speed of falling part
var defaultSpeed = 500;
var speedIncrease = 100;
var whetherSpeedIncrease = false;
var scoreNum = 0;
var gameOver = false;
var newBlockRequired = true;
var pressPause = 0;

function convertCoord(x, y) {
    var xNew = (x / colNum * 1) + ((colNum - x) / (colNum) * -1);
    var yNew = (y / rowNum * 1) + ((rowNum - y) / (rowNum) * -1);
    return vec2(xNew, yNew);
}

var colors = [
    vec4(1.0, 0.95, 0.87, 1.0), //background
    vec4(1.0, 0.9, 0.3, 1.0), //田Block
    vec4(0.45, 0.78, 0.71, 1.0), //一Block
    vec4(0.48, 0.37, 0.51, 1.0), //sBlock
    vec4(0.4, 0.6, 0.8, 1.0), //ZBlock
    vec4(0.75, 0.91, 0.91, 1.0), //LBlock
    vec4(0.79, 0.6, 0.77, 1.0), //JBlock
    vec4(0.97, 0.35, 0.35, 1.0), //TBlock    
    vec4(1.0, 1.0, 1.0, 1.0)
]

var tetrisBlock = [{
        kind: "TianBlock", //田
        style: [{
            squareMainPoints: [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)]
        }],
        color: colors[1]
    },
    {
        kind: "YiBlock", //一
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(1, 0), vec2(-1, 0), vec2(-2, 0)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, 1), vec2(0, -1), vec2(0, -2)]
            }
        ],
        color: colors[2]
    },
    {
        kind: "SBlock",
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(1, 0), vec2(0, -1), vec2(-1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, 1), vec2(1, 0), vec2(1, -1)]
            }
        ],
        color: colors[3]
    },
    {
        kind: "ZBlock",
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(0, -1), vec2(1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(1, 0), vec2(1, 1)]
            }
        ],
        color: colors[4]
    },
    {
        kind: "LBlock",
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(-1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(1, 1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(-1, 1)]
            }
        ],
        color: colors[5]
    },
    {
        kind: "JBlock",
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(-1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(1, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(1, 1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(-1, 1)]
            }
        ],
        color: colors[6]
    },
    {
        kind: "TBlock",
        style: [{
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(0, -1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(1, 0)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(-1, 0), vec2(1, 0), vec2(0, 1)]
            },
            {
                squareMainPoints: [vec2(0, 0), vec2(0, -1), vec2(0, 1), vec2(-1, 0)]
            }
        ],
        color: colors[7]
    },
];
// backGround[col][row]
/*
background: 1.occupied 2.color 3.allPoints
*/
function initializeBackground() {
    for (var i = 0; i < colNum; i++) {
        var newColumn = [];
        for (var j = 0; j < rowNum; j++) {
            newColumn.push({
                occupied: false,
                color: colors[0],
                allPoints: [ //to draw a square, use triangle
                    convertCoord(i, j),
                    convertCoord(i, j + 1),
                    convertCoord(i + 1, j + 1),
                    convertCoord(i, j),
                    convertCoord(i + 1, j + 1),
                    convertCoord(i + 1, j)
                ]
            });
        }
        backGround.push(newColumn);
    }
}

function drawStaticBlocks() {
    for (var i = 0; i < colNum; i++) {
        for (var j = 0; j < rowNum; j++) {
            if (backGround[i][j].occupied == true) {
                var vBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, flatten(backGround[i][j].allPoints), gl.STATIC_DRAW);
                var vPosition = gl.getAttribLocation(program, "vPosition");
                gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(vPosition);
                var cBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, flatten(backGround[i][j].color), gl.STATIC_DRAW);
                var colorUniformLocation = gl.getUniformLocation(program, "vColor");
                gl.uniform4f(colorUniformLocation, backGround[i][j].color[0], backGround[i][j].color[1],
                    backGround[i][j].color[2], backGround[i][j].color[3]);
                gl.drawArrays(gl.TRIANGLES, 0, backGround[i][j].allPoints.length);
            }
        }
    }
}

function alertGameOver() {
    gameOver = true;
    var alertStr = "";
    scoreNum = Math.floor(scoreNum / 10);
    if (scoreNum == 0) {
        alertStr = "新手";
    } else if (scoreNum == 1) {
        alertStr = "强者";
    } else if (scoreNum == 2) {
        alertStr = "高手";
    } else if (scoreNum == 3) {
        alertStr = "大师";
    } else {
        alertStr = "王者";
    }
    alert("您的俄罗斯方块等级为：" + alertStr + "  ~  开始新一轮的挑战吧！");
    scoreNum = 0;
}

function timeAfterTime() {
    speed = defaultSpeed;
    setSpeed(defaultSpeed);
    whetherSpeedIncrease = false;
    newBlockRequired = true;
    backGround = [];
    currentBlock = {};

    for (var i = 0; i < colNum; i++) {
        var newCol = [];
        for (var j = 0; j < rowNum; j++) {
            newCol.push({
                occupied: false,
                color: colors[0],
                allPoints: [
                    convertCoord(i, j),
                    convertCoord(i, j + 1),
                    convertCoord(i + 1, j + 1),
                    convertCoord(i, j),
                    convertCoord(i + 1, j + 1),
                    convertCoord(i + 1, j)
                ]
            });
        }
        backGround.push(newCol);
    }
    createNewBlock();
    gameOver = false;
}

function checkGameOver() {
    for (var i = 0; i < colNum; i++) {
        if (backGround[i][rowNum - 1].occupied == true) {
            alertGameOver();
            timeAfterTime();
            break;
        }
    }
}

function getMainPointsPosition(mainPointsPosition) {
    for (var i = 0; i < 4; i++) {
        mainPointsPosition.push([currentBlock.centerPoint[0] + currentBlock.squareMainPoints[i][0],
            currentBlock.centerPoint[1] + currentBlock.squareMainPoints[i][1]
        ]);
    }
}

function createNewBlock() {
    if (newBlockRequired) {
        var newBlockKind = Math.floor(Math.random() * tetrisBlock.length);
        var newBlockKindSure = tetrisBlock[newBlockKind];
        var newBlockstyleure = Math.floor(Math.random() * newBlockKindSure.style.length);
        currentBlock.kind = newBlockKind;
        currentBlock.color = newBlockKindSure.color;
        currentBlock.styleNum = newBlockstyleure;
        var initialX = 2 + Math.floor(Math.random() * (colNum - 3));
        var initialY = rowNum - 1;
        if (backGround[initialX][initialY].occupied) {
            alertGameOver();
            timeAfterTime();
        }
        currentBlock.centerPoint = [initialX, initialY];
        currentBlock.squareMainPoints = newBlockKindSure.style[newBlockstyleure].squareMainPoints;
        newBlockRequired = false;
    }
    var mainPointsPosition = [];
    getMainPointsPosition(mainPointsPosition);
    for (var i = 0; i < 4; i++) {
        var x = mainPointsPosition[i][0];
        var y = mainPointsPosition[i][1];
        // whether hit the static block's top
        if (backGround[x][y] != undefined && backGround[x][y].occupied == true) {
            for (var j = 0; j < 4; j++) {
                newX = mainPointsPosition[j][0];
                newY = mainPointsPosition[j][1] + 1; //above the former one
                if (backGround[newX][newY] != undefined) {
                    backGround[newX][newY].occupied = true;
                    backGround[newX][newY].color = currentBlock.color;
                }
            }
            newBlockRequired = true;
            break;
        }
        // whether hit the floor
        if (y == 0) {
            for (var i in mainPointsPosition) {
                x = mainPointsPosition[i][0];
                y = mainPointsPosition[i][1];
                if (backGround[x][y] != undefined) {
                    backGround[x][y].occupied = true;
                    backGround[x][y].color = currentBlock.color;
                }
            }
            newBlockRequired = true;
            break;
        }
    }
}

function drawMovingBlock() {
    var movingBlockPoints = [];
    var keepMainPoints = [];
    getMainPointsPosition(keepMainPoints);
    for (var i = 0; i < 4; i++) {
        keepMainPoints.push(
            [
                currentBlock.centerPoint[0] + currentBlock.squareMainPoints[i][0],
                currentBlock.centerPoint[1] + currentBlock.squareMainPoints[i][1]
            ]
        );
    }
    for (var i = 0; i < 4; i++) {
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0], keepMainPoints[i][1]));
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0], keepMainPoints[i][1] + 1));
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0] + 1, keepMainPoints[i][1] + 1));
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0], keepMainPoints[i][1]));
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0] + 1, keepMainPoints[i][1] + 1));
        movingBlockPoints.push(convertCoord(keepMainPoints[i][0] + 1, keepMainPoints[i][1]));
    }
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(movingBlockPoints), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(currentBlock.color), gl.STATIC_DRAW);
    var colorUniformLocation = gl.getUniformLocation(program, "vColor");
    gl.uniform4f(colorUniformLocation, currentBlock.color[0], currentBlock.color[1], currentBlock.color[2], currentBlock.color[3]);

    gl.drawArrays(gl.TRIANGLES, 0, movingBlockPoints.length);
}

function fallingDown() {
    var nextOccupied = false;
    var mainPointsPosition = [];
    getMainPointsPosition(mainPointsPosition);
    for (var i = 0; i < 4; i++) {
        var x = mainPointsPosition[i][0];
        var y = mainPointsPosition[i][1];
        if (backGround[x][y - 1].occupied) {
            for (var i in mainPointsPosition) {
                var xNew = mainPointsPosition[i][0];
                var yNew = mainPointsPosition[i][1];
                if (backGround[xNew][yNew] != undefined) {
                    backGround[xNew][yNew].occupied = true;
                    backGround[xNew][yNew].color = currentBlock.color;
                }
            }
            nextOccupied = true;
            newBlockRequired = true;
            break;
        }

    }
    if (nextOccupied == false) {
        currentBlock.centerPoint[1]--;
    }
}
// to check collision which there is no need to stop the block
function checkCollisionNoStop(testBlockstyleure, keyPress) {
    var xNow = currentBlock.centerPoint[0];
    var yNow = currentBlock.centerPoint[1];
    var testMainPoints = testBlockstyleure.squareMainPoints;
    // 1. collide with side blocks or walls when change
    if (keyPress == "Enter") {
        for (var i in testMainPoints) {
            var xNext = xNow + testMainPoints[i][0];
            var yNext = yNow + testMainPoints[i][1];
            if (backGround[xNext][yNext] == undefined || backGround[xNext][yNext].occupied == true) {
                return true;
            }
        }
    }
    // 2. collide the wall
    else {
        var xMove = 0;
        if (keyPress == "a") {
            xMove = -1;
        } else if (keyPress == "d") {
            xMove = 1;
        }
        for (var i = 0; i < 4; i++) {
            var nextX = testMainPoints[i][0] + xNow + xMove;
            var nextY = testMainPoints[i][1] + yNow;
            if (nextX < 0 ||
                nextX >= colNum ||
                backGround[nextX][nextY] != undefined && backGround[nextX][nextY].occupied) {
                return true;
            }
        }
    }
    return false;
}

function setSpeed(currentSpeed) {
    clearInterval(interval);
    interval = window.setInterval(fallingDown, currentSpeed);
}
setSpeed(speed);

window.addEventListener("keyup", normalFall, false);
// Up the finger after pressing key
function normalFall(key) {
    if (key.key === "s" && whetherSpeedIncrease) {
        setSpeed(speed);
        whetherSpeedIncrease = false;
    }
}

window.addEventListener("keydown", pressKeyFall, false);
// press down the key
function pressKeyFall(pressKey) {
    if (pressKey.key == "s" && !whetherSpeedIncrease) {
        whetherSpeedIncrease = true;
        setSpeed(speedIncrease);
        pressPause = 0;
        fallingDown();
    }
    if (pressKey.key == "Enter" && pressPause == 0) {
        var newBlockKindSure = tetrisBlock[currentBlock.kind];
        var newStyleNum = (currentBlock.styleNum + 1) % newBlockKindSure.style.length;
        var newBlockstyleure = newBlockKindSure.style[newStyleNum];
        var newMainPoints = newBlockstyleure.squareMainPoints
        if (!checkCollisionNoStop(newBlockstyleure, "Enter")) {
            currentBlock.squareMainPoints = newMainPoints;
            currentBlock.styleNum = newStyleNum;
        }
    }
    if (pressKey.key == "a" && pressPause == 0) {
        if (!checkCollisionNoStop(currentBlock, "a")) {
            currentBlock.centerPoint[0]--;
        }
    }
    if (pressKey.key == "d" && pressPause == 0) {
        if (!checkCollisionNoStop(currentBlock, "d")) {
            currentBlock.centerPoint[0]++;
        }
    }
    if (pressKey.key == "p") {
        if (pressPause == 0) {
            pressPause = pressPause + 1;
            setSpeed(10000000000);
        } else if (pressPause == 1) {
            setSpeed(speed);
            pressPause = 0;
        }
    }
}

function clearBottomRow() {
    for (var i = 0; i < rowNum; i++) {
        var occupiedNum = 0;
        for (var j = 0; j < colNum; j++) {
            if (backGround[j][i].occupied) {
                occupiedNum++;
            }
            if (occupiedNum == colNum) {
                for (var k = 0; k < colNum; k++) {
                    for (var startRow = i; startRow < rowNum - 1; startRow++) {
                        backGround[k][startRow].occupied = backGround[k][startRow + 1].occupied;
                        backGround[k][startRow].color = backGround[k][startRow + 1].color;
                    }
                }
                scoreNum++;
                speed = speed * 0.95;
            }
        }
    }
    showScore.innerHTML = scoreNum;
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 0.95, 0.87, 1.0);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    initializeBackground();
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    checkGameOver();
    if (gameOver == false) {
        createNewBlock();
        drawStaticBlocks();
        drawMovingBlock();
        clearBottomRow();
    }
    window.requestAnimFrame(render);
}

/*
Conclusions:
    There are four main difficulties in this work as far as I am concerned.
    First is the definition of the tetris block. In my work, each block owns
three attributes: kind, style, color. Different styles owns different mainpoints.
Mainpoint is the left bottom point in a square, which could be used to calculate
others points to draw two triangles, which can form a square. As each tetris 
block owns 4 squares, thus 4 mainpoinst can express a block.
    Second is to draw the whole game screen. There are two inportant elements 
to complete it. ① backGround: 1.occupied 2.color 3.allPoints;  ② currentBlock:
1.kind 2.color 3.stylenum 4.centerPoint 5.squreMainPoints. Using currentBlock's
centerPoint and squareMainPoints can get the coordinates of the four squares in
a tetris; using currentBlock's kind and styleNum can change the block's style.
While a moving block stops, its four square's position become occupied.
    Third is the test of collision. There are two kinds of collision, the first
one is the block colliding with the floor and the top of other blocks, meaning 
that there is a need to create a new tetris block; the second case is the collision
of the side of others and the walls.
    Finally is the user interaction. Pressing the button and after-pressing button
correspond to differnt functions. Speed should be stored to achieve the goal
like pause and speed-up.
    While doing with learning some basic skills of HTML, the game screen is not
that beautiful. In future work, I will add more elements to make the the game 
more elegant.

Finished At:
11:00, 10.11, 2020
Yanzhe Chen
*/



