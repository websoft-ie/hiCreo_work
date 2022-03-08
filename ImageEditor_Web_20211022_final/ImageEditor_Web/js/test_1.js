
    


window.onload = function(){		
    toolDrawCanvas = document.getElementById('toolDrawCanvas');
    toolDrawCanvas.width = window.innerWidth;
    toolDrawCanvas.height = window.innerHeight - document.getElementById('tool-area').offsetHeight;
    toolDrawCtx = toolDrawCanvas.getContext('2d');
	selectionCanvas = document.getElementById("selectionCanvas");
	selectionCanvas.width = window.innerWidth;
	selectionCanvas.height = window.innerHeight - document.getElementById('tool-area').offsetHeight;
	selectionCtx = selectionCanvas.getContext('2d');

    gkhead = new Image();     
    trackTransforms(toolDrawCtx);
    trackTransforms(selectionCtx);
    gkhead.onload = function() {
            $('#editor-region').css('width', gkhead.width );
    $('#editor-region').css('height', gkhead.height );
    redraw();
    }   
    editorRegion = document.getElementById('editor-region');
    centerX = 0;
	centerY = 0;

    clientOffset = {x: 20, y: 30};

    lastX = toolDrawCanvas.width / 2;
    lastY = toolDrawCanvas.height / 2;
    dragStart = {x: 0, y: 0};
    dragged = false;
    scaleFactor = 1.1;
    actualZoomFactor = 1;    

    hatchLength = 4;
	hatchOffset = 0;
	orig_image = new Image();
	mask = null;
	oldMask = null;
	storedPolygonLines = [];
	minX_lasso = 0, maxX_lasso = 0;
	minY_lasso = 0, maxY_lasso = 0;
	lassoCanvas = null;
	lassoCtx = null;
	ToolMode = 'Eraser';
	SelectionMode = 'New';
	prevSelectionMode = 'New';
	cacheInd = null; // Indices for border points of the selected region
	isDrawingMode = false; // true when clicking the left mouse button in Polygon tool mode
	isLMousePressed = false; // true when clicking the left mouse button in Eraser tool mode

    var firstPt = {x: 0, y: 0};
	var prevPt  = {x: 0, y: 0};

    selectionCanvas.addEventListener('mousedown',function(e){
        lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft);
        lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop);
        if (ToolMode == 'Move') {
            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

            dragStart = toolDrawCtx.getTransformedPoint(lastX, lastY);
            dragged = false;
            redraw();
            return;
        }

		if(e.button != 0) return;	
		var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY);
        var canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y);
		
		if(SelectionMode == 'New') {
			selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
			oldMask = null;
		}
		if(ToolMode == 'Lasso') {
			if(!isDrawingMode) {
				isDrawingMode = true;
				storedPolygonLines = [];
				prevPt = {
					x: mousePos.x,
					y: mousePos.y
				};
				firstPt = prevPt;
				lassoCanvas = document.createElement("canvas");
				lassoCtx = lassoCanvas.getContext("2d");
				lassoCtx.canvas.width = gkhead.width * actualZoomFactor;
				lassoCtx.canvas.height = gkhead.height * actualZoomFactor;
				lassoCtx.clearRect(0, 0, lassoCanvas.width, lassoCanvas.height);
				lassoCtx.fillStyle = 'red';
				lassoCtx.fillRect(0, 0, lassoCanvas.width, lassoCanvas.height);
				lassoCtx.globalCompositeOperation = 'destination-out';
				lassoCtx.beginPath();
				lassoCtx.moveTo(firstPt.x - canvasOffset.x, firstPt.y - canvasOffset.y);
				minX_lasso = firstPt.x - canvasOffset.x;
				maxX_lasso = firstPt.x - canvasOffset.x;
				minY_lasso = firstPt.y - canvasOffset.y;
				maxY_lasso = firstPt.y - canvasOffset.y;
			} else {
				if(storedPolygonLines.length > 0 && distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 10) {
					storedPolygonLines.push({
						x1: prevPt.x,
						y1: prevPt.y,
						x2: firstPt.x,
						y2: firstPt.y
					});
					isDrawingMode = false;
					lassoCtx.lineTo(firstPt.x - canvasOffset.x, firstPt.y - canvasOffset.y);
					lassoCtx.closePath();
					lassoCtx.fill();
					ClearCanvas(selectionCtx);
					// gkhead.src = lassoCanvas.toDataURL();
					mask = getLassoMask(lassoCtx.getImageData(0, 0, lassoCanvas.width, lassoCanvas.height), parseInt(minX_lasso), parseInt(maxX_lasso), parseInt(minY_lasso), parseInt(maxY_lasso));
					getOperatedMask();
				} else {
					if (e.ctrlKey) {
						var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x));
						if (angle < Math.PI / 8)
							mousePos.y = prevPt.y;
						else if (angle < 3 * Math.PI / 8){
							if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
								mousePos.x = prevPt.x + mousePos.y - prevPt.y;
							else
								mousePos.y = prevPt.y - mousePos.x + prevPt.x;
						}
						else
							mousePos.x = prevPt.x;
					}

					storedPolygonLines.push({
						x1: prevPt.x,
						y1: prevPt.y,
						x2: mousePos.x,
						y2: mousePos.y
					});
					prevPt = {
						x: mousePos.x,
						y: mousePos.y
					};
					lassoCtx.lineTo(mousePos.x - canvasOffset.x, mousePos.y - canvasOffset.y);
					minX_lasso = Math.min(minX_lasso, prevPt.x - Math.ceil(canvasOffset.x));
					maxX_lasso = Math.max(maxX_lasso, prevPt.x - Math.ceil(canvasOffset.x));
					minY_lasso = Math.min(minY_lasso, prevPt.y - Math.ceil(canvasOffset.y));
					maxY_lasso = Math.max(maxY_lasso, prevPt.y - Math.ceil(canvasOffset.y));
				}
			}
		} else if(ToolMode == 'MagicWand') {
			if(mousePos.x < 0 || mousePos.y < 0) return;
			getMagicWandMask(mousePos.x, mousePos.y);
		} else if(ToolMode == 'Eraser') {
			isLMousePressed = true;
			prevPt = {
				x: mousePos.x,
				y: mousePos.y
			};

			toolDrawCtx.save();
			toolDrawCtx.globalCompositeOperation = 'destination-out';
			toolDrawCtx.beginPath();
			toolDrawCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			toolDrawCtx.fill();
			toolDrawCtx.stroke();
			toolDrawCtx.restore();
            
            ClearCanvas(selectionCtx);
			selectionCtx.beginPath();
			selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			selectionCtx.stroke();
		}        
    },false);
    
    selectionCanvas.addEventListener('mousemove',function(e){
        lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft);
        lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop);
        if (ToolMode == 'Move') {
            dragged = true;
            if (dragStart){
                var pt = toolDrawCtx.getTransformedPoint(lastX,lastY);
                toolDrawCtx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                selectionCtx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                redraw();
            }
        }

		if(e.button != 0) return;
		var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY);

		if(ToolMode == 'Eraser') {
			ClearCanvas(selectionCtx);
			selectionCtx.beginPath();
			selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			selectionCtx.stroke();
		} 

		if(ToolMode == 'Lasso' && isDrawingMode) {
			redrawStoredPolygonLines();
			selectionCtx.save();
			selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
			selectionCtx.shadowColor = 'rgba(0, 0, 0, 1)';
			selectionCtx.shadowOffsetX = 0;
			selectionCtx.shadowOffsetY = 0;
			selectionCtx.beginPath();
			selectionCtx.moveTo(prevPt.x, prevPt.y);
			if (e.ctrlKey) {
				var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x));
				if (angle < Math.PI / 8)
                selectionCtx.lineTo(mousePos.x, prevPt.y);
				else if (angle < 3 * Math.PI / 8){
					if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
                        selectionCtx.lineTo(prevPt.x + mousePos.y - prevPt.y, mousePos.y);
					else
                        selectionCtx.lineTo(mousePos.x, prevPt.y - mousePos.x + prevPt.x);
				}
				else
                    selectionCtx.lineTo(prevPt.x, mousePos.y);
			}
			else
                selectionCtx.lineTo(mousePos.x, mousePos.y);
			selectionCtx.stroke();
			selectionCtx.restore();
		} else if(ToolMode == 'Eraser' && isLMousePressed) {
			sizeVal = document.getElementById('size').value;
			var x = mousePos.x;
			var y = mousePos.y;
			toolDrawCtx.save();
			toolDrawCtx.globalCompositeOperation = 'destination-out';
			toolDrawCtx.beginPath();
			toolDrawCtx.arc(x, y, document.getElementById('size').value, 0, 2 * Math.PI);
			toolDrawCtx.fill();
			toolDrawCtx.lineWidth = document.getElementById('size').value * 2;
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(prevPt.x, prevPt.y);
			toolDrawCtx.lineTo(x, y);
			toolDrawCtx.stroke();
			toolDrawCtx.restore();
			prevPt = {x: x, y: y};
		}        
    },false);
    
    selectionCanvas.addEventListener('mouseup',function(e){
        dragStart = null;
        // if (!dragged) zoom(e.shiftKey ? -1 : 1 );

		if(e.button != 0) return;
		isLMousePressed = false;
		if(ToolMode == 'Eraser') {
            var canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y);
			var _imgData = getImageData(
                toolDrawCtx, 
                canvasOffset.x, canvasOffset.y, 
                gkhead.width, gkhead.height, 
                actualZoomFactor);
            gkhead.src = _imgData;
            gkhead.onload = function() {
                redraw();
            }
		}
		if(SelectionMode == 'New') {
			oldMask = null;
			ClearCanvas(selectionCtx);
		} else {
			// oldMask = mask;
		}        
    },false);
    
    
    var zoom = function(clicks){
        var pt = toolDrawCtx.getTransformedPoint(lastX,lastY);
        toolDrawCtx.translate(pt.x,pt.y);
        selectionCtx.translate(pt.x,pt.y);
        var factor = Math.pow(scaleFactor,clicks);
        toolDrawCtx.scale(factor,factor);
        selectionCtx.scale(factor,factor);
        toolDrawCtx.translate(-pt.x,-pt.y);
        selectionCtx.translate(-pt.x,-pt.y);
        actualZoomFactor = actualZoomFactor * factor;
        
        redraw();
    }
    
    var handleScroll = function(evt){
        SCROLL_SENSITIVITY = 0.0005;
        var delta = evt.deltaY*SCROLL_SENSITIVITY;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
    };

    
    selectionCanvas.addEventListener('DOMMouseScroll',handleScroll,false);
    selectionCanvas.addEventListener('mousewheel',handleScroll,false);

	setInterval(function() {
		hatchTick();
	}, 100);    
};

document.addEventListener("keydown", function(event) {
    if (event.key === 'Control') {
    	return;
    }
	
	if(event.key == 'Delete') { 
		if(ToolMode == 'Eraser') return;
		if (!oldMask) return;

        var canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y);
		toolDrawCtx.save();
		toolDrawCtx.globalCompositeOperation = 'destination-out';
		toolDrawCtx.beginPath();
		if(ToolMode == 'MagicWand' || ToolMode == 'Lasso') {
			cacheInd = MagicWand.getBorderIndices(oldMask);
			var len = oldMask.data.length;
			w = parseInt(gkhead.width* actualZoomFactor);
			h = parseInt(gkhead.height* actualZoomFactor);
			x = cacheInd[0] % w;
			y = (cacheInd[0] - x) / w;
			for(j = 0; j < len; j++) {
				if(oldMask.data[j] === 0) continue;
				i = oldMask.data[j];
				x = j % w; // calc x by index
				y = (j - x) / w; // calc y by index
				toolDrawCtx.fillRect(
					x + canvasOffset.x, 
					y + canvasOffset.y, 
					1, 1);
			}
		}
		toolDrawCtx.closePath();
		toolDrawCtx.fill();
		toolDrawCtx.restore();

		// var imgData = toolDrawCtx.getImageData(
		// 	parseInt(cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom)), 
		// 	parseInt(cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)),
		// 	gkhead.width * cameraZoom, gkhead.height * cameraZoom);
		// var tmpCanvas = document.createElement('canvas');
		// tmpCanvas.width = imgData.width;
		// tmpCanvas.height = imgData.height;
		// var tmpCtx = tmpCanvas.getContext('2d');
		// tmpCtx.putImageData(imgData, 0, 0);
		// gkhead.src = tmpCanvas.toDataURL("image/png");

		storedPolygonLines = [];
		isDrawingMode = false;
		// toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
		mask = null;
		oldMask = null;
	} else if(event.ctrlKey) { 
		if (event.code != 'KeyD') return;
		event.preventDefault();
		if(isLMousePressed) return;
		storedPolygonLines = [];
		isDrawingMode = false;
		mask = null;
		oldMask = null;		
		ClearCanvas(selectionCtx);
	} 
	if(event.shiftKey && event.altKey) { 
		SelectionMode = 'Intersect';
		document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode;
		document.getElementById('selection-mode').selectedIndex = 3;
	}
	else if(event.shiftKey) { 
		console.log('Pressed shift key');
		prevSelectionMode = SelectionMode;
		SelectionMode = 'Add';
		document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode;
		document.getElementById('selection-mode').selectedIndex = 1;
	} else if(event.altKey) { 
		prevSelectionMode = SelectionMode;
		SelectionMode = 'Subtract';
		document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode;
		document.getElementById('selection-mode').selectedIndex = 2;
	}
});

function getLassoMask(imgData, minX_lasso, maxX_lasso, minY_lasso, maxY_lasso) {
	var data = imgData.data,
		w = imgData.width,
		h = imgData.height,
		bytes = imgData.bytes,
		result = new Uint8Array(w * h);

    for(i = minY_lasso; i < maxY_lasso; i++) {
		for(j = minX_lasso; j < maxX_lasso; j++) {
			index = i * w + j;
			if(data[4 * index] == 0) {
				result[index] = 1;
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: {
			minX: minX_lasso,
			minY: minY_lasso,
			maxX: maxX_lasso,
			maxY: maxY_lasso
		}
	};
}

function getOperatedMask() {
	if(SelectionMode == 'New' || !oldMask) oldMask = mask;
	else {
		if(SelectionMode == 'Add') {
			oldMask = mask ? addMasks(mask, oldMask) : oldMask;
		}
		if(SelectionMode == 'Subtract') {
			oldMask = mask ? subtractMasks(mask, oldMask) : oldMask;
		}
		if(SelectionMode == 'Intersect') {
			oldMask = mask ? intersectMasks(mask, oldMask) : oldMask;
		}
	}
	mask = null;
}

function getMagicWandMask(x, y) {
	imageInfo = {
		width: parseInt(gkhead.width * actualZoomFactor),
		height: parseInt(gkhead.height * actualZoomFactor),
		context: toolDrawCtx
	};
	mask = null;
	var tempCtx = document.createElement("canvas").getContext("2d");
	tempCtx.canvas.width = imageInfo.width;
	tempCtx.canvas.height = imageInfo.height;
	tempCtx.drawImage(gkhead, 0, 0, imageInfo.width, imageInfo.height);
	imageInfo.data = tempCtx.getImageData(0, 0, imageInfo.width, imageInfo.height);
	
	
	if(!imageInfo) return;
	var image = {
		data: imageInfo.data.data,
		width: imageInfo.width,
		height: imageInfo.height,
		bytes: 4
	};
	// let old = oldMask ? oldMask.data : null;
	old = null;
	mask = MagicWand.floodFill(image, parseInt(x), parseInt(y), document.getElementById("tolerance").value, old, true);
	// if (mask) mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius, old);
	getOperatedMask();
}

function drawBorder(noBorder) {
	if(ToolMode == 'Eraser') return;
	if(!oldMask) return;
	// if (ToolMode ==  'MagicWand' && !mask) return;
	// if (ToolMode == 'Lasso' && (storedPolygonLines.length == 0 || isDrawingMode)) return;
	var x, y, i, j, k,
		w = gkhead.width * actualZoomFactor,
		h = gkhead.height * actualZoomFactor,
		imgData = selectionCtx.createImageData(w, h);
	res = imgData.data;	
	
	cacheInd = MagicWand.getBorderIndices(oldMask);
	// toolDrawCtx.clearRect(0, 0, w, h);
	var len = cacheInd.length;
	for(j = 0; j < len; j++) {
		i = cacheInd[j];
		x = i % parseInt(gkhead.width * actualZoomFactor); // calc x by index
		y = (i - x) / parseInt(gkhead.width * actualZoomFactor); // calc y by index
		k = (y * parseInt(gkhead.width * actualZoomFactor) + x) * 4;
		
		if((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) { // detect hatch color 
			res[k + 3] = 255; // black, change only alpha
		} else {
			res[k] = 255; // white
			res[k + 1] = 255;
			res[k + 2] = 255;
			res[k + 3] = 255;
		}
	}

    var actualPt = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y);
	selectionCtx.putImageData(
		imgData, actualPt.x, actualPt.y);
}

function hatchTick() {
	hatchOffset = (hatchOffset + 1) % (hatchLength * 2);
	drawBorder(true);
}

function distance(pt1, pt2) {
    var result = Math.sqrt(Math.pow((pt2[0] - pt1[0]), 2) + Math.pow((pt2[1] - pt1[1]), 2));
    return result;
}

function redrawStoredPolygonLines() {
    ClearCanvas(selectionCtx);
    if(storedPolygonLines.length == 0) {
        return;
    }
    // redraw each stored line
    selectionCtx.save();
    selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
    selectionCtx.shadowColor = 'rgba(0, 0, 0, 1)';
    selectionCtx.shadowOffsetX = 0;
    selectionCtx.shadowOffsetY = 0;
    for(var i = 0; i < storedPolygonLines.length; i++) {
        selectionCtx.beginPath();
        selectionCtx.moveTo(storedPolygonLines[i].x1, storedPolygonLines[i].y1);
        selectionCtx.lineTo(storedPolygonLines[i].x2, storedPolygonLines[i].y2);
        selectionCtx.stroke();
    }		
    selectionCtx.restore();
}

function getImageData(_context, x, y, width, height, scale) {
    var actualPt = _context.getActualPoint(x, y);
    var imgData = _context.getImageData(
        Math.ceil(actualPt.x), 
        Math.ceil(actualPt.y), 
        Math.floor(scale * width), 
        Math.floor(scale * height));			
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imgData.width;
    tmpCanvas.height = imgData.height;
    var tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.putImageData(imgData, 0, 0);      

    return tmpCanvas.toDataURL("image/png");   
}

function updateBackground() {
    var actualPt = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y);
    // console.log(actualPt);
    // var imgData = toolDrawCtx.getImageData(Math.ceil(actualPt.x), Math.ceil(actualPt.y), Math.floor(actualZoomFactor * gkhead.width), Math.floor(actualZoomFactor * gkhead.height));			
    // var tmpCanvas = document.createElement('canvas');
    // tmpCanvas.width = imgData.width;
    // tmpCanvas.height = imgData.height;
    // var tmpCtx = tmpCanvas.getContext('2d');
    // tmpCtx.putImageData(imgData, 0, 0);        
    // document.getElementById('display-image').src = tmpCanvas.toDataURL("image/png");    
    
    var _origin = {x: 0, y: 0};
    _origin.x = centerX - gkhead.width / 2 * actualZoomFactor;
    _origin.y = centerY - gkhead.height / 2 * actualZoomFactor;            
    var transform = {x: 0, y: 0};
    transform.x = (actualPt.x - _origin.x) / actualZoomFactor;
    transform.y = (actualPt.y - _origin.y) / actualZoomFactor;
    $('#editor-region').css('transform', 
        `scale(${(actualZoomFactor).toString()}) 
        translate(${(transform.x).toString()}px, ${(transform.y).toString()}px)`);
}

function ClearCanvas(_context) {
    var p1 = _context.getTransformedPoint(0,0);
    var p2 = _context.getTransformedPoint(_context.canvas.width, _context.canvas.height);
    _context.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);    
}

function redraw(){
    ClearCanvas(toolDrawCtx);

    // toolDrawCtx.saveTransform();
    // toolDrawCtx.setTransform(1,0,0,1,0,0);
    // toolDrawCtx.clearRect(0,0,toolDrawCanvas.width,toolDrawCanvas.height);
    // toolDrawCtx.fillStyle = "#00FF00";
    // // toolDrawCtx.fillRect(toolDrawCtx.getTransformedPoint(20,lastY).x, lastY, 100,100);
    // toolDrawCtx.restoreTransform();

    toolDrawCtx.drawImage(gkhead, clientOffset.x, clientOffset.y);

    var _temp = toolDrawCtx.getActualPoint(20, 30);
    console.log(_temp);
    var imgData = toolDrawCtx.getImageData(
        Math.ceil(_temp.x), Math.ceil(_temp.y),
        Math.floor(actualZoomFactor * gkhead.width), Math.floor(actualZoomFactor * gkhead.height));			
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imgData.width;
    tmpCanvas.height = imgData.height;
    var tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.putImageData(imgData, 0, 0);        
    document.getElementById('display-image').src = tmpCanvas.toDataURL("image/png");

    updateBackground();
 }

 function OnChangeTool() {
	var toolname = document.getElementById('tool-select').value;
	ToolMode = toolname;
	if (ToolMode == 'Move') {
		document.getElementById('tolerance').disabled = true;
		document.getElementById('size').disabled = true;		
	} else if(ToolMode == 'Eraser') {
		document.getElementById('tolerance').disabled = true;
		document.getElementById('size').disabled = false;
	} else if(ToolMode == 'Lasso') {
		document.getElementById('tolerance').disabled = true;
		document.getElementById('size').disabled = true;
	} else if(ToolMode == 'MagicWand') {
		document.getElementById('tolerance').disabled = false;
		document.getElementById('size').disabled = true;
	}

    if (ToolMode == 'Move') toolDrawCanvas.style.cursor = 'move';
    else toolDrawCanvas.style.cursor = 'default';
}

function OnChangeSelection() {
	SelectionMode = document.getElementById('selection-mode').value;
	if(SelectionMode == 'New') {
		oldMask = null;
		mask = null;
	}
}

function uploadClick() {
	document.getElementById("file-upload").click();
}

function imgChange(inp) {
	if(inp.files && inp.files[0]) {
		var reader = new FileReader();
		reader.onload = function(e) {
			gkhead.src = e.target.result;
            orig_image.src = e.target.result;
			orig_image.onload = function() {
				toolDrawCanvas.width = window.innerWidth
				toolDrawCanvas.height = window.innerHeight
		
                $('#editor-region').css('width', gkhead.width);
                $('#editor-region').css('height', gkhead.height);
                $('#display-image').css('width', gkhead.width);
                $('#display-image').css('height', gkhead.height);

                centerX = editorRegion.offsetLeft + editorRegion.offsetWidth / 2;
                centerY = editorRegion.offsetTop + editorRegion.offsetHeight / 2;
                toolDrawCtx.setTransform(1,0,0,1,0,0);
				toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
                redraw();
			}
		}
		reader.readAsDataURL(inp.files[0]);
	}
}

function onClear() {
    gkhead.src = orig_image.src;
    storedPolygonLines = [];
    isDrawingMode = false;
    mask = null;
    oldMask = null;
    redraw();
}

download_img = function(el) {
	el.href = gkhead.src;
};