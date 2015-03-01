var PolygonSubdivision;
(function (PolygonSubdivision) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    })();
    PolygonSubdivision.Point = Point;
    var WeightedPoint = (function () {
        function WeightedPoint(point, weight) {
            this.point = point;
            this.weight = weight;
        }
        return WeightedPoint;
    })();
    PolygonSubdivision.WeightedPoint = WeightedPoint;
    var ChaikinCurve = (function () {
        function ChaikinCurve() {
        }
        ChaikinCurve.prototype.subdivide = function (points, epsilon) {
            do {
                var numOfPoints = points.length;
                points.push(points[0]);
                for (var i = 1; i < (numOfPoints - 1); i += 1) {
                    var j = i - 1;
                    var p1 = points[j];
                    var p2 = points[j + 1];
                    var weightedPoints = new Array();
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 1));
                    points.push(this.affineCombination(weightedPoints));
                    var p3 = points[j + 2];
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 6));
                    weightedPoints.push(new WeightedPoint(p3, 1));
                    points.push(this.affineCombination(weightedPoints));
                }
                var k = numOfPoints - 2;
                var p4 = points[k];
                var p5 = points[k + 1];
                var weightedPoints = new Array();
                weightedPoints.push(new WeightedPoint(p4, 1));
                weightedPoints.push(new WeightedPoint(p5, 1));
                points.push(this.affineCombination(weightedPoints));
                points.push(points[numOfPoints - 1]);
                for (var l = 0; l < numOfPoints; ++l)
                    points.shift();
            } while (--epsilon > 0);
            return points;
        };
        ChaikinCurve.prototype.affineCombination = function (weightedPoints) {
            var result = new Point(0, 0);
            var sum = 0;
            for (var i = 0; i < weightedPoints.length; i++) {
                sum += weightedPoints[i].weight;
            }
            for (var j = 0; j < weightedPoints.length; j++) {
                result = this.plus(result, this.scale(weightedPoints[j].point, weightedPoints[j].weight / sum));
            }
            return result;
        };
        ChaikinCurve.prototype.plus = function (point1, point2) {
            return new Point(point1.x + point2.x, point1.y + point2.y);
        };
        ChaikinCurve.prototype.scale = function (point, scale) {
            return new Point(point.x * scale, point.y * scale);
        };
        return ChaikinCurve;
    })();
    PolygonSubdivision.ChaikinCurve = ChaikinCurve;
    var BezierCurve = (function () {
        function BezierCurve() {
        }
        BezierCurve.prototype.subdivide = function (controlPoints, epsilon) {
            var results = new Array();
            var startPoint = controlPoints[0];
            var point1 = controlPoints[1];
            var point2 = controlPoints[2];
            var endPoint = controlPoints[3];
            for (var i = 0; i < epsilon; i += 0.01) {
                var ptOnCurve = this.getCubicBezierPointatIndex(startPoint, point1, point2, endPoint, i);
                results.push(ptOnCurve);
            }
            return results;
        };
        BezierCurve.prototype.getCubicBezierPointatIndex = function (startPt, controlPt1, controlPt2, endPt, T) {
            var x = this.CubicN(T, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
            var y = this.CubicN(T, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
            return new Point(x, y);
        };
        BezierCurve.prototype.CubicN = function (T, a, b, c, d) {
            var t2 = T * T;
            var t3 = t2 * T;
            return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3;
        };
        return BezierCurve;
    })();
    PolygonSubdivision.BezierCurve = BezierCurve;
    var PolylineSimplify = (function () {
        function PolylineSimplify() {
        }
        PolylineSimplify.prototype.getSqDist = function (p1, p2) {
            var dx = p1.x - p2.x, dy = p1.y - p2.y;
            return dx * dx + dy * dy;
        };
        PolylineSimplify.prototype.getSqSegDist = function (p, p1, p2) {
            var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
            if (dx !== 0 || dy !== 0) {
                var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
                if (t > 1) {
                    x = p2.x;
                    y = p2.y;
                }
                else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }
            dx = p.x - x;
            dy = p.y - y;
            return dx * dx + dy * dy;
        };
        PolylineSimplify.prototype.simplifyRadialDist = function (points, epsilon) {
            var prevPoint = points[0], newPoints = [prevPoint], point;
            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];
                if (this.getSqDist(point, prevPoint) > epsilon) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }
            if (prevPoint !== point)
                newPoints.push(point);
            return newPoints;
        };
        PolylineSimplify.prototype.simplifyDouglasPeucker = function (points, epsilon) {
            var len = points.length, MarkerArray, markers = new Uint8Array(len), first = 0, last = len - 1, stack = [], newPoints = [], i, maxSqDist, sqDist, index;
            markers[first] = markers[last] = 1;
            while (last) {
                maxSqDist = 0;
                for (i = first + 1; i < last; i++) {
                    sqDist = this.getSqSegDist(points[i], points[first], points[last]);
                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }
                if (maxSqDist > epsilon) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }
                last = stack.pop();
                first = stack.pop();
            }
            for (i = 0; i < len; i++) {
                if (markers[i])
                    newPoints.push(points[i]);
            }
            return newPoints;
        };
        PolylineSimplify.prototype.simplify = function (points, tolerance, highestQuality) {
            if (points.length <= 1)
                return points;
            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
            points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
            points = this.simplifyDouglasPeucker(points, sqTolerance);
            return points;
        };
        return PolylineSimplify;
    })();
    PolygonSubdivision.PolylineSimplify = PolylineSimplify;
})(PolygonSubdivision || (PolygonSubdivision = {}));
var Curves;
(function (Curves) {
    Curves.controlPointLayer;
    Curves.controlLineLayer;
    Curves.simplifiedPoints;
    Curves.kineticControlPoints;
    Curves.stage;
    Curves.lineTolerance;
    Curves.drawPoints;
    Curves.subdivisionPoint;
    Curves.chaikinCurve;
    Curves.bezierCurve;
    Curves.polylineSimplify;
    Curves.curveControl;
    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            Curves.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            Curves.controlPointLayer = new Kinetic.Layer();
            Curves.controlLineLayer = new Kinetic.Layer();
            Curves.simplifiedPoints = new Array();
            Curves.kineticControlPoints = new Array();
            Curves.chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            Curves.bezierCurve = new PolygonSubdivision.BezierCurve();
            Curves.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            Curves.drawPoints = new Array();
            this.curvePoints = new Array();
            this.controlPoints = new Array();
            Curves.lineTolerance = 1.0;
            Curves.curveControl = this;
        }
        CurveControl.prototype.getCurvePoints = function () {
            return this.curvePoints;
        };
        CurveControl.prototype.renderControlPoints = function () {
            console.log('hiding control points');
            Curves.stage.clear();
        };
        CurveControl.prototype.createControlPoint = function (x, y) {
            var controlPoint = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                text: 'p1',
                draggable: true
            });
            return controlPoint;
        };
        CurveControl.prototype.setLineTolerance = function (lineTolerance) {
            Curves.simplifiedPoints = Curves.polylineSimplify.simplify(Curves.drawPoints, lineTolerance, true);
            this.curvePoints = Curves.simplifiedPoints;
            Curves.stage.clear();
            Curves.controlLineLayer.removeChildren();
            Curves.controlPointLayer.removeChildren();
            var kineticLinePoints = [];
            Curves.kineticControlPoints.length = 0;
            for (var i = 0; i < Curves.simplifiedPoints.length; i++) {
                var x = Curves.simplifiedPoints[i].x;
                var y = Curves.simplifiedPoints[i].y;
                kineticLinePoints.push(x);
                kineticLinePoints.push(y);
                var kineticControlPoint = new Kinetic.Circle({
                    x: x,
                    y: y,
                    radius: 10,
                    stroke: '#666',
                    fill: '#ddd',
                    strokeWidth: 2,
                    draggable: true
                });
                kineticControlPoint.on('dragmove  touchmove', function () {
                    Curves.curveControl.updateControlLines();
                });
                Curves.kineticControlPoints.push(kineticControlPoint);
                Curves.controlPointLayer.add(kineticControlPoint);
            }
            var redLine = new Kinetic.Line({
                points: kineticLinePoints,
                stroke: "red",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = Curves.chaikinCurve.subdivide(Curves.simplifiedPoints, 7);
            for (var j in curvePoints) {
                plotpoints.push(curvePoints[j].x);
                plotpoints.push(curvePoints[j].y);
            }
            var blueLine = new Kinetic.Line({
                points: plotpoints,
                stroke: "#ADD8E6",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(blueLine);
            Curves.controlLineLayer.drawScene();
            Curves.controlPointLayer.drawScene();
            Curves.stage.add(Curves.controlPointLayer);
            Curves.stage.add(Curves.controlLineLayer);
            var customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent('pointEditListener', true, true, curvePoints);
            document.dispatchEvent(customEvent);
        };
        CurveControl.prototype.updateControlLines = function () {
            Curves.controlLineLayer.removeChildren();
            Curves.controlPointLayer.drawScene();
            var simplifiedPoints = new Array();
            var kineticLinePoints = [];
            for (var i in Curves.kineticControlPoints) {
                var x = Curves.kineticControlPoints[i].getAbsolutePosition().x;
                var y = Curves.kineticControlPoints[i].getAbsolutePosition().y;
                var point = new PolygonSubdivision.Point(x, y);
                simplifiedPoints.push(point);
                kineticLinePoints.push(x);
                kineticLinePoints.push(y);
            }
            var redLine = new Kinetic.Line({
                points: kineticLinePoints,
                stroke: 'red',
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = Curves.chaikinCurve.subdivide(simplifiedPoints, 7);
            console.log('number of curve Points = ' + JSON.stringify(curvePoints.length));
            this.curvePoints = curvePoints;
            for (var j in curvePoints) {
                plotpoints.push(curvePoints[j].x);
                plotpoints.push(curvePoints[j].y);
            }
            var blueLine = new Kinetic.Line({
                points: plotpoints,
                stroke: "#ADD8E6",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(blueLine);
            Curves.controlLineLayer.drawScene();
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('pointEditListener', true, true, curvePoints);
            document.dispatchEvent(event);
        };
        CurveControl.prototype.drawBesizerCurve = function (controlPoints) {
            var curvePoints = Curves.bezierCurve.subdivide(controlPoints, 1);
            return curvePoints;
        };
        CurveControl.prototype.drawLine = function () {
            Curves.lineTolerance = 0;
            Curves.stage.clear();
            Curves.drawPoints.length = 0;
            var layer = new Kinetic.Layer();
            var background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: Curves.stage.getWidth(),
                height: Curves.stage.getHeight(),
                fill: "transparent"
            });
            layer.add(background);
            layer.draw();
            Curves.stage.add(layer);
            layer.draw();
            var isMouseDown = false;
            var newline;
            var points = new Array();
            var tempPoints = [];
            background.on('mousedown touchstart', function () {
                isMouseDown = true;
                console.log('mouse down from curve control');
                tempPoints = [];
                points.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                tempPoints = [];
                tempPoints.push(Curves.stage.getPointerPosition().x);
                tempPoints.push(Curves.stage.getPointerPosition().y);
                var line = new Kinetic.Line({
                    points: tempPoints,
                    stroke: "blue",
                    strokeWidth: 1,
                    lineCap: 'round',
                    lineJoin: 'round'
                });
                layer.add(line);
                newline = line;
            });
            background.on('mouseup touchend', function () {
                isMouseDown = false;
                console.log('mouse up from curve control');
                this.curvePoints = Curves.polylineSimplify.simplify(points, Curves.lineTolerance, true);
                var newpoints = Curves.polylineSimplify.simplify(points, Curves.lineTolerance, true);
                var event = document.createEvent('CustomEvent');
                event.initCustomEvent('pointEditListener', true, true, newpoints);
                document.dispatchEvent(event);
            });
            background.on('mousemove touchmove', function () {
                if (!isMouseDown) {
                    return;
                }
                ;
                points.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                Curves.drawPoints.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                tempPoints.push(Curves.stage.getPointerPosition().x);
                tempPoints.push(Curves.stage.getPointerPosition().y);
                layer.drawScene();
            });
            Curves.stage.add(layer);
            return points;
        };
        return CurveControl;
    })();
    Curves.CurveControl = CurveControl;
})(Curves || (Curves = {}));
var Figure;
(function (Figure) {
    var b2m = Box2D.Common.Math;
    var b2d = Box2D.Dynamics;
    var b2s = Box2D.Collision.Shapes;
    var b2j = Box2D.Dynamics.Joints;
    var globalRestitution = .1;
    var globalFriction = 0.01;
    var globalDensity = .1;
    var rotationAngle = 0.0;
    var body, wheel1, wheel2;
    var bodies = new Array();
    var sprite;
    var spriteSheetData;
    var container;
    var frameCntr = 0;
    var _action;
    var skierSpriteSheetData = {
        images: ["images/skier.png"],
        frames: { width: 195, height: 175, count: 140 },
        animations: {
            left: _.range(0, 9),
            right: _.range(10, 19),
            left_trick1: _.range(20, 41),
            right_trick1: _.range(42, 61),
            left_trick2: _.range(62, 85),
            right_trick2: _.range(86, 105),
            left_crash: _.range(106, 123),
            right_crash: _.range(124, 141)
        },
        imageoffset: {
            regX: 75,
            regY: 140
        }
    };
    var skaterSpriteSheetData = {
        images: ["images/skateboarder.png"],
        frames: { width: 145, height: 150, count: 140 },
        animations: {
            left: _.range(0, 9),
            right: _.range(10, 19),
            left_trick1: _.range(20, 34),
            right_trick1: _.range(35, 49),
            left_trick2: _.range(50, 69),
            right_trick2: _.range(70, 97),
            left_crash: _.range(98, 119),
            right_crash: _.range(121, 139)
        },
        imageoffset: {
            regX: 75,
            regY: 125
        }
    };
    var snowboarderSpriteSheetData = {
        images: ["images/snowboarder.png"],
        frames: { width: 151, height: 145, count: 140, },
        animations: {
            left: _.range(0, 9),
            right: _.range(10, 19),
            left_trick1: _.range(20, 34),
            right_trick1: _.range(35, 49),
            left_trick2: _.range(50, 69),
            right_trick2: _.range(70, 97),
            left_crash: _.range(98, 119),
            right_crash: _.range(121, 139)
        },
        imageoffset: {
            regX: 75,
            regY: 105
        }
    };
    var FigureControl = (function () {
        function FigureControl(stageContainer, world, scale) {
            var _this = this;
            this.impulse = function (figurePower) {
                var power = figurePower;
                var velocity = Math.round(body.GetLinearVelocity().x * 100) / 100;
                if (velocity < 0) {
                    power = -Math.abs(power);
                }
                else {
                    power = Math.abs(power);
                }
                var angle = rotationAngle;
                console.log("applying " + power + " power, at " + angle + " angle");
                var impulse = new b2m.b2Vec2(power * Math.cos(angle * Math.PI / 180), power * Math.sin(angle * Math.PI / 180));
                body.ApplyImpulse(impulse, body.GetWorldCenter());
                var speed = body.GetLinearVelocity().Length();
            };
            this.stopMotion = function () {
                console.log("stopping figure" + body.GetPosition().x);
                body.ApplyForce(body.GetMass() * -_this.world.GetGravity(), body.GetWorldCenter());
                body.SetLinearDamping(0);
                body.SetAngularDamping(0);
                body.SetAngularVelocity(0);
                body.SetLinearVelocity(new b2m.b2Vec2(0, 0));
                body.SetSleepingAllowed(true);
                body.SetAwake(false);
                wheel1.ApplyForce(wheel1.GetMass() * -_this.world.GetGravity(), wheel1.GetWorldCenter());
                wheel1.SetLinearDamping(0);
                wheel1.SetAngularDamping(0);
                wheel1.SetAngularVelocity(0);
                wheel1.SetLinearVelocity(new b2m.b2Vec2(0, 0));
                wheel1.SetSleepingAllowed(true);
                wheel1.SetAwake(false);
                wheel2.SetLinearDamping(0);
                wheel2.SetAngularDamping(0);
                wheel2.SetAngularVelocity(0);
                wheel2.SetLinearVelocity(new b2m.b2Vec2(0, 0));
                wheel2.SetSleepingAllowed(true);
                wheel2.SetAwake(false);
            };
            var self = this;
            container = stageContainer;
            this.world = world;
            this.scale = scale;
        }
        FigureControl.prototype.setAction = function (action) {
            _action = action;
        };
        FigureControl.prototype.p2m = function (n) {
            return n / this.scale;
        };
        FigureControl.prototype.animateFigure = function (event) {
            var direction;
            var deltaY = wheel2.GetPosition().y - wheel1.GetPosition().y;
            var deltaX = wheel2.GetPosition().x - wheel1.GetPosition().x;
            rotationAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            sprite.rotation = rotationAngle;
            sprite.x = (body.GetPosition().x * 30);
            sprite.y = (body.GetPosition().y * 30);
            var i = frameCntr;
            var frame_count = 9;
            var action;
            var velocity = Math.round(body.GetLinearVelocity().x * 100) / 100;
            (velocity < 0) ? direction = "left" : direction = "right";
            if (_action) {
                action = direction.concat(_action);
            }
            else {
                action = direction;
            }
            switch (action) {
                case "left":
                    frame_count = spriteSheetData.animations.left.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.left[i]);
                    break;
                case "right":
                    frame_count = spriteSheetData.animations.right.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.right[i]);
                    break;
                case "left_trick1":
                    frame_count = spriteSheetData.animations.left_trick1.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.left_trick1[i]);
                    break;
                case "right_trick1":
                    frame_count = spriteSheetData.animations.right_trick1.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.right_trick1[i]);
                    break;
                case "left_trick2":
                    frame_count = spriteSheetData.animations.left_trick2.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.left_trick2[i]);
                    break;
                case "right_trick2":
                    frame_count = spriteSheetData.animations.right_trick2.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.right_trick2[i]);
                    break;
                case "left_crash":
                    frame_count = spriteSheetData.animations.left_crash.length;
                    sprite.gotoAndStop(spriteSheetData.animations.left_crash[i]);
                    break;
                case "right_crash":
                    frame_count = spriteSheetData.animations.right_crash.length;
                    sprite.gotoAndStop(spriteSheetData.animations.right_crash[i]);
                    break;
                default:
                    frame_count = spriteSheetData.animations.left.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.left[i]);
            }
            frameCntr++;
            if (frameCntr >= frame_count) {
                frameCntr = 0;
                _action = null;
            }
            var speed = body.GetLinearVelocity().x;
            speed = Math.floor(speed);
            speed = Math.abs(speed);
        };
        FigureControl.prototype.createBall = function (x, y) {
            var ballDef = new b2d.b2BodyDef();
            ballDef.type = b2d.b2Body.b2_dynamicBody;
            ballDef.position.x = x / this.scale;
            ballDef.position.y = y / this.scale;
            ballDef.userData = 'ball';
            var fixDef = new b2d.b2FixtureDef();
            fixDef.userData = 'ball';
            fixDef.density = globalDensity;
            fixDef.friction = globalFriction;
            fixDef.restitution = globalRestitution;
            fixDef.shape = new b2s.b2CircleShape(30 / this.scale);
            fixDef.userData = 'ball';
            var body = this.world.CreateBody(ballDef);
            body.SetBullet(true);
            body.CreateFixture(fixDef);
            bodies.push(body);
            return body;
        };
        FigureControl.prototype.createSpritePlatform = function (x, y) {
            var rectangleDef = new b2d.b2BodyDef();
            rectangleDef.type = b2d.b2Body.b2_dynamicBody;
            rectangleDef.position.x = x / this.scale;
            rectangleDef.position.y = y / this.scale;
            body = this.world.CreateBody(rectangleDef);
            body.SetBullet(true);
            var fixDef = new b2d.b2FixtureDef();
            var rectanglurShape = new b2s.b2PolygonShape();
            rectanglurShape.SetAsBox(1.0, 0.1);
            fixDef.shape = rectanglurShape;
            fixDef.density = globalDensity;
            fixDef.friction = globalFriction;
            fixDef.restitution = globalRestitution;
            body.CreateFixture(fixDef);
            var wheelDef = new b2d.b2BodyDef();
            wheelDef.type = b2d.b2Body.b2_dynamicBody;
            wheelDef.position.x = x / this.scale;
            wheelDef.position.y = y / this.scale;
            var wheelFixDef = new b2d.b2FixtureDef;
            wheelFixDef.density = globalDensity;
            wheelFixDef.friction = globalFriction;
            wheelFixDef.restitution = globalRestitution;
            wheelFixDef.shape = new b2s.b2CircleShape(0.4);
            wheel1 = this.world.CreateBody(wheelDef);
            wheel1.CreateFixture(wheelFixDef);
            wheel2 = this.world.CreateBody(wheelDef);
            wheel2.CreateFixture(wheelFixDef);
            var jointDef = new b2j.b2RevoluteJointDef();
            jointDef.bodyA = body;
            jointDef.bodyB = wheel1;
            jointDef.motorSpeed = 1000;
            jointDef.enableMotor = true;
            jointDef.enableLimit = true;
            jointDef.localAnchorA.Set(-1.0, 0);
            this.world.CreateJoint(jointDef);
            jointDef.bodyA = body;
            jointDef.bodyB = wheel2;
            jointDef.localAnchorA.Set(1.0, 0);
            this.world.CreateJoint(jointDef);
            bodies.push(wheel1);
            bodies.push(wheel2);
            bodies.push(body);
            return body;
        };
        FigureControl.prototype.createFigure = function (figure, x, y) {
            var body;
            if (figure == 'Rolling Ball') {
                body = this.createBall(x, y);
                body.SetUserData('ball');
            }
            else {
                var spriteSheet;
                switch (figure) {
                    case 'Skateboarder':
                        spriteSheetData = skaterSpriteSheetData;
                        break;
                    case 'Snowboarder':
                        spriteSheetData = snowboarderSpriteSheetData;
                        break;
                    case 'Freestyle Skier':
                        spriteSheetData = skierSpriteSheetData;
                        break;
                }
                spriteSheet = new createjs.SpriteSheet(spriteSheetData);
                sprite = new createjs.Sprite(spriteSheet);
                sprite.regX = spriteSheetData.imageoffset.regX;
                sprite.regY = spriteSheetData.imageoffset.regY;
                sprite.scaleX = .5;
                sprite.scaleY = .5;
                sprite.tickEnabled = true;
                container.addChild(sprite);
                createjs.Ticker.setFPS(7);
                createjs.Ticker.on("tick", this.animateFigure, sprite);
                body = this.createSpritePlatform(x, y);
                body.SetUserData(sprite);
            }
            return body;
        };
        FigureControl.prototype.removeFigure = function () {
            while (bodies.length) {
                var body = bodies.pop();
                this.world.DestroyBody(body);
            }
            container.removeAllChildren();
        };
        return FigureControl;
    })();
    Figure.FigureControl = FigureControl;
})(Figure || (Figure = {}));
window.addEventListener('load', function () {
    var canvas = document.getElementById("canvas");
    canvas.width = (document.documentElement.offsetWidth - 150);
    canvas.height = (document.documentElement.clientHeight - 150);
    var slopePhysics = new SlopePhysics.Main(canvas);
    var gravityRange = new Slider("#gravity-range", {
        reversed: true
    });
    gravityRange.on("slide", function (event) {
        slopePhysics.changeGravity(event.value);
    });
    var lineSimplification = new Slider("#line-simplification");
    lineSimplification.on("slide", function (event) {
        slopePhysics.lineSimplificaton(event.value);
    });
});
var SlopePhysics;
(function (SlopePhysics) {
    var b2m = Box2D.Common.Math;
    var b2d = Box2D.Dynamics;
    var b2s = Box2D.Collision.Shapes;
    var myCanvas;
    var stage;
    var context;
    var canvasW;
    var canvasH;
    var figurePower;
    SlopePhysics.curveControl;
    SlopePhysics.subdivisionPoint;
    SlopePhysics.chaikinCurve;
    SlopePhysics.polylineSimplify;
    SlopePhysics.bezierCurve;
    SlopePhysics.figureControl;
    var lineTolerance = 1.0;
    var surfaces = new Array();
    var surfacePoints = new Array();
    var startingPoint;
    var figure = "";
    var gravity = 9.81;
    SlopePhysics.world;
    SlopePhysics.inEditMode = false;
    SlopePhysics.scale = 30;
    SlopePhysics.step = 20;
    var surfaceFriction = 0.001;
    var surfaceDensity = 1.0;
    var Main = (function () {
        function Main(canvas) {
            this.figure = "Skateboarder";
            this.createFigure = function (figure) {
                SlopePhysics.figureControl.removeFigure();
                var body = SlopePhysics.figureControl.createFigure(figure, startingPoint.x + 20, startingPoint.y - 10);
                if (body.GetUserData() !== 'ball') {
                    var sprite = body.GetUserData();
                }
            };
            this.clearSurfaces = function () {
                while (surfaces.length) {
                    var surface = surfaces.pop();
                    SlopePhysics.world.DestroyBody(surface);
                }
                stage.update();
            };
            var self = this;
            myCanvas = canvas;
            stage = new createjs.Stage(myCanvas);
            stage.mouseEnabled = true;
            createjs.Touch.enable(stage);
            var container = new createjs.Container();
            stage.addChild(container);
            stage.setChildIndex(container, stage.getNumChildren() - 1);
            context = myCanvas.getContext("2d");
            canvasW = myCanvas.width;
            canvasH = myCanvas.height;
            SlopePhysics.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            SlopePhysics.bezierCurve = new PolygonSubdivision.BezierCurve;
            SlopePhysics.curveControl = new Curves.CurveControl("container", canvasW, canvasH);
            var worldGravity = new b2m.b2Vec2(0, gravity);
            var doSleep = true;
            SlopePhysics.world = new b2d.b2World(worldGravity, doSleep);
            SlopePhysics.figureControl = new Figure.FigureControl(container, SlopePhysics.world, SlopePhysics.scale);
            figurePower = 50;
            $(window).resize(function () {
                self.onResizeHandler();
            });
            $("#btnReload").on('click', function (e) {
                self.createFigure(self.figure);
            });
            $("#btnSettings").on('click', function (e) {
                $('#figure-select').toggle();
                $('#btnBezier').toggle();
                $('#btnDraw').toggle();
                $('#line-slider').toggle();
                $('#gravity-range-slider').toggle();
            });
            $(document).on('click', '.dropdown-menu li a', function () {
                self.figure = $(this).text();
                self.createFigure(self.figure);
            });
            $("#btnDraw").on('click', function (e) {
                self.createDrawnSurface();
            });
            $("#btnBezier").on('click', function (e) {
                self.createBezierSurface();
            });
            $("#container").on('tap doubletap press', function (e) {
                self.eventAction(e);
            });
            this.createBezierSurface();
            this.createContactListener();
            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);
        }
        Main.prototype.settings = function () {
            if (!SlopePhysics.inEditMode) {
                SlopePhysics.curveControl.renderControlPoints();
            }
            SlopePhysics.inEditMode = !SlopePhysics.inEditMode;
        };
        Main.prototype.createContactListener = function () {
            var b2Listener = Box2D.Dynamics.b2ContactListener;
            var listener = new b2Listener;
            listener.BeginContact = function (contact) {
            };
            listener.EndContact = function (contact) {
            };
            listener.PostSolve = function (contact, impulse) {
                if (contact.GetFixtureA().GetBody().GetUserData() == 'flat-surface' || contact.GetFixtureB().GetBody().GetUserData() == 'ball') {
                    var impulseA = impulse.normalImpulses[0];
                    var impulseB = impulse.normalImpulses[1];
                    if (impulseA > 80.0) {
                        SlopePhysics.figureControl.stopMotion();
                        SlopePhysics.figureControl.setAction("_crash");
                        console.log("impulseA = " + impulseA);
                        console.log("impulseB = " + impulseB);
                    }
                }
            };
            listener.PreSolve = function (contact, oldManifold) {
            };
            SlopePhysics.world.SetContactListener(listener);
        };
        Main.prototype.createDrawnSurface = function () {
            this.clearSurfaces();
            SlopePhysics.figureControl.removeFigure();
            this.createFlatSurface();
            var that = this;
            var listener = function (event) {
                that.clearSurfaces();
                var points = event.detail;
                startingPoint = points[0];
                that.setSurfacePoints(points);
            };
            document.addEventListener("pointEditListener", listener);
            SlopePhysics.inEditMode = true;
            SlopePhysics.curveControl.drawLine();
        };
        Main.prototype.createBezierSurface = function () {
            SlopePhysics.figureControl.removeFigure();
            this.clearSurfaces();
            this.createFlatSurface();
            var width = canvasW;
            var height = canvasH;
            var pt1x = 0;
            var pt1y = Math.floor(height / 16);
            var pt2x = Math.floor(width / 16);
            var pt2y = Math.floor(height);
            var pt3x = Math.floor(15 * (width / 16));
            var pt3y = Math.floor(height);
            var pt4x = width;
            var pt4y = Math.floor(height / 16);
            var controlPts = new Array();
            controlPts[0] = new PolygonSubdivision.Point(pt1x, pt1y);
            controlPts[1] = new PolygonSubdivision.Point(pt2x, pt2y);
            controlPts[2] = new PolygonSubdivision.Point(pt3x, pt3y);
            controlPts[3] = new PolygonSubdivision.Point(pt4x, pt4y);
            var points = SlopePhysics.curveControl.drawBesizerCurve(controlPts);
            startingPoint = points[0];
            this.setSurfacePoints(points);
        };
        Main.prototype.createFlatSurface = function () {
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = canvasW / 2 / SlopePhysics.scale;
            surfaceDef.position.y = canvasH / SlopePhysics.scale;
            surfaceDef.userData = 'flat-surface';
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = surfaceDensity;
            surfaceFixtureDef.friction = surfaceFriction;
            var shape = new b2s.b2PolygonShape();
            var width = canvasW / SlopePhysics.scale;
            var height = 0;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;
            var flatSurface = SlopePhysics.world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);
            console.log('surface created, width : ' + width + ', height : ' + height);
        };
        Main.prototype.tick = function () {
            var timeStep = 1 / 7;
            var velocityIterations = 2;
            var positionIterations = 19;
            draw();
            SlopePhysics.world.Step(timeStep, velocityIterations, positionIterations);
            stage.autoClear = false;
            stage.update();
        };
        Main.prototype.eventAction = function (e) {
            console.log(e.type);
            if (e.type == 'tap') {
                SlopePhysics.figureControl.setAction("_trick1");
            }
            else if (e.type == 'doubletap') {
                SlopePhysics.figureControl.setAction("_trick2");
            }
            else {
                console.log('pressing ...');
                figurePower = figurePower + 1;
                SlopePhysics.figureControl.impulse(figurePower);
            }
        };
        Main.prototype.changeGravity = function (value) {
            gravity = gravity + value;
            SlopePhysics.world.SetGravity(new b2m.b2Vec2(0, gravity));
        };
        Main.prototype.lineSimplificaton = function (value) {
            this.clearSurfaces();
            SlopePhysics.curveControl.setLineTolerance(value);
        };
        Main.prototype.setSurfacePoints = function (points) {
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.userData = 'curved-surface';
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = surfaceDensity;
            surfaceFixtureDef.friction = surfaceFriction;
            var shape = new b2s.b2PolygonShape();
            var ptArray = new Array();
            var x1, y1, x2, y2;
            var curvedSurface = SlopePhysics.world.CreateBody(surfaceDef);
            var ptOnCurve = points[0];
            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);
            for (var i = 1; i < points.length; i++) {
                var pt = points[i];
                x2 = this.p2m(pt.x);
                y2 = this.p2m(pt.y);
                var edgeShape = new b2s.b2PolygonShape();
                edgeShape.SetAsEdge(new b2m.b2Vec2(x1, y1), new b2m.b2Vec2(x2, y2));
                curvedSurface.CreateFixture2(edgeShape);
                x1 = x2;
                y1 = y2;
            }
            surfaces.push(curvedSurface);
        };
        Main.prototype.p2m = function (x) {
            return x / SlopePhysics.scale;
        };
        Main.prototype.onResizeHandler = function (event) {
            if (event === void 0) { event = null; }
            SlopePhysics.figureControl.removeFigure();
            this.clearSurfaces();
            var width = (document.documentElement.offsetWidth - 25);
            var height = (document.documentElement.clientHeight - 150);
            stage.canvas.width = width;
            stage.canvas.height = height;
            SlopePhysics.curveControl = new Curves.CurveControl('container', width, height);
            stage.update();
        };
        return Main;
    })();
    SlopePhysics.Main = Main;
    function applyDrag() {
        var H = 0.5;
        var bodies = SlopePhysics.world.GetBodyList();
        while (bodies) {
            var body = bodies.GetNext();
            var velocity = body.GetLinearVelocity();
        }
    }
    function draw() {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var deletionBuffer = 4;
        ctx.clearRect(0, 0, canvasW, canvasH);
        var node = SlopePhysics.world.GetBodyList();
        while (node) {
            var body = node;
            node = node.GetNext();
            var position = body.GetPosition();
            if (position.x < -deletionBuffer || position.x > (canvas.width + 4)) {
                SlopePhysics.world.DestroyBody(body);
                continue;
            }
            if (body.GetType() == b2d.b2Body.b2_staticBody) {
                var userData = body.GetUserData();
                if (userData == 'flat-surface') {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        var shapeType = shape.GetType();
                        fixture = fixture.GetNext();
                        var polygonShape = shape;
                        var x = polygonShape.GetVertices()[1].x - polygonShape.GetVertices()[0].x;
                        var y = polygonShape.GetVertices()[2].y - polygonShape.GetVertices()[1].y;
                        var pos = body.GetPosition();
                        ctx.save();
                        ctx.translate(pos.x * SlopePhysics.scale, pos.y * SlopePhysics.scale);
                        ctx.translate(-pos.x * SlopePhysics.scale, -pos.y * SlopePhysics.scale);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * SlopePhysics.scale) - (x * SlopePhysics.scale / 2)), ((pos.y * SlopePhysics.scale) - (y * SlopePhysics.scale / 2)), x * SlopePhysics.scale, y * SlopePhysics.scale);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * SlopePhysics.scale) - (x * SlopePhysics.scale / 2)), ((pos.y * SlopePhysics.scale) - (y * SlopePhysics.scale / 2)), x * SlopePhysics.scale, y * SlopePhysics.scale);
                        ctx.restore();
                    }
                }
                else if (userData == 'curved-surface') {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        fixture = fixture.GetNext();
                        ctx.beginPath();
                        ctx.lineWidth = 0.5;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        var vs = shape.GetVertices();
                        for (var i = 0; i < vs.length; i++) {
                            var x = vs[i].x * SlopePhysics.scale;
                            var y = vs[i].y * SlopePhysics.scale;
                            if (i == 0) {
                                ctx.moveTo(x, y);
                            }
                            else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.stroke();
                    }
                }
            }
            else if (body.GetType() == b2d.b2Body.b2_dynamicBody) {
                var userData = body.GetUserData();
                var fixture = body.GetFixtureList();
                while (fixture) {
                    var shape = fixture.GetShape();
                    fixture = fixture.GetNext();
                    var shapeType = shape.GetType();
                    if (shapeType == b2s.b2Shape.e_circleShape && (userData == 'ball')) {
                        var position = body.GetPosition();
                        var angle = body.GetAngle() * (180 / Math.PI);
                        var circleShape = shape;
                        var radius = circleShape.GetRadius();
                        ctx.save();
                        ctx.translate(position.x * SlopePhysics.scale, position.y * SlopePhysics.scale);
                        ctx.rotate(angle * (Math.PI / 180));
                        ctx.translate(-position.x * SlopePhysics.scale, -position.y * SlopePhysics.scale);
                        ctx.beginPath();
                        ctx.arc(position.x * SlopePhysics.scale, position.y * SlopePhysics.scale, radius * SlopePhysics.scale, 0, 2 * Math.PI, false);
                        ctx.closePath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.stroke();
                        ctx.fill();
                        ctx.restore();
                    }
                    if (shapeType == b2s.b2Shape.e_polygonShape) {
                        var position = body.GetPosition();
                        var angle = body.GetAngle() * (180 / Math.PI);
                        var polygonShape = shape;
                        ctx.save();
                        ctx.translate(position.x * SlopePhysics.scale, position.y * SlopePhysics.scale);
                        ctx.rotate(angle * (Math.PI / 180));
                        ctx.translate(-position.x * SlopePhysics.scale, -position.y * SlopePhysics.scale);
                        ctx.beginPath();
                        ctx.closePath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.stroke();
                        ctx.fill();
                        ctx.restore();
                    }
                }
            }
        }
    }
})(SlopePhysics || (SlopePhysics = {}));
//# sourceMappingURL=app.js.map