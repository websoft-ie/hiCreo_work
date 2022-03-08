// Adds toolDrawCtx.getTransform() - returns an SVGMatrix
// Adds toolDrawCtx.getTransformedPoint(x,y) - returns an SVGPoint
function trackTransforms(context){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    context.getTransform = function(){ return xform; };

    var savedTransforms = [];
    var saveTransform = context.save;
    context.saveTransform = function(){
        savedTransforms.push(xform.translate(0,0));
        return saveTransform.call(context);
    };
    
    var restoreTransform = context.restore;
    context.restoreTransform = function(){
        xform = savedTransforms.pop();
        return restoreTransform.call(context);
            };

    var scale = context.scale;
    context.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(context,sx,sy);
            };
    
    var rotate = context.rotate;
    context.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(context,radians);
    };
    
    var translate = context.translate;
    context.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(context,dx,dy);
    };
    
    var transform = context.transform;
    context.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(context,a,b,c,d,e,f);
    };
    
    var setTransform = context.setTransform;
    context.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(context,a,b,c,d,e,f);
    };
    
    var pt = svg.createSVGPoint();
    context.getTransformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
    
    context.getActualPoint = function(x, y) {
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform);       
    }
}  