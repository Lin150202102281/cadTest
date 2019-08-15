'use strict'

const THREE = require('three');
const Stats = require('../lib/stats');
const OrbitControls = require('../lib/OrbitControls');
const data = require('../res/data/dxfdata.json');
const colorsMapper = require('autocad-colors-index');
const TTFLoader = require('../lib/TTFLoader');
const LineGeometry = require('../lib/line/LineGeometry');
const LineMaterial = require('../lib/line/LineMaterial');
const Line2 = require('../lib/line/Line2');
//const FontDataJSON = require('../res/fonts/json/BenMoJSON.json');
//const FontDataJSON = require('../res/fonts/json/fzyt.json');
//const FontDataJSON = require('../res/fonts/json/helvetiker_regular.typeface.json');

const FontDataSimsun = require('../res/fonts/ttf/simsun.ttf');
const FontDataHeiti = require('../res/fonts/ttf/heiti.ttf');




function showCadJson(){


    var scene;
    var camera;
    var render;
    var webglRender;
    //var canvasRender;
    var controls;
    var stats;

    
    var fontTTF = {
        simsun:'',
        heiti:''
    };

    var blockInf = [];
    
    var countCircle = 0;
    var countLine = 0;
    var countLw = 0;

    window.onload=function(){
        stats = initStats();
       

        initRenderer()
        initCamera();
        
        //坐标轴
        initAxis();
    
    
       var promise = runAsync().then(function (res) {

            loadData(data);

        }); 


       

        
        renderScene();
    }

    function initRenderer(){
        scene = new THREE.Scene();
        
        webglRender = new THREE.WebGLRenderer( {antialias: true, alpha: true} ); // antialias 抗锯齿
        webglRender.setSize(window.innerWidth, window.innerHeight);
        webglRender.setClearColor(0x212830, 1.0);
        webglRender.shadowMap.enabled = true; // 允许阴影投射
        render = webglRender;
        
        
        document.getElementById('webgl-output').appendChild(render.domElement);
        window.addEventListener('resize', onWindowResize, false);

    }

    function initCamera(){

        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 30, 100000); // 2147483647
        camera.position.set(8000,4000,50000);
        var target = new THREE.Vector3(8000,4000,0);
        
        controls = new OrbitControls(camera, render.domElement);
        controls.target = target;
        camera.lookAt(target);
    }


    function initAxis(){
        var X_geometry = new THREE.Geometry();
        X_geometry.vertices.push(new THREE.Vector3(0,0,0));
        X_geometry.vertices.push(new THREE.Vector3(1000000*2,0,0));
        var X = new THREE.Line(X_geometry, new THREE.LineBasicMaterial({color: 0xff0000}));
        X.position.set(-9000,-10000,0);
    
    
        var X1_geometry = new THREE.Geometry();
        X1_geometry.vertices.push(new THREE.Vector3(0,0,0));
        X1_geometry.vertices.push(new THREE.Vector3(1000,0,0));
        var X1 = new THREE.Line(X1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        X1.position.set(-10000,-10000,0);
    
    
        var Y_geometry = new THREE.Geometry();
        Y_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        Y_geometry.vertices.push(new THREE.Vector3(0, 1000000*2, 0));
        var Y = new THREE.Line(Y_geometry, new THREE.LineBasicMaterial({color: 0x00ff00}));
        Y.position.set(-10000,-9000,0);
    
        var Y1_geometry = new THREE.Geometry();
        Y1_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        Y1_geometry.vertices.push(new THREE.Vector3(0, 1000, 0));
        var Y1 = new THREE.Line(Y1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        Y1.position.set(-10000,-10000,0);
    
    
        var Z_geometry = new THREE.Geometry();
        Z_geometry.vertices.push(new THREE.Vector3(0,0,0));
        Z_geometry.vertices.push(new THREE.Vector3(0,0,1000000*2));
        var Z = new THREE.Line(Z_geometry, new THREE.LineBasicMaterial({color: 0x0000ff}));
        Z.position.set(-10000,-10000,1000);
    
    
        var Z1_geometry = new THREE.Geometry();
        Z1_geometry.vertices.push(new THREE.Vector3(0,0,0));
        Z1_geometry.vertices.push(new THREE.Vector3(0,0,1000));
        var Z1 = new THREE.Line(Z1_geometry, new THREE.LineBasicMaterial({color: 0x9400D3}));
        Z1.position.set(-10000,-10000,0);
    
    

        scene.add(X,Y,Z,X1,Y1,Z1);
    } 


    //SSSSSSSSSSSSSSSS
    /** 渲染场景 */
    function renderScene() {
        stats.update();
        //rotateMesh(); // 旋转物体
        requestAnimationFrame(renderScene);
        render.render(scene, camera);
    }
    
    /** 初始化 stats 统计对象 */
    function initStats() {
        stats = new Stats();
        stats.setMode(0); // 0 为监测 FPS；1 为监测渲染时间
        document.getElementById('stats-output').append(stats.domElement);
        return stats;
    }


    
    /** 当浏览器窗口大小变化时触发 */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }
    
   

    function runAsync () {
            var loader = new TTFLoader();
            var fontLoader = new THREE.FontLoader();
            var promise = new Promise(function (resolve, reject) {
                loader.load(FontDataSimsun,function(fnt){
                    fontTTF.simsun = fontLoader.parse(fnt);
                }); 

                loader.load(FontDataHeiti,function(fnt){
                    fontTTF.heiti = fontLoader.parse(fnt);
                    resolve(fontTTF);
                }); 
            });
            return promise;
    }
        




    function loadData(data){
       
        data.forEach(function(element){
            var matrix = (new THREE.Matrix4().fromArray(element.Transform.split(',').map(Number))).transpose() || new THREE.Matrix4();
            var color = element.Color ? calColor(element.Color) : 0xFFFFFF;
            switch(element.Type){
                case "DxfPoint":
                    var position = new THREE.Vector3().fromArray(element.Position.split(',').map(Number));
                    generatePoint(parentHandle,position,matrix,color);

                    break;
                case "DxfLine":
                    var startPoint = new THREE.Vector3().fromArray(element.StartPoint.split(',').map(Number));
                    var endPoint = new THREE.Vector3().fromArray(element.EndPoint.split(',').map(Number));
                    var parentHandle = element.ParentHandle;
                    generateLine(parentHandle,startPoint,endPoint,matrix,color);
                    countLine++;
                    break;
                case "DxfSolid":
                    var pointArray = [];
                    var closed = (element.Closed == "False") ? false : true;
                    element.Points.forEach(function(vector){
                        pointArray.push(new THREE.Vector3().fromArray(vector.split(',').map(Number)));
                    })
                    var parentHandle = element.ParentHandle;

                    generatePolyLine(parentHandle,pointArray,closed,color,matrix);

                case "DxfLwPolyline":
                    if(element.Vertices){
                        var pointArray = [];
                        var closed = element.Closed == "False" ? false : true;
                        element.Vertices.forEach(function(vector){
                            pointArray.push(new THREE.Vector3().fromArray(vector.split(',').map(Number)));
                            //pointArray.push(vector.split(',').map(Number));
                        })
                        var parentHandle = element.ParentHandle;
    
                        generatePolyLine(parentHandle,pointArray,closed,color,matrix);
                        countLw++;
                    }
                    
                    break;
                case "DxfCircle":
                    var center = new THREE.Vector3().fromArray(element.Center.split(',').map(Number));
                    var radius = element.Radius;
                    var startAngle =  0;
                    var endAngle =2 * Math.PI;
                    var parentHandle = element.ParentHandle;

                    generateCurve(parentHandle,element.Type,center.x,center.y,radius,radius,startAngle,endAngle,color,matrix);
                    
                    countCircle ++;
                    break;
                case "DxfArc":
                       
                    var center = new THREE.Vector3().fromArray(element.Center.split(',').map(Number));
                    var radius =element.Radius;
                    var startAngle = element.StartAngle ;
                    var endAngle = element.EndAngle;
                    var parentHandle = element.ParentHandle;
                   
                    generateCurve(parentHandle,element.Type,center.x,center.y,radius,radius,startAngle,endAngle,color,matrix);
                
                    break;
                case "DxfEllipse":
                        
                    var center = new THREE.Vector3().fromArray(element.Center.split(',').map(Number));
                    var xRadius = new THREE.Vector3().fromArray(element.MajorAxisEndPoint.split(',').map(Number));
                    var yRadius = new THREE.Vector3().fromArray(element.MinorAxisEndPoint.split(',').map(Number));
                    var startAngle = element.StartParameter;
                    var endAngle = element.EndParameter;
                    var parentHandle = element.parentHandle;

                   generateCurve(parentHandle,element.Type,center.x,center.y,yRadius.x,xRadius.y,startAngle,endAngle,color,matrix);
                    
                
                    break;
                case "DxfSpline":
                    var fitPointArray = [];
                    element.FitPoints.forEach(function(fitPoint){
                        fitPointArray.push(new THREE.Vector3().fromArray(fitPoint.split(',').map(Number)));
                    })
                    var parentHandle = element.ParentHandle;

                    generateSpline(parentHandle,fitPointArray,color,matrix);

                    break;
                case "DxfMText":
                    var context = element.SimplifiedText;
                    var size = element.Size;
                    var fontStyle = element.FontStyle;
                    var boxWidth = element.BoxWidth;
                    var boxHeight = element.BoxHeight;
                    var attachmentPoint = element.AttachmentPoint;
                    var parentHandle = element.ParentHandle;

                    generateText(parentHandle,context,size,color,matrix,fontStyle,boxWidth,boxHeight,null,attachmentPoint);
    
                    break;
                case "DxfText":
                    var context = element.SimplifiedText;
                    var size = element.Size;
                    var fontStyle = element.FontStyle;
                    var alignMentPoint1 = new THREE.Vector3().fromArray(element.AlignMentPoint1.split(',').map(Number));
                    var parentHandle = element.ParentHandle;
                   
                    generateText(parentHandle,context,size,color,matrix,fontStyle,null,null,alignMentPoint1,null,element.RotationAngle);

                    break;
                case "DxfInsert":
                    var insertPoint = new THREE.Vector3().fromArray(element.InsertPoint.split(',').map(Number));
                    var rotationAngle = element.RotationAngle;
                    var parentHandle = element.ParentHandle;
                    var insertName = element.InsertName;
                    var nowHandle = element.NowHandle;
                    var insertScale = new THREE.Vector3().fromArray(element.InsertScale.split(',').map(Number));
                    blockInf.push(
                        {
                            parentHandle:parentHandle,
                            insertPoint:insertPoint,
                            rotationAngle:rotationAngle,
                            insertName:insertName,
                            nowHandle:nowHandle,
                            nextParentHandle:parentHandle,
                            insertScale:insertScale,
                            matrix:matrix,
                        }
                    );
                    break;
                case "Linear":
                    var insertPoint = new THREE.Vector3().fromArray(element.InsertPoint.split(',').map(Number));
                    var rotationAngle = element.RotationAngle;
                    var parentHandle = element.ParentHandle;
                    var insertName = element.InsertName;
                    var nowHandle = element.NowHandle;
                    var insertScale = new THREE.Vector3().fromArray(element.InsertScale.split(',').map(Number));
                    blockInf.push(
                        {
                            parentHandle:parentHandle,
                            insertPoint:insertPoint,
                            rotationAngle:rotationAngle,
                            insertName:insertName,
                            nowHandle:nowHandle,
                            nextParentHandle:parentHandle,
                            insertScale:insertScale,
                            matrix:matrix,
                        }
                    );
                    break;
                case "DxfTable":
                    var insertPoint = new THREE.Vector3().fromArray(element.InsertPoint.split(',').map(Number));
                    var rotationAngle = element.RotationAngle;
                    var parentHandle = element.ParentHandle;
                    var insertName = element.InsertName;
                    var nowHandle = element.NowHandle;
                    var insertScale = new THREE.Vector3().fromArray(element.InsertScale.split(',').map(Number));
                    blockInf.push(
                        {
                            parentHandle:parentHandle,
                            insertPoint:insertPoint,
                            rotationAngle:rotationAngle,
                            insertName:insertName,
                            nowHandle:nowHandle,
                            nextParentHandle:parentHandle,
                            insertScale:insertScale,
                            matrix:matrix,
                        }
                    );
                    break;
                default:
                    console.log('not exist:'+element.Type);
                break;      


            }

        })

    }



    function calBlockHandle(mesh,pHandle){
       
        blockInf.forEach(function(element){
            if(element.nowHandle == pHandle){
                mesh.applyMatrix(new THREE.Matrix4().setPosition(element.insertPoint));
                mesh.applyMatrix(new THREE.Matrix4().scale(element.insertScale));
                mesh.rotateZ(element.rotationAngle);
                mesh.applyMatrix(element.matrix);
                pHandle = element.parentHandle;
                calBlockHandle(mesh,pHandle);
            }
        }) 

     }

    //生成点
    function generatePoint(parentHandle,position,matrix,color){
       
        var pointGeometry = new THREE.SphereBufferGeometry(10,32,32);
        var material = new THREE.MeshBasicMaterial({color: color});
        var pointSphere = new THREE.Mesh(pointGeometry, material);

        pointSphere.applyMatrix(matrix);
        pointSphere.position.copy(position);
        scene.add(pointSphere);
        calBlockHandle(pointSphere,parentHandle);

    }
    
    //生成线
    function generateLine(parentHandle,startPoint,endPoint,matrix,color){
        var material=new THREE.LineBasicMaterial({color:color})
        var geometry = new THREE.Geometry();
    
        geometry.vertices.push(startPoint);
        geometry.vertices.push(endPoint);
        
        var line = new THREE.Line( geometry, material );
        //line.position.set(0,0,0)
        
        line.applyMatrix(matrix);
        scene.add(line);

        calBlockHandle(line,parentHandle);
    }
    
    
    
    
    //生成多段线
    function generatePolyLine(parentHandle,polyLineArray,closed,color,matrix){
        var points3D = new THREE.Geometry();
        
        for(var i=0;i<polyLineArray.length;i++){
            polyLineArray[i].setZ(0) ;
            points3D.vertices.push( 
                polyLineArray[i]
            );
        }

        if(closed == true){
            points3D.vertices.push( polyLineArray[0]);
        }
        
        var line2 = new THREE.Line(points3D, new THREE.LineBasicMaterial({color: color}));
        line2.applyMatrix(matrix);
        scene.add(line2);
        calBlockHandle(line2,parentHandle);



      /*   var geometry = new LineGeometry();
        // 顶点坐标构成的数组pointArr

        var pointArr ;
        for(var i=0;i<polyLineArray.length;i++){
            polyLineArray.push(0);
           
        }
        for(var i=0;i<polyLineArray.length-1;i++){
            pointArr = polyLineArray[i].concat(polyLineArray[i+1])
        }

        if(closed == true){
            pointArr = polyLineArray[polyLineArray.length-1].concat(polyLineArray[0])
        }


        geometry.setPositions(pointArr);

        var material  = new LineMaterial( {
        color: 0xdd2222,

        linewidth: 5,
        } );

        material.resolution.set(window.innerWidth,window.innerHeight);

        var line = new Line2(geometry, material);

        scene.add(line);
        calBlockHandle(line2,parentHandle);

 */





    }
    
    
    
    
    //生成圆、椭圆
    function generateCurve(parentHandle,type,xPoint,yPoint,xRadius,yRadius,startAngle,endAngle,color,matrix){
  
        var curve = new THREE.EllipseCurve(
            xPoint,  yPoint,            // aX, aY
            xRadius, yRadius,           // xRadius, yRadius
            startAngle  ,endAngle,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );
        
        var points = curve.getPoints( 50 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        var material = new THREE.LineBasicMaterial( { color : color } );
        
        var mesh = new THREE.Line( geometry, material );
    
        mesh.applyMatrix(matrix);
        scene.add(mesh)
        
        calBlockHandle(mesh,parentHandle);
    
    }
    
  
    
    
    //生成样条曲线
    function generateSpline(parentHandle,fitPointArray,color,matrix){
        if(fitPointArray.length>0){
            var curve = new THREE.SplineCurve(fitPointArray);
        
            var points = curve.getPoints( 50 );
            var geometry = new THREE.BufferGeometry().setFromPoints( points );
            
            var material = new THREE.LineBasicMaterial( { color : color } );
            
            // Create the final object to add to the scene
            var mesh = new THREE.Line( geometry, material );
    
            mesh.applyMatrix(matrix);
            scene.add(mesh);
            calBlockHandle(mesh,parentHandle);
        }
        

    }
    
 
    
    function selectFont(fontStyle){
        switch(fontStyle){
            case "宋体":
                return fontTTF.simsun;

            case "黑体":
                return fontTTF.heiti;

            default:
                //console.log('没有指示字体，默认为宋体'); 
                return fontTTF.simsun;   

        }
    }
    
    
    //生成文字
    function generateText(parentHandle,context,size,color,matrix,fontStyle,boxWidth,boxHeight,alignMentPoint1,attachmentPoint,rotationAngle){
    
        //TTF读取方法

        var material = new THREE.MeshBasicMaterial( {color: color});
    
        var font;   

        font = selectFont(fontStyle);
        
        var shapes = font.generateShapes( context, size/2 );
        var geometry = new THREE.ShapeBufferGeometry( shapes );
   
        var mesh = new THREE.Mesh( geometry, material );
        


        if(alignMentPoint1){

            mesh.position.copy(alignMentPoint1);
            mesh.rotateZ(rotationAngle);
        }else{
           mesh.applyMatrix(matrix);
           translateMesh(attachmentPoint,mesh,-boxWidth,-boxHeight/2);


        }


        scene.add( mesh ); 
        calBlockHandle(mesh,parentHandle);


        //JSON读取方法
       
    /*   var material = new THREE.MeshBasicMaterial({color: color});

        var shapes = new THREE.Font(FontDataJSON).generateShapes( context, size );
        var geometry = new THREE.ShapeBufferGeometry( shapes );
   
        var mesh = new THREE.Mesh( geometry, material );
        
        mesh.applyMatrix(matrix)
        scene.add( mesh );
  
    */
    }


    function translateMesh(attachmentPoint,mesh,width,height){
        switch(attachmentPoint){
            case 'TopCenter':
                //上中
                mesh.translateX(width/2);
                mesh.translateY(height);
                break;
            case 'TopRight':
                //上右
                mesh.translateX(width);
                mesh.translateY(height);
                break;

            case 'MiddleLeft':
                //左中
                mesh.translateY(height/2);
                break;

            case 'MiddleCenter':	
                //正中
                mesh.translateX(width/2);
                mesh.translateY(height/2);
                break;

            case 'MiddleRight':	
                //右中
                mesh.translateX(width);
                mesh.translateY(height/2);
                break;

            case 'BottomLeft':
                //下左
                
                break;

            case 'BottomCenter':	
                //下中
                mesh.translateX(width/2);
                break;

            case 'BottomRight':
                //右下
                mesh.translateX(width);
                break;

           }
    }
    
    
    
  

    function calColor(colorIndex){
       
        if(colorIndex >0 && colorIndex<255){
            var color = new THREE.Color(colorsMapper.getByACI(colorIndex).rgb).getHex ();
            
            return color;
        }else if(colorIndex == 0){

            return 0xFFFFFF;
        }else{
            
            return colorIndex;
        }
        
    }
    
    
    
    
    
    
    
    
    
    
    
    



}
module.exports = showCadJson;