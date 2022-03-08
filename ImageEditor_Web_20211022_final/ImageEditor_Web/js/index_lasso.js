window.onload = function() {
	cameraOffset = { x: 0, y: 0 }
    cameraZoom = 1
    let MAX_ZOOM = 5
    let MIN_ZOOM = 0.1
    let SCROLL_SENSITIVITY = 0.0005
    let isDragging = false
    let dragStart = { x: 0, y: 0 }



	var _height = window.innerHeight;
	var _width = window.innerWidth;
	hatchLength = 4;
	hatchOffset = 0;
	img = document.getElementById("display-image");
	$('#editor-region').css('width', img.width);
	$('#editor-region').css('height', img.height);
	editorRegion = document.getElementById('editor-region');
	toolRegion = document.getElementById('tool-area');
	clientOffset = null;
	toolDrawCanvas = document.getElementById("toolDrawCanvas");
	toolDrawCanvas.width = _width;
	toolDrawCanvas.height = _height - toolRegion.offsetHeight;
	toolDrawCtx = toolDrawCanvas.getContext('2d');
	selectionCanvas = document.getElementById("selectionCanvas");
	selectionCanvas.width = _width;
	selectionCanvas.height = _height - toolRegion.offsetHeight;
	centerX = img.offsetLeft + img.width / 2;
	centerY = img.offsetTop + img.height / 2;
	selectionCtx = selectionCanvas.getContext('2d');
	orig_image = null;
	mask = null;
	oldMask = null;
	storedPolygonLines = [];
	minX_lasso = 0, maxX_lasso = 0;
	minY_lasso = 0, maxY_lasso = 0;
	lassoCanvas = null;
	lassoCtx = null;
	ToolMode = 'Move';
	SelectionMode = 'New';
	prevSelectionMode = 'New';
	cacheInd = null; // Indices for border points of the selected region
	isDrawingMode = false; // true when clicking the left mouse button in Polygon tool mode
	isLMousePressed = false; // true when clicking the left mouse button in Eraser tool mode
	// document.getElementById('tolerance').disabled = true;
	// document.getElementById('size').disabled = false;

	// $('#editor-region').css('width', img.width);
	// $('#editor-region').css('height', img.height);
	var innerRect = selectionCanvas.getBoundingClientRect();
	var outerRect = document.getElementById('editor-region').getBoundingClientRect();
	clientOffset = {
		x: Math.ceil(outerRect.left - innerRect.left),
		y: Math.ceil(outerRect.top - innerRect.top)
	}	
	var firstPt = {
		x: 0,
		y: 0
	};
	var prevPt = {
		x: 0,
		y: 0
	};

	function distance(pt1, pt2) {
		var result = Math.sqrt(Math.pow((pt2[0] - pt1[0]), 2) + Math.pow((pt2[1] - pt1[1]), 2));
		return result;
	}

	function redrawStoredPolygonLines() {
		toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
		if(storedPolygonLines.length == 0) {
			return;
		}
		// redraw each stored line
		toolDrawCtx.save();
		toolDrawCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
		toolDrawCtx.shadowColor = 'rgba(0, 0, 0, 1)';
		toolDrawCtx.shadowOffsetX = 0;
		toolDrawCtx.shadowOffsetY = 0;
		for(var i = 0; i < storedPolygonLines.length; i++) {
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(storedPolygonLines[i].x1, storedPolygonLines[i].y1);
			toolDrawCtx.lineTo(storedPolygonLines[i].x2, storedPolygonLines[i].y2);
			toolDrawCtx.stroke();
		}		
		toolDrawCtx.restore();
	}
	setInterval(function() {
		hatchTick();
	}, 100);
	selectionCanvas.addEventListener('mousemove', function(evt) {
		var mousePos = getMousePos(toolDrawCanvas, evt);
		var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
		// console.log(message);
	}, false);
    function draw()
    {
        toolDrawCanvas.width = window.innerWidth
        toolDrawCanvas.height = window.innerHeight
        selectionCanvas.width = window.innerWidth
        selectionCanvas.height = window.innerHeight

		$('#editor-region').css('transform', `scale(${(cameraZoom).toString()}) translate(${(cameraOffset.x / cameraZoom).toString()}px, ${(cameraOffset.y / cameraZoom).toString()}px)`)
		// toolDrawCtx.translate( window.innerWidth / 2, window.innerHeight / 2 )
        // toolDrawCtx.scale(cameraZoom, cameraZoom)
        // toolDrawCtx.translate( cameraOffset.x, cameraOffset.y )
		// selectionCtx.translate( window.innerWidth / 2, window.innerHeight / 2 )
        // selectionCtx.scale(cameraZoom, cameraZoom)
        // selectionCtx.translate( cameraOffset.x, cameraOffset.y )

		toolDrawCtx.clearRect(0,0, window.innerWidth, window.innerHeight)
		toolDrawCtx.fillStyle = "#991111"
		toolDrawCtx.fillRect(
			cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom), 
			cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom),
			100, 100)
		toolDrawCtx.fillStyle = "#00FF00"
    	toolDrawCtx.fillRect(0, 0, 100, 100)
        // requestAnimationFrame( draw )
		// console.log('');
		// console.log(editorRegion.offsetLeft);
    }
	draw()

	function getMousePos(client, evt) {
		var clientRect = client.getBoundingClientRect();
		return {
			x: parseInt(evt.clientX - clientRect.left),
			y: parseInt(evt.clientY - clientRect.top)
		};
	}
	function getActualCoordinate() {
		return {
			x: cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom), 
			y: cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)
		};
	}
	document.getElementById('workspaceContainerDiv').addEventListener('mousedown', function(e) {
		if (ToolMode == 'Move') {
			isDragging = true
			dragStart.x = getMousePos(toolDrawCanvas, e).x / cameraZoom - cameraOffset.x
			dragStart.y = getMousePos(toolDrawCanvas, e).y / cameraZoom - cameraOffset.y
			
			return;
		}

		
		if(e.button != 0) return;	
		var mousePos = getMousePos(toolDrawCanvas, e);
		// mousePos.x = parseInt(mousePos.x / cameraZoom);
		// mousePos.y = parseInt(mousePos.y / cameraZoom);
		
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
				lassoCtx.canvas.width = img.width * cameraZoom;
				lassoCtx.canvas.height = img.height * cameraZoom;
				lassoCtx.clearRect(0, 0, lassoCanvas.width, lassoCanvas.height);
				lassoCtx.fillStyle = 'red';
				lassoCtx.fillRect(0, 0, lassoCanvas.width, lassoCanvas.height);
				lassoCtx.globalCompositeOperation = 'destination-out';
				lassoCtx.beginPath();
				lassoCtx.moveTo(firstPt.x - getActualCoordinate().x, firstPt.y - getActualCoordinate().y);
				minX_lasso = firstPt.x - getActualCoordinate().x;
				maxX_lasso = firstPt.x - getActualCoordinate().x;
				minY_lasso = firstPt.y - getActualCoordinate().y;
				maxY_lasso = firstPt.y - getActualCoordinate().y;
			} else {
				if(storedPolygonLines.length > 0 && distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 10) {
					storedPolygonLines.push({
						x1: prevPt.x,
						y1: prevPt.y,
						x2: firstPt.x,
						y2: firstPt.y
					});
					isDrawingMode = false;
					lassoCtx.lineTo(firstPt.x - getActualCoordinate().x, firstPt.y - getActualCoordinate().y);
					lassoCtx.closePath();
					lassoCtx.fill();
					toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
					// img.src = lassoCanvas.toDataURL();
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
					lassoCtx.lineTo(mousePos.x - getActualCoordinate().x, mousePos.y - getActualCoordinate().y);
					minX_lasso = Math.min(minX_lasso, prevPt.x - Math.ceil(getActualCoordinate().x));
					maxX_lasso = Math.max(maxX_lasso, prevPt.x - Math.ceil(getActualCoordinate().x));
					minY_lasso = Math.min(minY_lasso, prevPt.y - Math.ceil(getActualCoordinate().y));
					maxY_lasso = Math.max(maxY_lasso, prevPt.y - Math.ceil(getActualCoordinate().y));
				}
			}
		} else if(ToolMode == 'MagicWand') {
			if(mousePos.x < 0 || mousePos.y < 0) return;
			getMagicWandMask(mousePos.x - getActualCoordinate().x, mousePos.y - getActualCoordinate().y);
		} else if(ToolMode == 'Eraser') {
			isLMousePressed = true;
			prevPt = {
				x: mousePos.x,
				y: mousePos.y
			};
			toolDrawCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			toolDrawCtx.globalCompositeOperation = "source-over";
			toolDrawCtx.drawImage(document.getElementById("display-image"), 
				cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom), 
				cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom),
				img.width * cameraZoom, img.height * cameraZoom);
			$('#display-image').css('display', 'none');
			toolDrawCtx.save();
			toolDrawCtx.globalCompositeOperation = 'destination-out';
			toolDrawCtx.beginPath();
			toolDrawCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			toolDrawCtx.fill();
			toolDrawCtx.stroke();
			toolDrawCtx.restore();
			selectionCtx.clearRect(0, 0, window.innerWidth / cameraZoom, window.innerHeight / cameraZoom);
			selectionCtx.beginPath();
			selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			selectionCtx.stroke();
		}
	});
	document.getElementById('workspaceContainerDiv').addEventListener('mousemove', function(e) {
        if (ToolMode === 'Move' && isDragging)
        {
            cameraOffset.x = getMousePos(toolDrawCanvas, e).x / cameraZoom - dragStart.x
            cameraOffset.y = getMousePos(toolDrawCanvas, e).y / cameraZoom - dragStart.y
			draw();
			return;
        }
		
		if(e.button != 0) return;
		var mousePos = getMousePos(toolDrawCanvas, e);
		// mousePos.x = parseInt(mousePos.x / cameraZoom);
		// mousePos.y = parseInt(mousePos.y / cameraZoom);

		if(ToolMode == 'Eraser') {
			// toolDrawCanvas.style.cursor = 'url(\'./cursor/temp.png\'), auto';
			// toolDrawCanvas.style.cursor = 'cross';
			selectionCtx.clearRect(0, 0, window.innerWidth / cameraZoom, window.innerHeight / cameraZoom);
			selectionCtx.beginPath();
			selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			selectionCtx.stroke();
		} else toolDrawCanvas.style.cursor = 'default';
		// toolDrawCanvas.style.cursor = 'url(\'./cursor/magicwand.cur\'), auto';
		if(ToolMode == 'Lasso' && isDrawingMode) {
			redrawStoredPolygonLines();
			toolDrawCtx.save();
			toolDrawCtx.save();
			toolDrawCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, 1)';
			toolDrawCtx.shadowOffsetX = 0;
			toolDrawCtx.shadowOffsetY = 0;
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(prevPt.x, prevPt.y);
			if (e.ctrlKey) {
				var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x));
				if (angle < Math.PI / 8)
					toolDrawCtx.lineTo(mousePos.x, prevPt.y);
				else if (angle < 3 * Math.PI / 8){
					if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
						toolDrawCtx.lineTo(prevPt.x + mousePos.y - prevPt.y, mousePos.y);
					else
						toolDrawCtx.lineTo(mousePos.x, prevPt.y - mousePos.x + prevPt.x);
				}
				else
					toolDrawCtx.lineTo(prevPt.x, mousePos.y);
			}
			else
				toolDrawCtx.lineTo(mousePos.x, mousePos.y);
			toolDrawCtx.stroke();
			toolDrawCtx.restore();
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
			selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
			selectionCtx.beginPath();
			selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI);
			selectionCtx.stroke();
			prevPt = {
				x: x,
				y: y
			};
		}
	});
	document.getElementById('workspaceContainerDiv').addEventListener('mouseup', function(e) {
		if (ToolMode == 'Move') {
			isDragging = false
			initialPinchDistance = null
			lastZoom = cameraZoom
			return;
		}

		
		if(e.button != 0) return;
		isLMousePressed = false;
		if(ToolMode == 'Eraser') {
			var _x = cameraOffset.x / cameraZoom + clientOffset.x / cameraZoom + (centerX - clientOffset.x) / cameraZoom - (centerX - clientOffset.x);
			var _y = cameraOffset.y / cameraZoom + clientOffset.y / cameraZoom + (centerY - clientOffset.y) / cameraZoom - (centerY - clientOffset.y);
			// var imgData = toolDrawCtx.getImageData(
			// 	cameraOffset.x / cameraZoom + clientOffset.x / cameraZoom + (centerX - clientOffset.x) / cameraZoom - (centerX - clientOffset.x), 
			// 	cameraOffset.y / cameraZoom + clientOffset.y / cameraZoom + (centerY - clientOffset.y) / cameraZoom - (centerY - clientOffset.y),
			// 	img.width, img.height);
			var imgData = toolDrawCtx.getImageData(
				parseInt(cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom)), 
				parseInt(cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)),
					Math.ceil(img.width * cameraZoom), Math.ceil(img.height * cameraZoom));			
			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = imgData.width;
			tmpCanvas.height = imgData.height;
			var tmpCtx = tmpCanvas.getContext('2d');
			tmpCtx.putImageData(imgData, 0, 0);

			img.src = tmpCanvas.toDataURL("image/png");
			$('#display-image').css('display', 'block');
			toolDrawCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
		}
		if(SelectionMode == 'New') {
			// oldMask = null;
			// selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
		} else {
			// oldMask = mask;
		}
	});
	document.getElementById('workspaceContainerDiv').addEventListener('dblclick', function(e) {
		var mousePos = getMousePos(toolDrawCanvas, e)
		// mousePos.x = parseInt(mousePos.x / cameraZoom);
		// mousePos.y = parseInt(mousePos.y / cameraZoom);

		if(ToolMode != 'Lasso') return;
		if(!isDrawingMode || storedPolygonLines.length == 0) return;
		curPt = {
			x: mousePos.x,
			y: mousePos.y
		};
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

		if(distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 10) {
			storedPolygonLines.push({
				x1: prevPt.x,
				y1: prevPt.y,
				x2: firstPt.x,
				y2: firstPt.y
			});
		} else {
			storedPolygonLines.push({
				x1: prevPt.x,
				y1: prevPt.y,
				x2: mousePos.x,
				y2: mousePos.y
			});
			storedPolygonLines.push({
				x1: mousePos.x,
				y1: mousePos.y,
				x2: firstPt.x,
				y2: firstPt.y
			});
			lassoCtx.lineTo(mousePos.x - getActualCoordinate().x, mousePos.y - getActualCoordinate().y);
			prevPt = {
				x: mousePos.x,
				y: mousePos.y
			};
			minX_lasso = Math.min(minX_lasso, prevPt.x - getActualCoordinate().x);
			maxX_lasso = Math.max(maxX_lasso, prevPt.x - getActualCoordinate().x);
			minY_lasso = Math.min(minY_lasso, prevPt.y - getActualCoordinate().y);
			maxY_lasso = Math.max(maxY_lasso, prevPt.y - getActualCoordinate().y);
		}
		lassoCtx.lineTo(firstPt.x - getActualCoordinate().x, firstPt.y - getActualCoordinate().y);
		isDrawingMode = false;
		lassoCtx.closePath();
		lassoCtx.fill();
		// img.src = lassoCanvas.toDataURL();
		toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
		mask = getLassoMask(lassoCtx.getImageData(0, 0, lassoCanvas.width, lassoCanvas.height), parseInt(minX_lasso), parseInt(maxX_lasso), parseInt(minY_lasso), parseInt(maxY_lasso));
		getOperatedMask();
	});
    function adjustZoom(e, zoomAmount, zoomFactor)
    {
        e.preventDefault();
        if (!isDragging)
        {
            if (zoomAmount)
            {
                cameraZoom += zoomAmount
            }
            else if (zoomFactor)
            {
                cameraZoom = zoomFactor*lastZoom
            }
            
            cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
            cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
			// clientOffset.x *= cameraZoom;
			// clientOffset.y *= cameraZoom;
            draw()
        }
    }
    
	document.getElementById('workspaceContainerDiv').addEventListener( 'wheel', (e) => adjustZoom(e, e.deltaY*SCROLL_SENSITIVITY))

}


window.addEventListener('resize', function(event){
	// var _height = window.innerHeight;
	// var _width = window.innerWidth;	
	// toolDrawCanvas.width = _width;
	// toolDrawCanvas.height = _height - toolRegion.offsetHeight;
	// selectionCanvas.width = _width;
	// selectionCanvas.height = _height - toolRegion.offsetHeight;

	// $('#editor-region').css('width', img.width);
	// $('#editor-region').css('height', img.height);

	// var innerRect = selectionCanvas.getBoundingClientRect();
	// var outerRect = document.getElementById('editor-region').getBoundingClientRect();
	// clientOffset = {
	// 	x: Math.ceil(outerRect.left - innerRect.left),
	// 	y: Math.ceil(outerRect.top - innerRect.top)
	// };	
	// console.log(outerRect);
	// console.log(document.getElementById('display-image').getBoundingClientRect());
});

document.addEventListener("keydown", function(event) {
    if (event.key === 'Control') {
    	return;
    }
	
	if(event.key == 'Delete') { 
		if(ToolMode == 'Eraser') return;
		if (!oldMask) return;

		var _img = document.createElement('img');
		// _img.setAttribute('crossOrigin', '');
		
		// _img.addEventListener('load', () => {
		// 	toolDrawCtx.drawImage(_img,0,0);
		// 	toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
		// 	var data = toolDrawCtx.getImageData(0,0,600,400);
		// 	alert(data);
		// });
		// _img.setAttribute('src', img.src);

		toolDrawCtx.save();
		toolDrawCtx.drawImage(img, 
			parseInt(cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom)), 
			parseInt(cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)),
			img.width * cameraZoom, img.height * cameraZoom);
		toolDrawCtx.globalCompositeOperation = 'destination-out';
		toolDrawCtx.beginPath();
		if(ToolMode == 'MagicWand' || ToolMode == 'Lasso') {
			cacheInd = MagicWand.getBorderIndices(oldMask);
			var len = oldMask.data.length;
			w = parseInt(img.width* cameraZoom);
			h = parseInt(img.height* cameraZoom);
			x = cacheInd[0] % w;
			y = (cacheInd[0] - x) / w;
			for(j = 0; j < len; j++) {
				if(oldMask.data[j] === 0) continue;
				i = oldMask.data[j];
				x = j % w; // calc x by index
				y = (j - x) / w; // calc y by index
				toolDrawCtx.fillRect(
					x + parseInt(cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom)), 
					y + parseInt(cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)), 
					1, 1);
			}
		}
		toolDrawCtx.closePath();
		toolDrawCtx.fill();
		toolDrawCtx.restore();

		var imgData = toolDrawCtx.getImageData(
			parseInt(cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom)), 
			parseInt(cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom)),
			img.width * cameraZoom, img.height * cameraZoom);
		var tmpCanvas = document.createElement('canvas');
		tmpCanvas.width = imgData.width;
		tmpCanvas.height = imgData.height;
		var tmpCtx = tmpCanvas.getContext('2d');
		tmpCtx.putImageData(imgData, 0, 0);
		img.src = tmpCanvas.toDataURL("image/png");

		storedPolygonLines = [];
		isDrawingMode = false;
		toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
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
		toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
		selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
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
// document.addEventListener("keyup", function(event) {
// 	if(event.key == 'Shift') { 
// 		SelectionMode = 'New';
// 		document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode;
// 	} else if(event.key == 'Alt') { 
// 		SelectionMode = 'New';
// 		document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode;
// 	}
// 	if (SelectionMode == 'New') 
// 		document.getElementById('selection-mode').selectedIndex = 0;
// 	else if (SelectionMode ==  'Add')
// 		document.getElementById('selection-mode').selectedIndex = 1;
// 	else if (SelectionMode == 'Subtract')
// 		document.getElementById('selection-mode').selectedIndex = 2;
// 	else if (SelectionMode == 'Intersect') 
// 		document.getElementById('selection-mode').selectedIndex = 3;
// });

function OnChangeTool() {
	var toolname = document.getElementById('tool-select').value;
	// var toolname = document.querySelector('input[name="tool"]:checked').value;
	ToolMode = toolname;
	if (ToolMode == 'Move') {
		document.getElementById('tolerance').disabled = true;
		document.getElementById('size').disabled = true;
		toolDrawCanvas.style.cursor = 'move';
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
}

function OnChangeSelection() {
	SelectionMode = document.getElementById('selection-mode').value;
	// SelectionMode = document.querySelector('input[name="selectionoption"]:checked').value;
	if(SelectionMode == 'New') {
		oldMask = null;
		mask = null;
	}
}

function getLassoMask(imgData, minX_lasso, maxX_lasso, minY_lasso, maxY_lasso) {
	var data = imgData.data,
		w = imgData.width,
		h = imgData.height,
		bytes = imgData.bytes,
		result = new Uint8Array(w * h);
	// console.log('');
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

function hatchTick() {
	hatchOffset = (hatchOffset + 1) % (hatchLength * 2);
	drawBorder(true);
}

function getPixel(x, y) {
	if(x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
		return 0;
	}
	const ind = x + y * imageData.width;
	return ind;
}

function getIndicesOnLine(imageData, startX, startY, endX, endY) {
	const indices = [];
	var x = Math.floor(startX);
	var y = Math.floor(startY);
	const xx = Math.floor(endX);
	const yy = Math.floor(endY);
	const dx = Math.abs(xx - x);
	const sx = x < xx ? 1 : -1;
	const dy = -Math.abs(yy - y);
	const sy = y < yy ? 1 : -1;
	var err = dx + dy;
	var e2;
	var end = false;
	while(!end) {
		indices.push(x + y * imageData.width);
		if((x === xx && y === yy)) {
			end = true;
		} else {
			e2 = 2 * err;
			if(e2 >= dy) {
				err += dy;
				x += sx;
			}
			if(e2 <= dx) {
				err += dx;
				y += sy;
			}
		}
	}
	return indices;
}


function drawBorder(noBorder) {
	if(ToolMode == 'Eraser') return;
	if(!oldMask) return;
	// if (ToolMode ==  'MagicWand' && !mask) return;
	// if (ToolMode == 'Lasso' && (storedPolygonLines.length == 0 || isDrawingMode)) return;
	var x, y, i, j, k,
		w = img.width * cameraZoom,
		h = img.height * cameraZoom,
		imgData = selectionCtx.createImageData(w, h);
	// if (isDrawingMode)
	// 	imgData = selectionCtx.getImageData(0,0,w,h);
	res = imgData.data;	
	
	cacheInd = MagicWand.getBorderIndices(oldMask);
	// toolDrawCtx.clearRect(0, 0, w, h);
	var len = cacheInd.length;
	for(j = 0; j < len; j++) {
		i = cacheInd[j];
		x = i % parseInt(img.width * cameraZoom); // calc x by index
		y = (i - x) / parseInt(img.width * cameraZoom); // calc y by index
		k = (y * parseInt(img.width * cameraZoom) + x) * 4;
		
		if((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) { // detect hatch color 
			res[k + 3] = 255; // black, change only alpha
		} else {
			res[k] = 255; // white
			res[k + 1] = 255;
			res[k + 2] = 255;
			res[k + 3] = 255;
		}
	}

	selectionCtx.putImageData(
		imgData, 
		cameraOffset.x / cameraZoom + clientOffset.x + (centerX - clientOffset.x) * (1 - cameraZoom), 
		cameraOffset.y / cameraZoom + clientOffset.y + (centerY - clientOffset.y) * (1 - cameraZoom));
}

function uploadClick() {
	document.getElementById("file-upload").click();
}

function imgChange(inp) {
	if(inp.files && inp.files[0]) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var tmpImg = document.createElement('img');
			tmpImg.src = e.target.result;
			tmpImg.onload = function() {
				cameraZoom = 1
				cameraOffset.x = 0
				cameraOffset.y = 0
				toolDrawCanvas.width = window.innerWidth
				toolDrawCanvas.height = window.innerHeight
				selectionCanvas.width = window.innerWidth
				selectionCanvas.height = window.innerHeight
		
				$('#editor-region').css('transform', `scale(${(cameraZoom).toString()}) translate(${(cameraOffset.x).toString()}px, ${(cameraOffset.y).toString()}px)`)
				// toolDrawCtx.translate( window.innerWidth / 2, window.innerHeight / 2 )
				// toolDrawCtx.scale(cameraZoom, cameraZoom)
				// toolDrawCtx.translate( 0, 0 )
		
				// selectionCtx.translate( window.innerWidth / 2, window.innerHeight / 2 )
				// selectionCtx.scale(cameraZoom, cameraZoom)
				// selectionCtx.translate( 0, 0 )

				// $('#editor-region').css('transform', `scale(${(cameraZoom).toString()}) translate(${(cameraOffset.x - window.innerWidth/2).toString()}px, ${(cameraOffset.y - window.innerHeight / 2).toString()}px)`)

				if (tmpImg.width > 1280 || tmpImg.height > 720) {
					var aspect_ratio = tmpImg.width / tmpImg.height;
				}
				// if(tmpImg.width > 1280) {
				// 	$('#editor-region').css('width', 1280);
				// 	$('#editor-region').css('height', 720);
				// 	$('#display-image').css('width', 1280);
				// 	$('#display-image').css('height', 720);	
				// } else {
					$('#editor-region').css('width', tmpImg.width);
					$('#editor-region').css('height', tmpImg.height);
					$('#display-image').css('width', tmpImg.width);
					$('#display-image').css('height', tmpImg.height);
				// }

				var innerRect = selectionCanvas.getBoundingClientRect();
				var outerRect = document.getElementById('editor-region').getBoundingClientRect();
				clientOffset = {
					x: Math.ceil(outerRect.left - innerRect.left),
					y: Math.ceil(outerRect.top - innerRect.top)
				}
				centerX = editorRegion.offsetLeft + img.width / 2;
				centerY = editorRegion.offsetTop + img.height / 2;
				toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
				toolDrawCtx.drawImage(tmpImg, clientOffset.x, clientOffset.y, img.width, img.height);
				var imgData = toolDrawCtx.getImageData(clientOffset.x, clientOffset.y, img.width, img.height);
				var tmpCanvas = document.createElement('canvas');
				tmpCanvas.width = img.width;
				tmpCanvas.height = img.height;
				var tmpCtx = tmpCanvas.getContext('2d');
				tmpCtx.putImageData(imgData, 0, 0);
				orig_image = tmpCanvas.toDataURL("image/png");;
				img.src = tmpCanvas.toDataURL("image/png");
				mask = null;
				oldMask = null;
				toolDrawCtx.clearRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
				selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
				img.onload = function() {
					window.initCanvas(img);
					document.getElementById('file-upload').value = '';
					$("#file-upload").attr('value', '');  
				};
			}
		}
		reader.readAsDataURL(inp.files[0]);
	}
}

function initCanvas(img) {
	// toolDrawCanvas.width = img.width;
	// toolDrawCanvas.height = img.height;
	// selectionCanvas.width = img.width;
	// selectionCanvas.height = img.height;
	imageInfo = {
		width: img.width,
		height: img.height,
		context: toolDrawCtx
	};
	mask = null;
	var tempCtx = document.createElement("canvas").getContext("2d");
	tempCtx.canvas.width = imageInfo.width;
	tempCtx.canvas.height = imageInfo.height;
	tempCtx.drawImage(img, 0, 0, imageInfo.width, imageInfo.height);
	imageInfo.data = tempCtx.getImageData(0, 0, imageInfo.width, imageInfo.height);
	// $('#workspaceContainerDiv').css('width', imageInfo.width);
	// $('#workspaceContainerDiv').css('height', imageInfo.height);
	mask = null;
	oldMask = null;
}

function getMagicWandMask(x, y) {
	imageInfo = {
		width: parseInt(img.width * cameraZoom),
		height: parseInt(img.height * cameraZoom),
		context: toolDrawCtx
	};
	mask = null;
	var tempCtx = document.createElement("canvas").getContext("2d");
	tempCtx.canvas.width = imageInfo.width;
	tempCtx.canvas.height = imageInfo.height;
	tempCtx.drawImage(img, 0, 0, imageInfo.width, imageInfo.height);
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
download_img = function(el) {
	// get image URI from canvas object
	var imageURI = toolDrawCanvas.toDataURL("image/jpg");
	var img = document.getElementById('display-image');
	el.href = img.src;
};

function addMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = {
			minX: Math.min(oldBound.minX, newBound.minX),
			minY: Math.min(oldBound.minY, newBound.minY),
			maxX: Math.max(oldBound.maxX, newBound.maxX),
			maxY: Math.max(oldBound.maxY, newBound.maxY)
		};
	let result = new Uint8Array(w * h);
	for(i = resBound.minY; i <= resBound.maxY; i++) {
		for(j = resBound.minX; j <= resBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1 || newData[index] == 1) {
				result[index] = 1;
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function subtractMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = oldBound;
	let result = new Uint8Array(w * h);
	for(i = oldBound.minY; i <= oldBound.maxY; i++) {
		for(j = oldBound.minX; j <= oldBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1) {
				if(newData[index] == 0) {
					result[index] = 1;
				}
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function intersectMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = {
			minX: Math.max(oldBound.minX, newBound.minX),
			minY: Math.max(oldBound.minY, newBound.minY),
			maxX: Math.min(oldBound.maxX, newBound.maxX),
			maxY: Math.min(oldBound.maxY, newBound.maxY)
		};
	let result = new Uint8Array(w * h);
	for(i = resBound.minY; i <= resBound.maxY; i++) {
		for(j = resBound.minX; j <= resBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1) {
				if(newData[index] == 1) {
					result[index] = 1;
				}
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function concatMasks(mask, old) {
	let data1 = old.data,
		data2 = mask.data,
		w1 = old.width,
		w2 = mask.width,
		b1 = old.bounds,
		b2 = mask.bounds,
		b = { // bounds for new mask
			minX: Math.min(b1.minX, b2.minX),
			minY: Math.min(b1.minY, b2.minY),
			maxX: Math.max(b1.maxX, b2.maxX),
			maxY: Math.max(b1.maxY, b2.maxY)
		},
		w = old.width, // size for new mask
		h = old.height,
		i, j, k, k1, k2, len;
	let result = new Uint8Array(w * h);
	// copy all old mask
	len = b1.maxX - b1.minX + 1;
	i = b1.minY * w + b1.minX;
	k1 = b1.minY * w1 + b1.minX;
	k2 = b1.maxY * w1 + b1.minX + 1;
	// walk through rows (Y)
	for(k = k1; k < k2; k += w1) {
		result.set(data1.subarray(k, k + len), i); // copy row
		i += w;
	}
	// copy new mask (only "black" pixels)
	len = b2.maxX - b2.minX + 1;
	i = b2.minY * w + b2.minX;
	k1 = b2.minY * w2 + b2.minX;
	k2 = b2.maxY * w2 + b2.minX + 1;
	// walk through rows (Y)
	for(k = k1; k < k2; k += w2) {
		// walk through cols (X)
		for(j = 0; j < len; j++) {
			if(data2[k + j] === 1) result[i + j] = 1;
		}
		i += w;
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: b
	};
}