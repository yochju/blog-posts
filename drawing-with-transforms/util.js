// Globals

var DIM_X = 0;
var DIM_Y = 1;
var DIM_Z = 2;
var DIM_W = 3;


// TOOD(vivek): move all draw primitives out to separate file. 

/// Draw Path

function drawParametric(ctx, fx, fy, tarr) {
    ctx.beginPath();
    for (var i=0; i<tarr.length; i++) {
        var x = fx(tarr[i]);
        var y = fy(tarr[i]);
        if (i == 0) {
            ctx.moveTo(x, y);
        }
        else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}
function drawPolar(ctx, fth, tr, tarr) {
    var fx = function(t) {
        return tr(t) * Math.cos(fth(t));
    }

    var fy = function(t) {
        return tr(t) * Math.sin(fth(t));
    }

    drawParametric(ctx, fx, fy, tarr);
}

/// Draw Segments

function drawLineSegment(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();   
}
function drawParametricSegments(ctx, fx, fy, tarr) {
    for (var i=0; i<(tarr.length - 1); i++) {
        var x1 = fx(tarr[i]);
        var y1 = fy(tarr[i]);
        var x2 = fx(tarr[i + 1]);
        var y2 = fy(tarr[i + 1]);
        drawLineSegment(ctx, x1, y1, x2, y2);
    }
}
function drawPolarSegments(ctx, fth, tr, tarr) {
    var fx = function(t) {
        return tr(t) * Math.cos(fth(t));
    }

    var fy = function(t) {
        return tr(t) * Math.sin(fth(t));
    }

    drawParametricSegments(ctx, fx, fy, tarr);
}

/// Draw Dots

function drawDot(ctx, x, y, radius) {


    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}

function drawParametricDots(ctx, fx, fy, fradius, tarr) {
    for (var i=0; i<(tarr.length - 1); i++) {
        var radius = fradius(tarr[i]);
        var x = fx(tarr[i]);
        var y = fy(tarr[i]);
        drawDot(ctx, x, y, radius);
    }
}

function drawPolarDots(ctx, fth, tr, fradius, tarr) {
    var fx = function(t) {
        return tr(t) * Math.cos(fth(t));
    }

    var fy = function(t) {
        return tr(t) * Math.sin(fth(t));
    }

    drawParametricDots(ctx, fx, fy, fradius, tarr);
}

// Draw Misc 

function drawCircle(ctx, R, x, y) {
    drawParametric(ctx, function(t){
        return R * Math.cos(t) + x;
    }, function(t) {
        return R * Math.sin(t) + y;
    }, createRange(0, 2 * Math.PI, 100))
}

function drawX(ctx, size, x, y) {
    var halfSize = size / 2.0;

    drawParametric(ctx, function(t){
        return t + x
    }, function(t) {
        return t + y;
    }, createRange(-halfSize, halfSize, 2));


    drawParametric(ctx, function(t){
        return t + x
    }, function(t) {
        return -t + y;
    }, createRange(-halfSize, halfSize, 2));
}

function drawMarker(ctx, size, x, y) {
    drawCircle(ctx, size, x, y);
    drawX(ctx, 0.5 * size * Math.sqrt(2), x, y);
}

function drawField(ctx, fx, fy, fsize, tRange, uRange) {
    tuRange = crossProductArr(tRange, uRange);

    for (var i=0; i<tuRange.length; i++) {
        var t = tuRange[i][0];
        var u = tuRange[i][1];
        var x = fx(t, u);
        var y = fy(t, u);
        var size = fsize(t, u);
        drawDot(ctx, x, y, size);
    }

    for (var i=0; i<(tRange.length - 1); i++) {
        for (var j=0; j<(uRange.length - 1); j++) {
            var t = tRange[i];
            var u = uRange[j];
            var x = fx(t, u);
            var y = fy(t, u);
            var tNext = tRange[i + 1];
            var uNext = uRange[j + 1];
            
            var xRight = fx(tNext, u);
            var yRight = fy(tNext, u);

            var xBottom = fx(t, uNext);
            var yBottom = fy(t, uNext);

            drawLineSegment(ctx, x, y, xRight, yRight);
            drawLineSegment(ctx, x, y, xBottom, yBottom);
        }
    }    
}

// Range Util

// TODO(vivek): Create non-linear ranges. 
function createRange(low, high, N) {
    var delta = (high - low);
    var step = delta / N;
    var arr = [];

    for (var i=0; i<(N+1); i++) {
        arr.push(low + step * i);
    }

    return arr;
}

function remap(prevLow, prevHigh, newLow, newHigh) {
    return function(t) {
        var prevDiff = (prevHigh - prevLow);
        var newT = ((t - prevLow) / prevDiff);
        var newDiff = (newHigh - newLow);
        return newLow + newT * newDiff;
    }
}

function oscillation(low, high, period) {
    var diff = high - low;
    return function(t) {
        return diff * (1 - normalizedCos(Math.PI * 2 * t / period)) + low;
    }
}

function crossProductArr(A, B) {
    var outputArr = [];
    for (var i=0; i<A.length; i++) {
        for (var j=0; j<B.length; j++) {
            outputArr.push([A[i], B[j]]);
        }
    }
    return outputArr;
}

// Interpolation 

function interpolateValue(A, B) {
    return function(t) {
        return ((1 - t) * A) + (t * B);
    }
}

function interpolateFunc(f, g) {
    return function(t) {
        return function() {
            return interpolateValue(f.apply(null, arguments), g.apply(null, arguments))(t);
        }
    }
}

function normalizedSin(t) {
    return ((Math.sin(t) + 1) * 0.5);
}

function normalizedCos(t) {
    return ((Math.cos(t) + 1) * 0.5);
}

// Draw 3D

function _projectedPoint(point) {
    var x = point[0] / point[3];
    var y = point[1] / point[3];
    return [x, y];
}

function drawParametric3D(ctx, fx, fy, fz, transform, tarr) {
    ctx.beginPath();
    for (var i=0; i<tarr.length; i++) {
        var x = fx(tarr[i]);
        var y = fy(tarr[i]);
        var z = fz(tarr[i]);

        var point = [x, y, z, 1];
        var transformedPoint = _mutliplyMatrixVector(transform, point);

        var projPoint = _projectedPoint(transformedPoint);

        var newX = projPoint[0];
        var newY = projPoint[1];

        if (i == 0) {
            ctx.moveTo(newX, newY);
        }
        else {
            ctx.lineTo(newX, newY);
        }
    }
    ctx.stroke();
}

var i = 0;

function drawLine3D(ctx, p1, p2, transform) {
    var p1Copy = p1.slice();
    var p2Copy = p2.slice();

    p1Copy.push(1);
    p2Copy.push(1);

    var tp1 = _mutliplyMatrixVector(transform, p1Copy);
    var tp2 = _mutliplyMatrixVector(transform, p2Copy);
    if ((i++) % 30 == 0) {
        console.log(tp1);
    }

    if (tp1[DIM_W] <= 0 || tp2[DIM_W] <= 0) {
        return;
    }


    var projPoint1 = _projectedPoint(tp1);
    var projPoint2 = _projectedPoint(tp2);

    ctx.beginPath();
    ctx.moveTo(projPoint1[0], projPoint1[1]);
    ctx.lineTo(projPoint2[0], projPoint2[1]);
    ctx.stroke(); 
}

function CreateCubeLinePoints() {
    function _createCubeLineFuncs() {
        function _createConstFunc(c) {
            return function(t) {
                return c;
            }
        }

        function _arrayInsert(arr, index, elem) {
            var arrCopy = arr.slice();
            arrCopy.splice(index, 0, elem);
            return arrCopy;
        }

        var constFuncs = [_createConstFunc(1), _createConstFunc(-1)];
        var lineDataArray = crossProductArr([0, 1, 2], crossProductArr(constFuncs, constFuncs));
        return lineDataArray.map(function(lineData) {
            return _arrayInsert(lineData[1], lineData[0], function(t) {return t;});
        });
    }
    
    var lineFuncs = _createCubeLineFuncs();
    return lineFuncs.map(function(farr) {
        function _evaluate(c) {
            return function(f) {
                return f(c);
            }
        }
        return [
            farr.map(_evaluate(-1)),
            farr.map(_evaluate(1))
        ]
    })
}


// 3D Object Nodes

function CreateAbstractNode() {
    var data = {};
    // TODO(vivek): use one matrix to store transform. Its up to clients to tranform object in correct order. 
    data.scaleTransform = Transform3DIdentity();
    data.positionTransform = Transform3DIdentity();
    data.rotationTransform = Transform3DIdentity();
    data.draw = function(ctx, projectionFromModel) {
        
    }.bind(data);

    data.rotate = function(axis, angle) {
        var axisVec = _normalize(axis);
        this.rotationTransform = Transform3DRotation(axisVec, angle);
    }.bind(data);

    data.position = function(coordinates) {
        this.positionTransform = Transform3DTranslation(coordinates);
    }.bind(data);

    data.scale = function(factor) {
        this.scaleTransform = Transform3DScale(factor);
    }.bind(data);

    data.localTransform = function() {
        return _matrixMultiply(this.positionTransform, _matrixMultiply(this.rotationTransform, this.scaleTransform));
    }.bind(data);

    return data;   
}

function CreateCubeNode() {
    var data = CreateAbstractNode();
    data.linePoints = CreateCubeLinePoints();
    data.draw = function(ctx, projectionFromModel) {
        var transform = _matrixMultiply(projectionFromModel, this.localTransform());
        this.linePoints.map(function(points){
            drawLine3D(ctx, points[0], points[1], transform);
        })
    }.bind(data);
    return data;
}

function CreateSphereNode(parallels, meridians) {
    function _drawRing(ctx, radius, ypos, transform) {
        drawParametric3D(ctx, function(t){
            return radius * Math.cos(t);
        }, function(t){
            return ypos;
        }, function(t){
            return radius * Math.sin(t);
        }, transform, createRange(0, 2 * Math.PI, meridians))
    }

    var data = CreateAbstractNode();
    data.draw = function(ctx, projectionFromModel) {
        var transform = _matrixMultiply(projectionFromModel, this.localTransform());
        var rows = createRange(-0.9, 0.9, parallels);
        rows.map(function(r){
            var angle = Math.acos(r);
            var radius = Math.sin(angle);
            _drawRing(ctx, radius, r, transform);
        });
    }.bind(data);

    return data;
}


// Animation Util

function CreateAnimation(drawFrame) {
    var animationStart = -1;
    var continueAnimation = false;
    var previousTimestamp = 0;
    var animWrapper = function(currentTimestamp) {
        if (previousTimestamp == 0) {
            previousTimestamp = currentTimestamp;
        }

        if (animationStart == -1) {
            animationStart = currentTimestamp;
        }

        var relativeTimestamp = currentTimestamp - animationStart;
        var duration = currentTimestamp - previousTimestamp;
        previousTimestamp = currentTimestamp;


        drawFrame(relativeTimestamp, duration);

        if (continueAnimation) {
            requestAnimationFrame(animWrapper);
        }
    }

    var startAnimation = function() {
        continueAnimation = true;
        requestAnimationFrame(animWrapper);  
    }

    var stopAnimation = function() {
        continueAnimation = false;
    }

    return {
        'start': startAnimation,
        'stop': stopAnimation,
    }
}

// Renaming constructor to make more sense for a game
var CreateRunLoop = CreateAnimation;
