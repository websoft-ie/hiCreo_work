window.onload = function() {
  toolDrawCanvas = document.getElementById('toolDrawCanvas')
  toolDrawCanvas.width = window.innerWidth
  toolDrawCanvas.height = window.innerHeight - document.getElementById('tool-area').offsetHeight
  toolDrawCtx = toolDrawCanvas.getContext('2d')
  selectionCanvas = document.getElementById("selectionCanvas")
  selectionCanvas.width = window.innerWidth
  selectionCanvas.height = window.innerHeight - document.getElementById('tool-area').offsetHeight
  selectionCtx = selectionCanvas.getContext('2d')
  borderCanvas = document.getElementById("borderCanvas")
  borderCanvas.width = window.innerWidth
  borderCanvas.height = window.innerHeight - document.getElementById('tool-area').offsetHeight
  borderCtx = borderCanvas.getContext('2d')

  trackTransforms(toolDrawCtx)
  trackTransforms(selectionCtx)
  trackTransforms(borderCtx)

  editorRegion = document.getElementById('editor-region')
  imgcenterX = 0
  imgcenterY = 0
  responsive = true

  clientOffset = { x: 20, y: 0 }
  canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)

  lastX = toolDrawCanvas.width / 2
  lastY = toolDrawCanvas.height / 2
  dragStart = null
  dragged = false
  scalefactor = 1.1
  prezoomcenterX = 0
  prezoomcenterY = 0
  prezoomfactor = 1
  curzoomfactor = 1
  preWinWidth = window.innerWidth
  preWinHeight = window.innerHeight
  preangle = null

  hatchLength = 4
  hatchOffset = 0
  imgscale = 1

  origimg = new Image()
  curimgCanvas = null
  curimgCtx = null
  mask = null // mask for the current selection (not feathered)
  prevmask = null // mask after done add/subtract/intersect
  coremask = null // use this for showing the feathered mask border
  feathereddata = null // image data for feathered mask
  storedPolygonLines = []
  minX_lasso = 0, maxX_lasso = 0
  minY_lasso = 0, maxY_lasso = 0
  lassoCanvas = null
  lassoCtx = null
  ToolMode = 'Eraser'
  SelectionMode = 'New'
  isDrawingMode = false // true when clicking the left mouse button in Polygon tool mode
  isLMousePressed = false // true when clicking the left mouse button in Eraser tool mode

  var firstPt = { x: 0, y: 0 }
  var prevPt = { x: 0, y: 0 }

  inputElement = document.getElementById("file-upload");
  inputElement.addEventListener("change", function() {
    imgChange(this)
  }, false);

  selectionCanvas.addEventListener('mousedown', function(e) {
    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    if (ToolMode == 'Move') {
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none'
      dragStart = toolDrawCtx.getTransformedPoint(lastX, lastY)
      dragged = false
      redraw()
      return
    }

    if (e.button != 0) return
    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)

    if (SelectionMode == 'New') {
      ClearCanvas(selectionCtx)
      ClearCanvas(borderCtx)
      prevmask = null
      coremask = null
      feathereddata = null
    }
    if (ToolMode == 'Lasso') {
      if (!isDrawingMode) {
        isDrawingMode = true
        storedPolygonLines = []
        prevPt = mousePos
        firstPt = prevPt
        lassoCanvas = document.createElement("canvas")
        lassoCtx = lassoCanvas.getContext("2d")
        lassoCanvas.width = curimgCanvas.width
        lassoCanvas.height = curimgCanvas.height
        lassoCtx.filter = `blur(${(document.getElementById('feather').value * imgscale / curzoomfactor).toString()}px)`
        lassoCtx.fillStyle = '#FFFFFFFF'
        lassoCtx.beginPath()
        lassoCtx.moveTo(
          Math.round(imgscale * (mousePos.x - clientOffset.x)),
          Math.round(imgscale * (mousePos.y - clientOffset.y)))
        minX_lasso = Math.round(imgscale * (mousePos.x - clientOffset.x))
        maxX_lasso = Math.round(imgscale * (mousePos.x - clientOffset.x))
        minY_lasso = Math.round(imgscale * (mousePos.y - clientOffset.y))
        maxY_lasso = Math.round(imgscale * (mousePos.y - clientOffset.y))
      } else {
        if (storedPolygonLines.length > 0 && distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
          storedPolygonLines.push({
            x1: prevPt.x,
            y1: prevPt.y,
            x2: firstPt.x,
            y2: firstPt.y
          })
          isDrawingMode = false
          lassoCtx.lineTo(
            Math.round(imgscale * (mousePos.x - clientOffset.x)),
            Math.round(imgscale * (mousePos.y - clientOffset.y)))
          lassoCtx.closePath()
          lassoCtx.fill()
          ClearCanvas(selectionCtx)
            // curimgCtx.clearRect(0, 0, curimgCanvas.width, curimgCanvas.height)
            // curimgCtx.filter = `blur(${(document.getElementById('feather').value * curzoomfactor).toString()}px)`
            // curimgCtx.globalCompositeOperation = 'destination-out'
            // curimgCtx.drawImage(lassoCanvas, 0, 0)
            // redraw()
          mask = {
            canvas: lassoCanvas,
            context: lassoCtx,
            bounds: {
              minX: minX_lasso,
              maxX: maxX_lasso,
              minY: minY_lasso,
              maxY: maxY_lasso
            }
          }
          getOperatedMask()
          makeBorderMask()
        } else {
          if (e.shiftKey) {
            var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
            if (angle < Math.PI / 8)
              mousePos.y = prevPt.y
            else if (angle < 3 * Math.PI / 8) {
              if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
                mousePos.x = prevPt.x + mousePos.y - prevPt.y
              else
                mousePos.y = prevPt.y - mousePos.x + prevPt.x
            } else
              mousePos.x = prevPt.x
          }

          storedPolygonLines.push({
            x1: prevPt.x,
            y1: prevPt.y,
            x2: mousePos.x,
            y2: mousePos.y
          })
          prevPt = {
            x: mousePos.x,
            y: mousePos.y
          }
          lassoCtx.lineTo(
            Math.round(imgscale * (mousePos.x - clientOffset.x)),
            Math.round(imgscale * (mousePos.y - clientOffset.y)))
          minX_lasso = Math.min(minX_lasso, Math.round(imgscale * (mousePos.x - clientOffset.x)))
          maxX_lasso = Math.max(maxX_lasso, Math.round(imgscale * (mousePos.x - clientOffset.x)))
          minY_lasso = Math.min(minY_lasso, Math.round(imgscale * (mousePos.y - clientOffset.y)))
          maxY_lasso = Math.max(maxY_lasso, Math.round(imgscale * (mousePos.y - clientOffset.y)))
        }
      }
    } else if (ToolMode == 'MagicWand') {
      if (mousePos.x < 0 || mousePos.y < 0) return
      getMagicWandMask(
        Math.round(imgscale * (mousePos.x - clientOffset.x)),
        Math.round(imgscale * (mousePos.y - clientOffset.y)))
    } else if (ToolMode == 'Eraser') {
      isLMousePressed = true
      prevPt = {
        x: mousePos.x,
        y: mousePos.y
      }

      lassoCanvas = document.createElement("canvas")
      lassoCtx = lassoCanvas.getContext("2d")
      lassoCtx.canvas.width = Math.round(curimgCanvas.width * curzoomfactor / imgscale)
      lassoCtx.canvas.height = Math.round(curimgCanvas.height * curzoomfactor / imgscale)
      lassoCtx.filter = `blur(${(document.getElementById('feather').value * curzoomfactor).toString()}px)`
      lassoCtx.lineWidth = document.getElementById('size').value * 2 * curzoomfactor
      lassoCtx.beginPath()
      lassoCtx.arc(lastX - canvasOffset.x, lastY - canvasOffset.y, document.getElementById('size').value * curzoomfactor, 0, 2 * Math.PI)
      lassoCtx.fill()
      lassoCtx.beginPath()


      canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)
      toolDrawCtx.save()
      toolDrawCtx.filter = `blur(${(document.getElementById('feather').value * curzoomfactor).toString()}px)`
      toolDrawCtx.globalCompositeOperation = 'destination-out'
      toolDrawCtx.beginPath()
      toolDrawCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI)
      toolDrawCtx.fill()
      toolDrawCtx.stroke()
      toolDrawCtx.restore()

      ClearCanvas(selectionCtx)
      selectionCtx.beginPath()
      selectionCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI)
      selectionCtx.stroke()
    } else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') {
      prevPt = mousePos
      isLMousePressed = true
      lassoCanvas = document.createElement("canvas")
      lassoCtx = lassoCanvas.getContext("2d")
      lassoCanvas.width = curimgCanvas.width
      lassoCanvas.height = curimgCanvas.height
      lassoCtx.filter = `blur(${(document.getElementById('feather').value * imgscale / curzoomfactor).toString()}px)`
      lassoCtx.fillStyle = '#FFFFFFFF'
    }
  }, false)

  cnt = 0
  selectionCanvas.addEventListener('mousemove', function(e) {
    cnt += 1

    if (e.button != 0 && (!isDrawingMode)) return

    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    if (ToolMode == 'Move') {
      var _curimgwidth = curimgCanvas.width * curzoomfactor / imgscale
      if (_curimgwidth < window.innerWidth) return

      dragged = true
      if (dragStart) {
        var pt = toolDrawCtx.getTransformedPoint(lastX, lastY)
        toolDrawCtx.translate(pt.x - dragStart.x, pt.y - dragStart.y)
        selectionCtx.translate(pt.x - dragStart.x, pt.y - dragStart.y)
        borderCtx.translate(pt.x - dragStart.x, pt.y - dragStart.y)
        redraw()
      }
    }
    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)

    if (ToolMode == 'Eraser') {
      ClearCanvas(selectionCtx)

      selectionCtx.saveTransform()
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
      selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
      selectionCtx.shadowColor = '#111111'
      selectionCtx.shadowBlur = 4
      selectionCtx.beginPath()
      selectionCtx.arc(lastX, lastY, curzoomfactor * document.getElementById('size').value, 0, 2 * Math.PI)
      selectionCtx.stroke()
      selectionCtx.restoreTransform()
    }

    if (ToolMode == 'Lasso' && isDrawingMode) {
      redrawStoredPolygonLines()
      if (distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
        selectionCtx.saveTransform()
        selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
        selectionCtx.save()
        selectionCtx.beginPath()
        selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
        selectionCtx.shadowColor = '#111111'
        selectionCtx.shadowBlur = 4
        selectionCtx.arc(lastX, lastY, 5 * curzoomfactor, 0, 2 * Math.PI)
        selectionCtx.stroke()
        selectionCtx.restore()
        selectionCtx.restoreTransform();
      }

      selectionCtx.saveTransform()
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
      selectionCtx.save()
      selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
      selectionCtx.shadowColor = '#111111'
      selectionCtx.shadowBlur = 4
      selectionCtx.beginPath()
      selectionCtx.moveTo(toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x, toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y)
      if (e.shiftKey) {
        var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
        if (angle < Math.PI / 8)
          selectionCtx.lineTo(lastX, toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y)
        else if (angle < 3 * Math.PI / 8) {
          if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
            selectionCtx.lineTo(toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x + lastY - toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y, lastY)
          else
            selectionCtx.lineTo(lastX, toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y - lastX + toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x)
        } else
          selectionCtx.lineTo(toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x, lastY)
      } else
        selectionCtx.lineTo(lastX, lastY)
      selectionCtx.stroke()
      selectionCtx.restore()
      selectionCtx.restoreTransform()
    } else if (ToolMode == 'Eraser' && isLMousePressed) {
      var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
      if (e.shiftKey) {
        if (angle < Math.PI / 4)
          mousePos.y = prevPt.y
        else
          mousePos.x = prevPt.x
      }
      sizeVal = document.getElementById('size').value
      toolDrawCtx.save()
      toolDrawCtx.globalCompositeOperation = 'destination-out'
      toolDrawCtx.filter = `blur(${(document.getElementById('feather').value * curzoomfactor).toString()}px)`
      toolDrawCtx.beginPath()
      toolDrawCtx.arc(mousePos.x, mousePos.y, document.getElementById('size').value, 0, 2 * Math.PI)
      toolDrawCtx.fill()
      toolDrawCtx.lineWidth = document.getElementById('size').value * 2
      toolDrawCtx.beginPath()
      toolDrawCtx.moveTo(prevPt.x, prevPt.y)
      toolDrawCtx.lineTo(mousePos.x, mousePos.y)
      toolDrawCtx.stroke()
      toolDrawCtx.restore()

      _prev = toolDrawCtx.getActualPoint(prevPt.x, prevPt.y)
      _prev.x = Math.round(_prev.x)
      _prev.y = Math.round(_prev.y)
      lassoCtx.beginPath()
      lassoCtx.arc(lastX - canvasOffset.x, lastY - canvasOffset.y, document.getElementById('size').value * curzoomfactor, 0, 2 * Math.PI)
      lassoCtx.fill()
      lassoCtx.beginPath()
      lassoCtx.moveTo(_prev.x - canvasOffset.x, _prev.y - canvasOffset.y)
      lassoCtx.lineTo(lastX - canvasOffset.x, lastY - canvasOffset.y)
      lassoCtx.stroke()

      if (e.shiftKey) {} else {
        prevPt = mousePos
      }
    } else if (ToolMode == 'Rectangle' && isLMousePressed) {
      ClearCanvas(selectionCtx)

      selectionCtx.saveTransform()
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
        // selectionCtx.setLineDash([10, 10])
      selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
      selectionCtx.shadowColor = '#111111'
      selectionCtx.shadowBlur = 4
      selectionCtx.beginPath()
      var _preActual = toolDrawCtx.getActualPoint(prevPt.x, prevPt.y)
      var _startX = Math.min(_preActual.x, lastX)
      var _startY = Math.min(_preActual.y, lastY)
      var _width = Math.abs(_preActual.x - lastX)
      var _height = Math.abs(_preActual.y - lastY)
      if (e.shiftKey) {
        _width = Math.min(_width, _height)
        _height = _width
      }
      selectionCtx.rect(_startX, _startY, _width, _height);
      selectionCtx.stroke()
      selectionCtx.restoreTransform()
    } else if (ToolMode == 'Ellipse' && isLMousePressed) {
      ClearCanvas(selectionCtx)

      selectionCtx.saveTransform()
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
        // selectionCtx.setLineDash([10, 10])
      selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
      selectionCtx.shadowColor = '#111111'
      selectionCtx.shadowBlur = 4
      selectionCtx.beginPath()
      var _preActual = toolDrawCtx.getActualPoint(prevPt.x, prevPt.y)
      var _width = Math.abs(_preActual.x - lastX)
      var _height = Math.abs(_preActual.y - lastY)
      if (e.shiftKey) {
        _width = Math.min(_width, _height)
        _height = _width
      }
      var _centerX = Math.min(_preActual.x, lastX) + _width / 2
      var _centerY = Math.min(_preActual.y, lastY) + _height / 2

      selectionCtx.ellipse(_centerX, _centerY, _width / 2, _height / 2, 0, 0, 2 * Math.PI);
      selectionCtx.stroke()
      selectionCtx.restoreTransform()
    }
  }, false)

  selectionCanvas.addEventListener('mouseup', function(e) {
    dragStart = null

    if (e.button != 0) return
    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)

    isLMousePressed = false
    if (ToolMode == 'Eraser') {
      curimgCtx.save()
      curimgCtx.scale(imgscale / curzoomfactor, imgscale / curzoomfactor)
      curimgCtx.globalCompositeOperation = 'destination-out'
      curimgCtx.beginPath()
      curimgCtx.drawImage(lassoCanvas, 0, 0)
      curimgCtx.restore()
      redraw()
    } else if (ToolMode == 'Rectangle') {
      var _startX = Math.min(prevPt.x, mousePos.x)
      var _startY = Math.min(prevPt.y, mousePos.y)
      var _width = Math.abs(prevPt.x - mousePos.x)
      var _height = Math.abs(prevPt.y - mousePos.y)
      if (e.shiftKey) {
        _width = Math.min(_width, _height)
        _height = _width
      }

      lassoCtx.beginPath()
      lassoCtx.rect(
        Math.round(imgscale * (_startX - clientOffset.x)),
        Math.round(imgscale * (_startY - clientOffset.y)),
        Math.round(imgscale * _width),
        Math.round(imgscale * _height)
      )
      lassoCtx.fill()

      // curimgCtx.drawImage(lassoCanvas, 0, 0)
      // redraw()

      mask = {
        canvas: lassoCanvas,
        context: lassoCtx,
        bounds: {
          minX: Math.round(imgscale * (_startX - clientOffset.x)),
          maxX: Math.round(imgscale * (_startX - clientOffset.x + _width)),
          minY: Math.round(imgscale * (_startY - clientOffset.y)),
          maxY: Math.round(imgscale * (_startY - clientOffset.y + _height + 10))
        }
      }
      getOperatedMask()
      makeBorderMask()
      ClearCanvas(selectionCtx)
    } else if (ToolMode == 'Ellipse') {
      var _width = Math.abs(prevPt.x - mousePos.x)
      var _height = Math.abs(prevPt.y - mousePos.y)
      if (e.shiftKey) {
        _width = Math.min(_width, _height)
        _height = _width
      }
      var _centerX = Math.min(prevPt.x, mousePos.x) + _width / 2
      var _centerY = Math.min(prevPt.y, mousePos.y) + _height / 2
      lassoCtx.beginPath()
      lassoCtx.ellipse(
        Math.round(imgscale * (_centerX - clientOffset.x)),
        Math.round(imgscale * (_centerY - clientOffset.y)),
        Math.round(imgscale * _width / 2), Math.round(imgscale * _height / 2),
        0, 0, 2 * Math.PI
      )
      lassoCtx.fill()
      mask = {
        canvas: lassoCanvas,
        context: lassoCtx,
        bounds: {
          minX: Math.round(imgscale * (_centerX - clientOffset.x - _width / 2)),
          maxX: Math.round(imgscale * (_centerX - clientOffset.x + _width / 2)),
          minY: Math.round(imgscale * (_centerY - clientOffset.y - _height / 2)),
          maxY: Math.round(imgscale * (_centerY - clientOffset.y + _height / 2))
        }
      }
      getOperatedMask()
      makeBorderMask()
      ClearCanvas(selectionCtx)
    }
    if (SelectionMode == 'New') {
      // prevmask = null
      // selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height)
    } else {
      // prevmask = mask
    }
  }, false)

  document.getElementById('workspaceContainerDiv').addEventListener('dblclick', function(e) {
    if (ToolMode != 'Lasso') return

    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)

    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)


    if (!isDrawingMode || storedPolygonLines.length == 0) return
    curPt = mousePos
    if (e.shiftKey) {
      var angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
      if (angle < Math.PI / 8)
        mousePos.y = prevPt.y
      else if (angle < 3 * Math.PI / 8) {
        if ((mousePos.x - prevPt.x) * (mousePos.y - prevPt.y) > 0)
          mousePos.x = prevPt.x + mousePos.y - prevPt.y
        else
          mousePos.y = prevPt.y - mousePos.x + prevPt.x
      } else
        mousePos.x = prevPt.x
    }

    if (distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
      storedPolygonLines.push({
        x1: prevPt.x,
        y1: prevPt.y,
        x2: firstPt.x,
        y2: firstPt.y
      })
    } else {
      storedPolygonLines.push({
        x1: prevPt.x,
        y1: prevPt.y,
        x2: mousePos.x,
        y2: mousePos.y
      })
      storedPolygonLines.push({
        x1: mousePos.x,
        y1: mousePos.y,
        x2: firstPt.x,
        y2: firstPt.y
      })
      lassoCtx.lineTo(
        Math.round(imgscale * (mousePos.x - clientOffset.x)),
        Math.round(imgscale * (mousePos.y - clientOffset.y)))
      minX_lasso = Math.min(minX_lasso, Math.round(imgscale * (mousePos.x - clientOffset.x)))
      maxX_lasso = Math.max(maxX_lasso, Math.round(imgscale * (mousePos.x - clientOffset.x)))
      minY_lasso = Math.min(minY_lasso, Math.round(imgscale * (mousePos.y - clientOffset.y)))
      maxY_lasso = Math.max(maxY_lasso, Math.round(imgscale * (mousePos.y - clientOffset.y)))
    }
    lassoCtx.lineTo(
      Math.round(imgscale * (firstPt.x - clientOffset.x)),
      Math.round(imgscale * (firstPt.y - clientOffset.y)))
    isDrawingMode = false
    lassoCtx.closePath()
    lassoCtx.fill()
    ClearCanvas(selectionCtx)
      // document.getElementById('display-image').src = lassoCanvas.toDataURL()
      // ClearCanvas(toolDrawCtx)
    mask = {
      canvas: lassoCanvas,
      context: lassoCtx,
      bounds: {
        minX: minX_lasso,
        maxX: maxX_lasso,
        minY: minY_lasso,
        maxY: maxY_lasso
      }
    }
    getOperatedMask()
    makeBorderMask()
  })

  var zoom = function(factor) {
    var _curimgwidth = curimgCanvas.width * curzoomfactor / imgscale
    var _curimgheight = curimgCanvas.height * curzoomfactor / imgscale
      // if (_curimgwidth < window.innerWidth && _curimgheight < window.innerHeight - document.getElementById('tool-area').offsetHeight) {
    if (_curimgwidth < curimgCanvas.width / imgscale) {
      responsive = true
      lastX = window.innerWidth / 2
      lastY = (window.innerHeight - document.getElementById('tool-area').offsetHeight) / 2

      var _pt = toolDrawCtx.getTransformedPoint(lastX - _curimgwidth / 2, lastY - _curimgheight / 2)
      toolDrawCtx.translate(_pt.x - clientOffset.x, _pt.y - clientOffset.y)
      selectionCtx.translate(_pt.x - clientOffset.x, _pt.y - clientOffset.y)
      borderCtx.translate(_pt.x - clientOffset.x, _pt.y - clientOffset.y)
    } else {
      responsive = false
    }

    var pt = toolDrawCtx.getTransformedPoint(lastX, lastY)
    toolDrawCtx.translate(pt.x, pt.y)
    selectionCtx.translate(pt.x, pt.y)
    borderCtx.translate(pt.x, pt.y)
    toolDrawCtx.scale(factor, factor)
    selectionCtx.scale(factor, factor)
    borderCtx.scale(factor, factor)
    toolDrawCtx.translate(-pt.x, -pt.y)
    selectionCtx.translate(-pt.x, -pt.y)
    borderCtx.translate(-pt.x, -pt.y)
    curzoomfactor = curzoomfactor * factor
    redraw()
  }

  var handleScroll = function(e) {
    e.preventDefault()
    SCROLL_SENSITIVITY = 0.005
    var delta = -e.deltaY * SCROLL_SENSITIVITY

    if (delta) {
      var factor = Math.pow(scalefactor, delta)
      zoom(factor)
      prezoomfactor = curzoomfactor
      prezoomcenterX = lastX
      prezoomcenterY = lastY
      toolDrawCtx.saveTransform()

      // redraw the polygon if doing the lasso selection
      if (isDrawingMode) {
        redrawStoredPolygonLines()
        lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
        lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
        selectionCtx.saveTransform()
        selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
        selectionCtx.save()
        selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
        selectionCtx.shadowColor = '#111111'
        selectionCtx.shadowBlur = 4
        selectionCtx.beginPath()
        selectionCtx.moveTo(toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x, toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y)
        selectionCtx.lineTo(lastX, lastY)
        selectionCtx.stroke()
        selectionCtx.restore()
        selectionCtx.restoreTransform()
      }
    }
    return e.preventDefault() && false
  }

  selectionCanvas.addEventListener('DOMMouseScroll', handleScroll, false)
  selectionCanvas.addEventListener('mousewheel', handleScroll, false)

  window.addEventListener('resize', function(event) {


    imgcenterX = editorRegion.offsetLeft + editorRegion.offsetWidth / 2
    imgcenterY = editorRegion.offsetTop + editorRegion.offsetHeight / 2


    var curCanvasLeft = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y).x
    var curCanvasTop = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y).y + document.getElementById('tool-area').offsetHeight

    if (window.innerWidth != preWinWidth || window.innerHeight != preWinHeight) {
      preWinWidth = window.innerWidth
      preWinHeight = window.innerHeight
      redraw()
      var _curimgwidth = curimgCanvas.width * curzoomfactor / imgscale
      if (_curimgwidth < window.innerWidth) {
        responsive = true
      } else {
        responsive = false
      }
      if (!responsive) return

      var newCanvasWidth = window.innerWidth - curCanvasLeft - 20
      var newZoomFactor_w = newCanvasWidth / (curimgCanvas.width / imgscale)
      var newCanvasHeight = window.innerHeight - curCanvasTop - 20
      var newZoomFactor_h = newCanvasHeight / (curimgCanvas.height / imgscale)

      var newZoomFactor = Math.min(newZoomFactor_w, newZoomFactor_h)
      var factor = newZoomFactor / curzoomfactor

      if (newZoomFactor < prezoomfactor + 0.01) {
        lastX = 0
        lastY = 0
        zoom(factor)
      } else {
        lastX = 0
        lastY = 0
        zoom(prezoomfactor / curzoomfactor)
      }
    }

  })

  setInterval(function() {
    hatchTick()
  }, 50)
}

document.addEventListener("keydown", function(event) {
  if (event.key === 'Control') {
    return
  }

  if (event.key == 'Delete') {
    if (ToolMode == 'Eraser') return
    if (!prevmask) return

    curimgCtx.save()
    curimgCtx.globalCompositeOperation = 'destination-out'
    curimgCtx.beginPath()
    curimgCtx.drawImage(prevmask.canvas, 0, 0)
    curimgCtx.restore()
    redraw()

    storedPolygonLines = []
    isDrawingMode = false
    mask = null
    prevmask = null
    coremask = null
    feathereddata = null
    ClearCanvas(borderCtx)
  } else if (event.ctrlKey) {
    if (event.code != 'KeyD') return
    event.preventDefault()
    if (isLMousePressed) return
    storedPolygonLines = []
    isDrawingMode = false
    mask = null
    prevmask = null
    coremask = null
    feathereddata = null
    ClearCanvas(selectionCtx)
    ClearCanvas(borderCtx)
  }
  if (event.shiftKey && event.altKey) {
    SelectionMode = 'Intersect'
    document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode
    document.getElementById('selection-mode').selectedIndex = 3
  } else if (event.shiftKey) {
    SelectionMode = 'Add'
    document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode
    document.getElementById('selection-mode').selectedIndex = 1
  } else if (event.altKey) {
    SelectionMode = 'Subtract'
    document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode
    document.getElementById('selection-mode').selectedIndex = 2
  }
})

document.addEventListener("keyup", function(event) {
  if (event.key == 'Shift') {
    SelectionMode = 'New'
    document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode
  } else if (event.key == 'Alt') {
    SelectionMode = 'New'
    document.getElementsByClassName('filter-option-inner-inner')[1].innerHTML = SelectionMode
  }
  if (SelectionMode == 'New')
    document.getElementById('selection-mode').selectedIndex = 0
  else if (SelectionMode == 'Add')
    document.getElementById('selection-mode').selectedIndex = 1
  else if (SelectionMode == 'Subtract')
    document.getElementById('selection-mode').selectedIndex = 2
  else if (SelectionMode == 'Intersect')
    document.getElementById('selection-mode').selectedIndex = 3
})

function resizeMask(original, scaleX, scaleY) {
  var resizedCanvas = $("<canvas>")
    .attr("width", Math.round(original.canvas.width * scaleX))
    .attr("height", Math.round(original.canvas.height * scaleY))[0]
  resizedCtx = resizedCanvas.getContext("2d")
  resizedCtx.scale(scaleX, scaleY)
  resizedCtx.drawImage(original.canvas, 0, 0)

  bounds = original.bounds
  return {
    canvas: resizedCanvas,
    context: resizedCtx,
    bounds: {
      minX: bounds.minX * scaleX,
      maxX: bounds.maxX * scaleX,
      minY: bounds.minY * scaleY,
      maxY: bounds.maxY * scaleY
    }
  }
}

function getLassoMask(imgData, minX_lasso, maxX_lasso, minY_lasso, maxY_lasso) {
  var data = imgData.data,
    w = imgData.width,
    h = imgData.height,
    bytes = imgData.bytes,
    result = new Uint8Array(w * h)

  minX_lasso = Math.max(0, minX_lasso)
  minY_lasso = Math.max(0, minY_lasso)
  maxX_lasso = Math.min(imgData.width - 1, maxX_lasso)
  maxY_lasso = Math.min(imgData.height - 1, maxY_lasso)
  for (i = minY_lasso; i < maxY_lasso; i++) {
    for (j = minX_lasso; j < maxX_lasso; j++) {
      index = i * w + j
      if (data[4 * index + 3] == 255) {
        result[index] = 1
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
  }
}

function getMagicWandMask(x, y) {
  imageInfo = {
    width: curimgCanvas.width,
    height: curimgCanvas.height,
    context: toolDrawCtx
  }
  mask = null
  var tempCtx = document.createElement("canvas").getContext("2d")
  tempCtx.canvas.width = imageInfo.width
  tempCtx.canvas.height = imageInfo.height
  tempCtx.drawImage(curimgCanvas, 0, 0, imageInfo.width, imageInfo.height)
  imageInfo.data = tempCtx.getImageData(0, 0, imageInfo.width, imageInfo.height)

  if (!imageInfo) return
  var image = {
    data: imageInfo.data.data,
    width: imageInfo.width,
    height: imageInfo.height,
    bytes: 4
  }
  mask = MagicWand.floodFill(image, Math.round(x), Math.round(y), document.getElementById("tolerance").value, null, true)
    // document.getElementById('display-image').src = mask.canvas.toDataURL()
    // ClearCanvas(toolDrawCtx)
  getOperatedMask()
  makeBorderMask()
}

function addMask(_newmask, _prevmask) {
  var resCanvas = $("<canvas>")
    .attr("width", curimgCanvas.width)
    .attr("height", curimgCanvas.height)[0],
    resCtx = resCanvas.getContext('2d')

  var _prebound = _prevmask.bounds
  var _newbound = _newmask.bounds
  resCtx.drawImage(_prevmask.canvas, 0, 0)
  resCtx.drawImage(_newmask.canvas, 0, 0)
  return {
    canvas: resCanvas,
    context: resCtx,
    bounds: {
      minX: Math.min(_prebound.minX, _newbound.minX),
      maxX: Math.max(_prebound.maxX, _newbound.maxX),
      minY: Math.min(_prebound.minY, _newbound.minY),
      maxY: Math.max(_prebound.maxY, _newbound.maxY)
    }
  }
}

function intersectMask(_newmask, _prevmask) {
  var resCanvas1 = $("<canvas>")
    .attr("width", curimgCanvas.width)
    .attr("height", curimgCanvas.height)[0],
    resCtx1 = resCanvas1.getContext('2d')
  resCtx1.drawImage(_prevmask.canvas, 0, 0)
  resCtx1.globalCompositeOperation = 'destination-out'
  resCtx1.beginPath()
  resCtx1.drawImage(_newmask.canvas, 0, 0)

  var resCanvas2 = $("<canvas>")
    .attr("width", curimgCanvas.width)
    .attr("height", curimgCanvas.height)[0],
    resCtx2 = resCanvas2.getContext('2d')
  resCtx2.drawImage(_prevmask.canvas, 0, 0)
  resCtx2.globalCompositeOperation = 'destination-out'
  resCtx2.beginPath()
  resCtx2.drawImage(resCanvas1, 0, 0)

  var _prebound = _prevmask.bounds
  var _newbound = _newmask.bounds
  return {
    canvas: resCanvas2,
    context: resCtx2,
    bounds: {
      minX: Math.max(_prebound.minX, _newbound.minX),
      maxX: Math.min(_prebound.maxX, _newbound.maxX),
      minY: Math.max(_prebound.minY, _newbound.minY),
      maxY: Math.min(_prebound.maxY, _newbound.maxY)
    }
  }
}

function subtractMask(_newmask, _prevmask) {
  var resCanvas = $("<canvas>")
    .attr("width", curimgCanvas.width)
    .attr("height", curimgCanvas.height)[0],
    resCtx = resCanvas.getContext('2d')

  var _prebound = _prevmask.bounds
  resCtx.drawImage(_prevmask.canvas, 0, 0)
  resCtx.globalCompositeOperation = 'destination-out'
  resCtx.beginPath()
  resCtx.drawImage(_newmask.canvas, 0, 0)
  return {
    canvas: resCanvas,
    context: resCtx,
    bounds: _prebound
  }
}

function getOperatedMask() {
  if (SelectionMode == 'New' || !prevmask) prevmask = mask
  else {
    if (SelectionMode == 'Add') {
      prevmask = mask ? addMask(mask, prevmask) : prevmask
    }
    if (SelectionMode == 'Subtract') {
      prevmask = mask ? subtractMask(mask, prevmask) : prevmask
    }
    if (SelectionMode == 'Intersect') {
      prevmask = mask ? intersectMask(mask, prevmask) : prevmask
    }
  }
  mask = null
}

function makeBorderMask() {
  // if (prevmask) {
  // 	xl = Math.max(0, prevmask.bounds.minX - 2 * document.getElementById('feather').value)
  // 	xr = Math.min(curimgCanvas.width, prevmask.bounds.maxX + 2 * document.getElementById('feather').value)
  // 	yt = Math.max(0, prevmask.bounds.minY - 2 * document.getElementById('feather').value)
  // 	yb = Math.min(curimgCanvas.height, prevmask.bounds.maxY + 2 * document.getElementById('feather').value)

  // 	var _tmpCanvas = $("<canvas>")
  //     	.attr("width", Math.round(curimgCanvas.width * curzoomfactor / imgscale))
  // 		.attr("height", Math.round(curimgCanvas.height * curzoomfactor / imgscale))[0]
  // 	_tmpCtx = _tmpCanvas.getContext("2d")	
  // 	_tmpCtx.scale(curzoomfactor / imgscale, curzoomfactor / imgscale)
  // 	_tmpCtx.drawImage(prevmask.canvas, 0, 0)
  // 	coremask = {
  // 		canvas: _tmpCanvas,
  // 		context: _tmpCtx,
  // 		bounds: {
  // 			minX: Math.round(xl * curzoomfactor / imgscale), 
  // 			minY: Math.round(yt * curzoomfactor / imgscale), 
  // 			maxX: Math.round(xr * curzoomfactor / imgscale), 
  // 			maxY: Math.round(yb * curzoomfactor / imgscale)
  // 		}
  // 	}		
  // }		
}

function drawBorder() {
  if (ToolMode == 'Eraser' || !prevmask) return

  ClearCanvas(borderCtx)
  xl = Math.max(0, prevmask.bounds.minX - 2 * document.getElementById('feather').value)
  xr = Math.min(curimgCanvas.width, prevmask.bounds.maxX + 2 * document.getElementById('feather').value)
  yt = Math.max(0, prevmask.bounds.minY - 2 * document.getElementById('feather').value)
  yb = Math.min(curimgCanvas.height, prevmask.bounds.maxY + 2 * document.getElementById('feather').value)
  var _tmpCanvas = $("<canvas>")
    .attr("width", Math.round(curimgCanvas.width * curzoomfactor / imgscale))
    .attr("height", Math.round(curimgCanvas.height * curzoomfactor / imgscale))[0]
  _tmpCtx = _tmpCanvas.getContext("2d")
  _tmpCtx.scale(curzoomfactor / imgscale, curzoomfactor / imgscale)
  _tmpCtx.drawImage(prevmask.canvas, 0, 0)
  coremask = {
    canvas: _tmpCanvas,
    context: _tmpCtx,
    bounds: {
      minX: Math.round(xl * curzoomfactor / imgscale),
      minY: Math.round(yt * curzoomfactor / imgscale),
      maxX: Math.round(xr * curzoomfactor / imgscale),
      maxY: Math.round(yb * curzoomfactor / imgscale)
    }
  }

  var x, y, i, j, k,
    w = Math.round(coremask.bounds.maxX - coremask.bounds.minX),
    h = Math.round(coremask.bounds.maxY - coremask.bounds.minY),
    imgData = borderCtx.createImageData(w, h)
  res = imgData.data

  var borderindices = MagicWand.getBorderIndices(coremask)
  var len = borderindices.length
  for (j = 0; j < len; j++) {
    i = borderindices[j]
    x = i.x
    y = i.y
    k = (y * (coremask.bounds.maxX - coremask.bounds.minX) + x) * 4
    if ((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) { // detect hatch color 
      res[k + 3] = 255 // black, change only alpha
    } else {
      res[k] = 255 // white
      res[k + 1] = 255
      res[k + 2] = 255
      res[k + 3] = 255
    }
  }

  borderCtx.putImageData(imgData,
    canvasOffset.x + coremask.bounds.minX,
    canvasOffset.y + coremask.bounds.minY)
}


// function makeBorderMask() {
// 	if (prevmask) {
// 		xl = Math.max(0, prevmask.bounds.minX - 2 * document.getElementById('feather').value)
// 		xr = Math.min(curimgCanvas.width, prevmask.bounds.maxX + 2 * document.getElementById('feather').value)
// 		yt = Math.max(0, prevmask.bounds.minY - 2 * document.getElementById('feather').value)
// 		yb = Math.min(curimgCanvas.height, prevmask.bounds.maxY + 2 * document.getElementById('feather').value)
// 		w = xr - xl
// 		h = yb - yt
// 		var _tmpCanvas = $("<canvas>")
//         	.attr("width", Math.round(w))
// 			.attr("height", Math.round(h))[0]
// 		_tmpCtx = _tmpCanvas.getContext("2d")	
// 		_tmpCtx.putImageData(
// 			prevmask.context.getImageData(xl, yt, w, h), 0, 0
// 		)
// 		coremask = {
// 			canvas: _tmpCanvas,
// 			context: _tmpCtx,
// 			bounds: {
// 				minX: xl, 
// 				minY: yt, 
// 				maxX: xr, 
// 				maxY: yb}
// 		}	
// 	}		
// }
// function drawBorder() {
// 	if(ToolMode == 'Eraser') return
// 	if(!coremask) return
// 	ClearCanvas(borderCtx)
// 	var _mask = resizeMask(coremask, curzoomfactor / imgscale, curzoomfactor / imgscale)

// 	var x, y, i, j, k,
// 		w = Math.round(_mask.canvas.width),
// 		h = Math.round(_mask.canvas.height),
// 		imgData = borderCtx.createImageData(w, h)
// 	res = imgData.data	

// 	var borderindices = MagicWand.getBorderIndices(_mask)
// 	var len = borderindices.length
// 	for(j = 0; j < len; j++) {
// 		i = borderindices[j]
// 		x = i.x
// 		y = i.y
// 		k = (y * _mask.canvas.width + x) * 4	
// 		if((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) { // detect hatch color 
// 			res[k + 3] = 255 // black, change only alpha
// 		} else {
// 			res[k] = 255 // white
// 			res[k + 1] = 255
// 			res[k + 2] = 255
// 			res[k + 3] = 255
// 		}
// 	}

// 	borderCtx.putImageData(imgData, 
// 		canvasOffset.x + coremask.bounds.minX * curzoomfactor / imgscale, 
// 		canvasOffset.y + coremask.bounds.minY * curzoomfactor / imgscale)
// }

function hatchTick() {
  hatchOffset = (hatchOffset + 1) % (hatchLength * 2)
  drawBorder()
}

function distance(pt1, pt2) {
  var result = Math.sqrt(Math.pow((pt2[0] - pt1[0]), 2) + Math.pow((pt2[1] - pt1[1]), 2))
  return result
}

function redrawStoredPolygonLines() {
  ClearCanvas(selectionCtx)
  if (storedPolygonLines.length == 0) return

  selectionCtx.saveTransform()
  selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
  selectionCtx.save()
  selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
  selectionCtx.shadowColor = '#111111'
  selectionCtx.shadowBlur = 4
  for (var i = 0; i < storedPolygonLines.length; i++) {
    selectionCtx.beginPath()
    selectionCtx.moveTo(
      toolDrawCtx.getActualPoint(storedPolygonLines[i].x1, storedPolygonLines[i].y1).x,
      toolDrawCtx.getActualPoint(storedPolygonLines[i].x1, storedPolygonLines[i].y1).y)
    selectionCtx.lineTo(
      toolDrawCtx.getActualPoint(storedPolygonLines[i].x2, storedPolygonLines[i].y2).x,
      toolDrawCtx.getActualPoint(storedPolygonLines[i].x2, storedPolygonLines[i].y2).y
    )
    selectionCtx.stroke()
  }
  selectionCtx.restore()
  selectionCtx.restoreTransform()
}

function getImageData(_context, x, y, width, height, scale) {
  var actualPt = _context.getActualPoint(x, y)
  var imgData = _context.getImageData(
    Math.round(actualPt.x),
    Math.round(actualPt.y),
    Math.round(scale * width),
    Math.round(scale * height))
  var tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = curimgCanvas.width
  tmpCanvas.height = curimgCanvas.height
  var tmpCtx = tmpCanvas.getContext('2d')

  var newCanvas = $("<canvas>")
    .attr("width", imgData.width)
    .attr("height", imgData.height)[0]
  newCanvas.getContext("2d").putImageData(imgData, 0, 0)

  tmpCtx.scale(1 / scale, 1 / scale)
  tmpCtx.drawImage(newCanvas, 0, 0)

  return tmpCanvas.toDataURL("image/png")
}

function updateBackground() {
  var actualPt = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)

  var _origin = { x: 0, y: 0 }
  _origin.x = imgcenterX - curimgCanvas.width / imgscale / 2 * curzoomfactor
  _origin.y = imgcenterY - curimgCanvas.height / imgscale / 2 * curzoomfactor
  var _transform = { x: 0, y: 0 }
  _transform.x = (actualPt.x - _origin.x) / curzoomfactor
  _transform.y = (actualPt.y - _origin.y) / curzoomfactor
  $('#editor-region').css('transform',
    `scale(${(curzoomfactor).toString()}) 
        translate(${(_transform.x).toString()}px, ${(_transform.y).toString()}px)`)
}

function ClearCanvas(_context) {
  var p1 = _context.getTransformedPoint(0, 0)
  var p2 = _context.getTransformedPoint(_context.canvas.width, _context.canvas.height)
  _context.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)
}

function redraw() {
  ClearCanvas(toolDrawCtx)
  canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)
  toolDrawCtx.drawImage(curimgCanvas, clientOffset.x, clientOffset.y, Math.round(curimgCanvas.width / imgscale), Math.round(curimgCanvas.height / imgscale))
  updateBackground()
}

function oninit() {
  storedPolygonLines = []
  isDrawingMode = false
  mask = null
  prevmask = null
  coremask = null
  feathereddata = null
  toolDrawCtx.setTransform(1, 0, 0, 1, 0, 0)
  selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
  borderCtx.setTransform(1, 0, 0, 1, 0, 0)
  curzoomfactor = 1
  prezoomfactor = 1
  ClearCanvas(toolDrawCtx)
  ClearCanvas(selectionCtx)
  ClearCanvas(borderCtx)
  redraw()
}

function OnChangeTool() {
  ToolMode = document.getElementById('tool-select').value
  if (ToolMode == 'Move') {
    document.getElementById('tolerance').disabled = true
    document.getElementById('size').disabled = true
    document.getElementById('feather').disabled = true
  } else if (ToolMode == 'Eraser') {
    document.getElementById('tolerance').disabled = true
    document.getElementById('size').disabled = false
    document.getElementById('feather').disabled = false
  } else if (ToolMode == 'Lasso') {
    document.getElementById('tolerance').disabled = true
    document.getElementById('size').disabled = true
    document.getElementById('feather').disabled = false
  } else if (ToolMode == 'MagicWand') {
    document.getElementById('tolerance').disabled = false
    document.getElementById('size').disabled = true
    document.getElementById('feather').disabled = false
  } else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') {
    document.getElementById('tolerance').disabled = true
    document.getElementById('size').disabled = true
    document.getElementById('feather').disabled = false
  }
  redraw()
  if (ToolMode == 'Move') selectionCanvas.style.cursor = 'move'
  else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') selectionCanvas.style.cursor = 'crosshair'
  else selectionCanvas.style.cursor = 'default'
  ClearCanvas(selectionCtx)
}

function OnChangeSelection() {
  SelectionMode = document.getElementById('selection-mode').value
  if (SelectionMode == 'New') {
    prevmask = null
    mask = null
    coremask = null
    feathereddata = null
    ClearCanvas(borderCtx)
    ClearCanvas(selectionCtx)
  }
}

function uploadClick() {
  document.getElementById("file-upload").click()
}

function openImg(inp) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (inp.files && inp.files[0]) {
        var reader = new FileReader()
        reader.onload = function(e) {
          var curimg = new Image()
          curimg.src = e.target.result
          origimg.src = e.target.result
          curimg.onload = function() {
            curimgCanvas = $("<canvas>")
              .attr("width", curimg.width)
              .attr("height", curimg.height)[0]
            curimgCtx = curimgCanvas.getContext("2d")
            curimgCtx.drawImage(curimg, 0, 0)

            document.getElementById('file-upload').value = ""
            toolDrawCanvas.width = window.screen.width
            toolDrawCanvas.height = window.screen.height
            selectionCanvas.width = window.screen.width
            selectionCanvas.height = window.screen.height
            borderCanvas.width = window.screen.width
            borderCanvas.height = window.screen.height

            responsive = true
            imgscale = 1
            if (curimg.width < window.innerWidth && curimg.height < window.innerHeight) {
              $('#editor-region').css('width', curimg.width)
              $('#editor-region').css('height', curimg.height)
              $('#display-image').css('width', curimg.width)
              $('#display-image').css('height', curimg.height)
            } else {
              var _curwinwidth = window.innerWidth - 60
              var _curwinheight = window.innerHeight - document.getElementById('tool-area').offsetHeight

              imgscale = Math.max(curimg.width / _curwinwidth, curimg.height / _curwinheight)

              $('#editor-region').css('width', Math.round(curimg.width / imgscale))
              $('#editor-region').css('height', Math.round(curimg.height / imgscale))
              $('#display-image').css('width', Math.round(curimg.width / imgscale))
              $('#display-image').css('height', Math.round(curimg.height / imgscale))
            }

            clientOffset.x = (window.innerWidth - editorRegion.offsetWidth) / 2
            clientOffset.y = (window.innerHeight - editorRegion.offsetHeight - document.getElementById('tool-area').offsetHeight) / 2

            imgcenterX = editorRegion.offsetLeft + editorRegion.offsetWidth / 2
            imgcenterY = editorRegion.offsetTop + editorRegion.offsetHeight / 2
            oninit()
          }
        }
        reader.readAsDataURL(inp.files[0])
      }
    }, 500);
  });
}

async function imgChange(inp) {
  await openImg(inp)
}

function onClear() {
  curimgCtx.drawImage(origimg, 0, 0)
  responsive = true
  clientOffset.x = (window.innerWidth - editorRegion.offsetWidth) / 2
  clientOffset.y = (window.innerHeight - editorRegion.offsetHeight - document.getElementById('tool-area').offsetHeight) / 2

  imgcenterX = editorRegion.offsetLeft + editorRegion.offsetWidth / 2
  imgcenterY = editorRegion.offsetTop + editorRegion.offsetHeight / 2
  oninit()
}

download_img = function(el) {
  el.href = curimgCanvas.toDataURL()
}