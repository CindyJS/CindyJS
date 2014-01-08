



           var size=6;
            var mouse={};
            function start() {
                var canvas=document.getElementById("CSCanvas");

                canvas.onmousedown = function (e) {
                        console.log("DOWN ");

                    mouse.button  = e.which;
                    mouse.px      = mouse.x;
                    mouse.py      = mouse.y;
                    var rect      = canvas.getBoundingClientRect();
                    mouse.x       = e.clientX - rect.left,
                    mouse.y       = e.clientY - rect.top,
                    mouse.down    = true;
                    e.preventDefault();
                };
                
                canvas.onmouseup = function (e) {
                    mouse.down = false;
                    e.preventDefault();
                };
                
                canvas.onmousemove = function (e) {
                    mouse.px  = mouse.x;
                    mouse.py  = mouse.y;
                    var rect  = canvas.getBoundingClientRect();
                    mouse.x   = e.clientX - rect.left,
                    mouse.y   = e.clientY - rect.top,
                    e.preventDefault();
                };
                
                
                
                function touchMove(e) {
                    if (!e)
                    var e = event;
                    mouse.px  = mouse.x;
                    mouse.py  = mouse.y;
                    var rect  = canvas.getBoundingClientRect();

                    mouse.x = e.targetTouches[0].pageX - canvas.offsetLeft;
                    mouse.y = e.targetTouches[0].pageY - canvas.offsetTop;
                    showPos();
                    e.preventDefault();

                }
                
                function touchDown(e) {
                    mouse.down = true;
                    e.preventDefault();

                }
                
                function touchUp(e) {
                    mouse.down = false;
                    e.preventDefault();

                }
                
                canvas.addEventListener("touchstart", touchDown, false);
                canvas.addEventListener("touchmove", touchMove, true);
                canvas.addEventListener("touchend", touchUp, false);
                document.body.addEventListener("touchcancel", touchUp, false);
            //    document.body.addEventListener("mouseup", mouseUp, false);

                
                update();
            }

            
            window.requestAnimFrame =
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };

            function drawupdate() {
                size=6;
                if(mouse.down){size=10;}
                for(var i=0;i<pts.length;i++){
                    drawpt(pts[i])
                }
                if(mouse.down){
                    drawpt(mouse);
                
                }

            }
            
            function update() {
                
                csctx.clearRect(0, 0, canvas.width, canvas.height);
                pt1.x=pt1.x+2;
                drawupdate();
                
                requestAnimFrame(update);
            }
            
            
            drawpt= function (p){
                csctx.lineWidth = 2;
                
                
                csctx.beginPath();
                csctx.arc(p.x,p.y,size,0,2*Math.PI);
                csctx.fillStyle="#000000";
                csctx.fill();
            }
            
            window.onload = function () {
                
                canvas  = document.getElementById('CSCanvas');
                csctx     = canvas.getContext('2d');
                
                 pt1={x:50,y:50};
                 pt2={x:350,y:150};
                 pt3={x:550,y:350};
                pts=[pt1,pt2,pt3];
                               
                
                start();
            };
          

            