/// <reference path="./createjs/createjs-lib.d.ts"/>
/// <reference path="./createjs/createjs.d.ts"/>
///// <reference path="./createjs/easeljs.d.ts"/>
///// <reference path="./preloadjs/preloadjs.d.ts"/>
/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./box2d/box2dweb.d.ts" />
/// <reference path="./underscore/underscore.d.ts" />

module Figure {

    import b2c = Box2D.Common;
    import b2m = Box2D.Common.Math;
    import b2d = Box2D.Dynamics;
    import b2s = Box2D.Collision.Shapes;
    import b2j = Box2D.Dynamics.Joints;

    var body,wheel1,wheel2: b2d.b2Body;
    var sprite: createjs.Sprite;
    var spriteSheetData: any;
    var stage: createjs.Stage;
    var frameCntr: number = 0;
    var _action: string;
  

    var skierSpriteSheetData = {
        images: ["images/skier.png"],
        frames: { width: 195, height: 175, count: 140},
        animations: {
            left: _.range(0, 9),
            right: _.range(10,19),
            left_trick1: _.range(20, 41),
            right_trick1: _.range(42, 61),
            left_trick2: _.range(62,85),
            right_trick2: _.range(86, 105),
            left_crash: _.range(106, 123),
            right_crash: _.range(124, 141)}
    };

        var skaterSpriteSheetData = {
        images: ["images/skateboarder.png"],
        frames: { width: 145, height: 150, count: 140},
        animations: {
            left: _.range(0, 9),
            right: _.range(10, 19),
            left_trick1: _.range(20, 34),
            right_trick1: _.range(35, 49),
            left_trick2: _.range(50, 69),
            right_trick2: _.range(70, 97),
            left_crash: _.range(98, 119),
            right_crash: _.range(121, 139)}
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
            right_crash: _.range(121, 139)}
        };
       

    export class FigureControl {

        public world: Box2D.Dynamics.b2World;
        public scale: number;
        constructor(createdStage: createjs.Stage, world: b2d.b2World, scale: number) {
            var self = this;
            stage = createdStage;
            this.world = world;
            this.scale = scale;

        }
        public setAction(action: string): void {
            _action = action;
        }

        private p2m(n: number): number {
            return n / this.scale;
        }

        public impulse = (): void => {
            console.log("pushing figure" + body.GetPosition().x);
            var power: number = 30;


            var deltaY: number = wheel2.GetPosition().y - wheel1.GetPosition().y;
            var deltaX: number = wheel2.GetPosition().x - wheel1.GetPosition().x;
            var degrees: number = Math.atan2(deltaY, deltaX) / Math.PI;


            body.ApplyImpulse(new b2m.b2Vec2(Math.cos(degrees * (Math.PI / 180)) * power,
                Math.sin(degrees * (Math.PI / 180)) * power),
                body.GetWorldCenter());

        }

        public stopMotion = (): void => {
            console.log("stopping figure" + body.GetPosition().x);

            body.ApplyForce(body.GetMass() * -this.world.GetGravity(), body.GetWorldCenter());

            body.SetLinearDamping(0);
            body.SetAngularDamping(0);
            body.SetAngularVelocity(0);
            body.SetLinearVelocity(new b2m.b2Vec2(0, 0));

            body.SetSleepingAllowed(true);
            body.SetAwake(false);

            wheel1.ApplyForce(wheel1.GetMass() * -this.world.GetGravity(), wheel1.GetWorldCenter());
            wheel1.SetLinearDamping(0);
            wheel1.SetAngularDamping(0);
            wheel1.SetAngularVelocity(0);
            wheel1.SetLinearVelocity(new b2m.b2Vec2(0, 0));
            wheel1.SetSleepingAllowed(true);
            wheel1.SetAwake(false);
      
            //wheel2.ApplyForce(wheel2.GetMass() * -this.world.GetGravity(), wheel2.GetWorldCenter());
            wheel2.SetLinearDamping(0);
            wheel2.SetAngularDamping(0);
            wheel2.SetAngularVelocity(0);
            wheel2.SetLinearVelocity(new b2m.b2Vec2(0, 0));
            wheel2.SetSleepingAllowed(true);
            wheel2.SetAwake(false);


            console.log("figure stopped");

        }

        public animateFigure(event: Event): void {
            var direction: string;
            var deltaY: number = wheel2.GetPosition().y - wheel1.GetPosition().y;
            var deltaX: number = wheel2.GetPosition().x - wheel1.GetPosition().x;
            var rotationAngle: number = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

            sprite.regX = 70;
            sprite.regY = 125;

            sprite.rotation = rotationAngle;
            sprite.x = (body.GetPosition().x * 30);
            sprite.y = (body.GetPosition().y * 30);
            sprite.scaleX = .5
            sprite.scaleY = .5

            var i: number = frameCntr;
            var frame_count: number = 9;
            var action: string;

            var velocity = Math.round(body.GetLinearVelocity().x * 100) / 100;
            (velocity < 0) ? direction = "left" : direction = "right";


            if (_action) {
                action = direction.concat(_action);
            } else {
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
                    frame_count = spriteSheetData.animations.right_trick2.left_crash.length;
                    sprite.gotoAndStop(spriteSheetData.animations.left_crash[i]);
                    break;
                case "right_crash":
                    frame_count = spriteSheetData.animations.right_trick2.right_crash.length;
                    sprite.gotoAndStop(spriteSheetData.animations.right_crash[i]);
                    break;
                default:
                    frame_count = spriteSheetData.animations.right_trick2.left.length;
                    sprite.gotoAndPlay(spriteSheetData.animations.left[i]);
            }
            frameCntr++;

            if (frameCntr >= frame_count) {
                frameCntr = 0;
                _action = null;
            }

            var speed: number = body.GetLinearVelocity().x;
            speed = Math.floor(speed);
            speed = Math.abs(speed);

            // speed = this.p2m(speed);
            
          
            //  sprite.label.text = "direction : " + action.replace(/[\_]/g, ' ') + ", velocity : " + speed + " meters per sec";
            //this.label.x = this.x + 20;
            //this.label.y = this.y + 50;
            stage.update();

        }


        public createBall(x: number, y: number): Box2D.Dynamics.b2Body {

            var ballDef = new b2d.b2BodyDef();

            ballDef.type = b2d.b2Body.b2_dynamicBody;
            ballDef.position.x = x / this.scale;
            ballDef.position.y = y / this.scale;
            ballDef.userData = 'ball';

            var fixDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            fixDef.userData = 'ball';
            fixDef.density = 0.5;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.9;
            fixDef.shape = new b2s.b2CircleShape(30 / this.scale);
            fixDef.userData = 'ball';

            var body = this.world.CreateBody(ballDef);
            body.CreateFixture(fixDef);

            return body;
        }

        private createSpritePlatform(x: number, y: number): Box2D.Dynamics.b2Body {

            // making a rolling platform - with 2 wheels

            // rectangle - platform atop both wheels
            var rectangleDef = new b2d.b2BodyDef();
            rectangleDef.type = b2d.b2Body.b2_dynamicBody;
            rectangleDef.position.x = x / this.scale;
            rectangleDef.position.y = y / this.scale;

            body = this.world.CreateBody(rectangleDef);

            var fixDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            var rectanglurShape = new b2s.b2PolygonShape();
            rectanglurShape.SetAsBox(1.0, 0.1);
            fixDef.shape = rectanglurShape;
            fixDef.density = 2.0;
            fixDef.friction = 0.0;
            fixDef.restitution = 0.3;

            body.CreateFixture(fixDef);

            var wheelDef = new b2d.b2BodyDef();
            wheelDef.type = b2d.b2Body.b2_dynamicBody;
            wheelDef.position.x = x / this.scale;
            wheelDef.position.y = y / this.scale;

            var wheelFixDef = new b2d.b2FixtureDef;
            wheelFixDef.density = 4.0;
            wheelFixDef.friction = 0.0;
            wheelFixDef.restitution = 0.3;
            wheelFixDef.shape = new b2s.b2CircleShape(0.4)

            //  wheel1
            wheel1 = this.world.CreateBody(wheelDef);
            wheel1.CreateFixture(wheelFixDef);

            //  wheel2
            wheel2 = this.world.CreateBody(wheelDef);
            wheel2.CreateFixture(wheelFixDef);

            //  joints
            var jointDef = new b2j.b2RevoluteJointDef();
            jointDef.bodyA = body;
            jointDef.bodyB = wheel1;
            jointDef.localAnchorA.Set(-1.0, 0);
            this.world.CreateJoint(jointDef);

            jointDef.bodyA = body;
            jointDef.bodyB = wheel2;
            jointDef.localAnchorA.Set(1.0, 0);
            this.world.CreateJoint(jointDef);

            return body;

        }

        public createFigure(figure: String, x: number, y: number): Box2D.Dynamics.b2Body {
            console.log('selected figure = ' + figure);
            var spriteSheet:createjs.SpriteSheet;
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
            sprite.tickEnabled = true;
            stage.addChild(sprite);

            createjs.Ticker.setFPS(9);
            createjs.Ticker.on("tick", this.animateFigure, sprite);

            var body: Box2D.Dynamics.b2Body = this.createSpritePlatform(x, y);
            body.SetUserData(sprite);
            return body;
        }
    }
}