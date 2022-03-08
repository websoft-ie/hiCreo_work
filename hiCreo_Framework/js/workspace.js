window.onload = function() {
  sizeVal = 10
  tolerance = 10
  feather = 0

  isDrawingMode = false
  firstPt = null
  prevPt = null
  storedPolygonLines = []

  toolDrawCanvas = $("#toolDrawCanvas")[0]
  toolDrawCanvas.width = window.screen.width
  toolDrawCanvas.height = window.screen.height
  toolDrawCtx = toolDrawCanvas.getContext('2d')
  selectionCanvas = $("#selectionCanvas")[0]
  selectionCanvas.width = window.screen.width
  selectionCanvas.height = window.screen.height
  selectionCtx = selectionCanvas.getContext('2d')
  borderCanvas = $("#borderCanvas")[0]
  borderCanvas.width = window.screen.width
  borderCanvas.height = window.screen.height
  borderCtx = borderCanvas.getContext('2d')
  trackTransforms(toolDrawCtx)
  trackTransforms(selectionCtx)
  trackTransforms(borderCtx)

  curobjectid = null

  imgcenterX = 0
  imgcenterY = 0
  responsive = true

  clientOffset = { x: 0, y: 0 }
  canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)

  lastX = $('html').width() / 2
  lastY = $('html').height() / 2
  dragStart = null
  dragged = false
  scalefactor = 1.1
  imgOffset = null
  prezoomcenterX = 0
  prezoomcenterY = 0
  prezoomfactor = 1
  curzoomfactor = 1
  prestagescale = 1
  stagescale = 1
  preWinWidth = window.innerWidth
  preWinHeight = window.innerHeight
  preangle = null

  hatchLength = 4
  hatchOffset = 0
  imgscale = 1
  rotAngle = 0

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
  drawCanvas = null
  drawCtx = null
  ToolMode = 'Eraser'
  SelectionMode = 'New'
  isDrawingMode = false // true when clicking the left mouse button in Polygon tool mode
  isLMousePressed = false // true when clicking the left mouse button in Eraser tool mode

  var firstPt = { x: 0, y: 0 }
  var prevPt = { x: 0, y: 0 }

  $(".editable_item").on('click', function(event) {
    const _id = event.currentTarget.id
    curobjectid = _id.replace('obj_', '')
    if (_id === 'obj_1633619122581' || _id === 'obj_1633620372169') {
      window.parent.imageEditor(event.currentTarget)

      rotAngle = getRotationDegrees($("#obj_" + curobjectid))
        // $("#obj_" + curobjectid).css('transform', `rotate(${(_angle).toString()}deg)`)

      origimg.src = $("#image_" + curobjectid)[0].src
      origimg.onload = function() {
        imgscale = $("#image_" + curobjectid)[0].clientWidth / origimg.width
        $("#image_" + curobjectid).css('display', 'none')

        sizeVal = 10
        tolerance = 10
        feather = 0
        oninit()
      }
    }
  });

  const zoom = function(factor) {
    const pt = toolDrawCtx.getTransformedPoint(lastX, lastY)
    toolDrawCtx.translate(pt.x, pt.y)
    toolDrawCtx.scale(factor, factor)
    toolDrawCtx.translate(-pt.x, -pt.y)

    selectionCtx.translate(pt.x, pt.y)
    selectionCtx.scale(factor, factor)
    selectionCtx.translate(-pt.x, -pt.y)

    borderCtx.translate(pt.x, pt.y)
    borderCtx.scale(factor, factor)
    borderCtx.translate(-pt.x, -pt.y)

    curzoomfactor = curzoomfactor * factor
    redraw()
  }

  const ResizeObserver = (event) => {
    const _htmlSize = {
      width: $('html').width(),
      height: $('html').height()
    }
    const error = 90
    const _themeSize = {
      width: $('#themeLayout').width(),
      height: $('#themeLayout').height()
    }
    const _themePositionByObjs = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }
    const _scale = Math.min(
      (_htmlSize.width - error) /
      (_themeSize.width +
        Math.max(_themePositionByObjs.left, _themePositionByObjs.right) * 2),
      (_htmlSize.height - error) /
      (_themeSize.height +
        Math.max(_themePositionByObjs.top, _themePositionByObjs.bottom) * 2)
    ).toFixed(2)

    $('#themeLayout').css(
      'transform',
      'scale(' + _scale + ', ' + _scale + ')'
    )
    $('.lsPage').css(
      'transform',
      'scale(' + _scale + ', ' + _scale + ')'
    )
    const _rulerSize = 0
    const _pageOffset = {
      left: Math.round(
        $('html').width() / 2 - ($('#themeLayout').width() * _scale) / 2 + _rulerSize / 2
      ),
      top: Math.round(
        $('html').height() / 2 - ($('#themeLayout').height() * _scale) / 2 + _rulerSize / 2
      )
    }

    $('#themeLayout').offset({
      left: _pageOffset.left + 1 * _scale,
      top: _pageOffset.top + 1 * _scale
    })
    $('.lsPage').offset({
      left: _pageOffset.left + 1 * _scale,
      top: _pageOffset.top + 1 * _scale
    })

    // console.log('Image Width: ', $("#image_1633619122581")[0].clientWidth * _scale)
    // console.log('Image Left: ', $("#obj_1633619122581")[0].offsetLeft * _scale)
    // console.log('Theme Width: ', $('#themeLayout').width())
    stagescale = _scale
    if (curimgCanvas) {
      curzoomfactor = curzoomfactor * (stagescale / prestagescale)
      toolDrawCtx.setTransform(1, 0, 0, 1, 0, 0)
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
      borderCtx.setTransform(1, 0, 0, 1, 0, 0)
      toolDrawCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
      selectionCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
      borderCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)

      const pt = toolDrawCtx.getTransformedPoint(
        $('#themeLayout').offset().left + imgOffset.x * stagescale,
        $('#themeLayout').offset().top + imgOffset.y * stagescale)
      toolDrawCtx.translate(pt.x, pt.y)
      selectionCtx.translate(pt.x, pt.y)
      borderCtx.translate(pt.x, pt.y)
      toolDrawCtx.rotate((Math.PI / 180) * rotAngle)
      selectionCtx.rotate((Math.PI / 180) * rotAngle)
      borderCtx.rotate((Math.PI / 180) * rotAngle)
      redraw()
    }

    prestagescale = stagescale
  }

  window.addEventListener('load', ResizeObserver);
  window.addEventListener('resize', ResizeObserver);

  selectionCanvas.addEventListener('mousedown', function(e) {
    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    console.log('CurX: ', lastX, ' CurY: ', lastY)
    console.log('TransformedCurX: ', toolDrawCtx.getTransformedPoint(lastX, lastY).x, ' CurY: ', toolDrawCtx.getTransformedPoint(lastX, lastY).y)
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
        drawCanvas = $('<canvas>')
          .attr("width", curimgCanvas.width)
          .attr("height", curimgCanvas.height)[0]
        drawCtx = drawCanvas.getContext("2d")
        drawCtx.filter = `blur(${(feather / (curzoomfactor * imgscale)).toString()}px)`
        drawCtx.fillStyle = '#FFFFFFFF'
        drawCtx.beginPath()
        drawCtx.moveTo(
          Math.round((mousePos.x - clientOffset.x)),
          Math.round((mousePos.y - clientOffset.y)))
        minX_lasso = Math.round(mousePos.x - clientOffset.x)
        maxX_lasso = Math.round(mousePos.x - clientOffset.x)
        minY_lasso = Math.round(mousePos.y - clientOffset.y)
        maxY_lasso = Math.round(mousePos.y - clientOffset.y)
      } else {
        if (storedPolygonLines.length > 0 && distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
          storedPolygonLines.push({
            x1: prevPt.x,
            y1: prevPt.y,
            x2: firstPt.x,
            y2: firstPt.y
          })
          isDrawingMode = false
          drawCtx.lineTo(
            Math.round(mousePos.x - clientOffset.x),
            Math.round(mousePos.y - clientOffset.y))
          drawCtx.closePath()
          drawCtx.fill()
          ClearCanvas(selectionCtx)

          mask = {
            canvas: drawCanvas,
            context: drawCtx,
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
            const angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
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
          prevPt = mousePos
          drawCtx.lineTo(
            Math.round(mousePos.x - clientOffset.x),
            Math.round(mousePos.y - clientOffset.y))
          minX_lasso = Math.min(minX_lasso, Math.round(mousePos.x - clientOffset.x))
          maxX_lasso = Math.max(maxX_lasso, Math.round(mousePos.x - clientOffset.x))
          minY_lasso = Math.min(minY_lasso, Math.round(mousePos.y - clientOffset.y))
          maxY_lasso = Math.max(maxY_lasso, Math.round(mousePos.y - clientOffset.y))
        }
      }
    } else if (ToolMode == 'MagicWand') {
      if (mousePos.x < 0 || mousePos.y < 0) return
      getMagicWandMask(
        Math.round((mousePos.x - clientOffset.x)),
        Math.round((mousePos.y - clientOffset.y)))
    } else if (ToolMode == 'Eraser') {
      isLMousePressed = true
      prevPt = mousePos

      drawCanvas = $('<canvas>')[0]
      drawCanvas.width = Math.round(curimgCanvas.width * curzoomfactor * imgscale)
      drawCanvas.height = Math.round(curimgCanvas.height * curzoomfactor * imgscale)
      drawCtx = drawCanvas.getContext("2d")
      drawCtx.filter = `blur(${(feather * curzoomfactor).toString()}px)`
      drawCtx.lineWidth = sizeVal * 2 * curzoomfactor
      drawCtx.beginPath()
      drawCtx.arc(
        (mousePos.x - clientOffset.x) * curzoomfactor * imgscale,
        (mousePos.y - clientOffset.y) * curzoomfactor * imgscale,
        sizeVal * curzoomfactor, 0, 2 * Math.PI)
      drawCtx.fill()
      drawCtx.beginPath()

      canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)
      toolDrawCtx.save()
      toolDrawCtx.filter = `blur(${(feather * curzoomfactor).toString()}px)`
      toolDrawCtx.globalCompositeOperation = 'destination-out'
      toolDrawCtx.beginPath()
      toolDrawCtx.arc(mousePos.x, mousePos.y, sizeVal / imgscale, 0, 2 * Math.PI)
      toolDrawCtx.fill()
      toolDrawCtx.stroke()
      toolDrawCtx.restore()

      ClearCanvas(selectionCtx)
      selectionCtx.beginPath()
      selectionCtx.arc(mousePos.x, mousePos.y, sizeVal / imgscale, 0, 2 * Math.PI)
      selectionCtx.stroke()
    } else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') {
      prevPt = mousePos
      isLMousePressed = true
      drawCanvas = $('<canvas>')
        .attr("width", curimgCanvas.width)
        .attr("height", curimgCanvas.height)[0]
      drawCtx = drawCanvas.getContext("2d")
      trackTransforms(drawCtx)
      drawCtx.filter = `blur(${(feather / (curzoomfactor * imgscale)).toString()}px)`
      drawCtx.fillStyle = '#FFFFFFFF'
    }
  }, false)

  selectionCanvas.addEventListener('mousemove', function(e) {
    if (e.button != 0 && (!isDrawingMode)) return

    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)
    if (ToolMode == 'Move') {
      dragged = true
      if (dragStart && dragged) {
        toolDrawCtx.translate(mousePos.x - dragStart.x, mousePos.y - dragStart.y)
        selectionCtx.translate(mousePos.x - dragStart.x, mousePos.y - dragStart.y)
        borderCtx.translate(mousePos.x - dragStart.x, mousePos.y - dragStart.y)
        redraw()
      }
    }

    if (ToolMode == 'Eraser') {
      setTimeout(function() {
        ClearCanvas(selectionCtx)

        selectionCtx.saveTransform()
        selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
        selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
        selectionCtx.shadowColor = '#111111'
        selectionCtx.shadowBlur = 4
        selectionCtx.beginPath()
        selectionCtx.arc(lastX, lastY, curzoomfactor * sizeVal, 0, 2 * Math.PI)
        selectionCtx.stroke()
        selectionCtx.restoreTransform()
      }, 10)
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
      selectionCtx.moveTo(
        toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).x,
        toolDrawCtx.getActualPoint(prevPt.x, prevPt.y).y)
      if (e.shiftKey) {
        const angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
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
      const angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
      if (e.shiftKey) {
        if (angle < Math.PI / 4)
          mousePos.y = prevPt.y
        else
          mousePos.x = prevPt.x
      }
      toolDrawCtx.save()
      toolDrawCtx.globalCompositeOperation = 'destination-out'
      toolDrawCtx.filter = `blur(${(feather * curzoomfactor).toString()}px)`
      toolDrawCtx.beginPath()
      toolDrawCtx.arc(mousePos.x, mousePos.y, sizeVal / imgscale, 0, 2 * Math.PI)
      toolDrawCtx.fill()
      toolDrawCtx.lineWidth = sizeVal * 2 / imgscale
      toolDrawCtx.beginPath()
      toolDrawCtx.moveTo(prevPt.x, prevPt.y)
      toolDrawCtx.lineTo(mousePos.x, mousePos.y)
      toolDrawCtx.stroke()
      toolDrawCtx.restore()

      drawCtx.beginPath()
      drawCtx.arc(
        (mousePos.x - clientOffset.x) * curzoomfactor * imgscale,
        (mousePos.y - clientOffset.y) * curzoomfactor * imgscale,
        sizeVal * curzoomfactor, 0, 2 * Math.PI)
      drawCtx.fill()
      drawCtx.beginPath()
      drawCtx.moveTo(
        (prevPt.x - clientOffset.x) * curzoomfactor * imgscale,
        (prevPt.y - clientOffset.y) * curzoomfactor * imgscale)
      drawCtx.lineTo(
        (mousePos.x - clientOffset.x) * curzoomfactor * imgscale,
        (mousePos.y - clientOffset.y) * curzoomfactor * imgscale)
      drawCtx.stroke()

      if (e.shiftKey) {} else {
        prevPt = mousePos
      }
    } else if ((ToolMode == 'Rectangle' || ToolMode == 'Ellipse') && isLMousePressed) {
      ClearCanvas(selectionCtx)

      selectionCtx.saveTransform()
      selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
      selectionCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
      selectionCtx.shadowColor = '#111111'
      selectionCtx.shadowBlur = 4
      selectionCtx.beginPath()
      const _preActual = toolDrawCtx.getActualPoint(prevPt.x, prevPt.y)
      var _width = Math.abs(_preActual.x - lastX)
      var _height = Math.abs(_preActual.y - lastY)
      var biggerHeight = false
      if (e.shiftKey) {
        if (_height > _width) biggerHeight = true
        _width = Math.min(_width, _height)
        _height = _width
      }
      var _startX = Math.max(_preActual.x, lastX) - _width
      var _startY = Math.max(_preActual.y, lastY) - _height
      if (biggerHeight && (_preActual.y < lastY))
        _startY = Math.max(_preActual.y, lastY) - Math.abs(_preActual.y - lastY)
      if (!biggerHeight && (_preActual.x < lastX))
        _startX = Math.max(_preActual.x, lastX) - Math.abs(_preActual.x - lastX)
      const _centerX = _startX + _width / 2
      const _centerY = _startY + _height / 2

      if (ToolMode == 'Rectangle')
        selectionCtx.rect(_startX, _startY, _width, _height)
      else if (ToolMode == 'Ellipse')
        selectionCtx.ellipse(_centerX, _centerY, _width / 2, _height / 2, 0, 0, 2 * Math.PI)
      selectionCtx.stroke()
      selectionCtx.restoreTransform()
    }
  }, false)

  selectionCanvas.addEventListener('mouseup', function(e) {
    dragStart = null
    dragged = false

    if (e.button != 0) return
    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)
    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)

    isLMousePressed = false
    if (ToolMode == 'Eraser') {
      curimgCtx.save()
      curimgCtx.scale(1 / (imgscale * curzoomfactor), 1 / (imgscale * curzoomfactor))
      curimgCtx.globalCompositeOperation = 'destination-out'
      curimgCtx.beginPath()
      curimgCtx.drawImage(drawCanvas, 0, 0)
      curimgCtx.restore()
      redraw()
    } else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') {
      const _preActual = toolDrawCtx.getActualPoint(prevPt.x, prevPt.y)
      const _origin = toolDrawCtx.getActualPoint(0, 0)
      var _width = Math.abs(_preActual.x - lastX) / (curzoomfactor * imgscale)
      var _height = Math.abs(_preActual.y - lastY) / (curzoomfactor * imgscale)
      var biggerHeight = false
      if (e.shiftKey) {
        if (_height > _width) biggerHeight = true
        _width = Math.min(_width, _height)
        _height = _width
      }
      var _startX = (Math.max(_preActual.x, lastX) - _origin.x) / (curzoomfactor * imgscale) - _width
      var _startY = (Math.max(_preActual.y, lastY) - _origin.y) / (curzoomfactor * imgscale) - _height
      if (biggerHeight && (_preActual.y < lastY))
        _startY = (Math.max(_preActual.y, lastY) - _origin.y) / (curzoomfactor * imgscale) - Math.abs(_preActual.y - lastY) / (curzoomfactor * imgscale)
      if (!biggerHeight && (_preActual.x < lastX))
        _startX = (Math.max(_preActual.x, lastX) - _origin.x) / (curzoomfactor * imgscale) - Math.abs(_preActual.x - lastX) / (curzoomfactor * imgscale)
      const _centerX = _startX + _width / 2
      const _centerY = _startY + _height / 2

      drawCtx.beginPath()
      drawCtx.rotate(-(Math.PI / 180) * rotAngle)
      if (ToolMode == 'Rectangle')
        drawCtx.rect(
          Math.round(_startX), Math.round(_startY), Math.round(_width), Math.round(_height)
        )
      else if (ToolMode == 'Ellipse')
        drawCtx.ellipse(
          Math.round(_centerX), Math.round(_centerY), Math.round(_width / 2), Math.round(_height / 2), 0, 0, 2 * Math.PI
        )
      drawCtx.fill()
      mask = {
        canvas: drawCanvas,
        context: drawCtx,
        bounds: {
          minX: 0,
          maxX: drawCanvas.width,
          minY: 0,
          maxY: drawCanvas.height
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

  selectionCanvas.addEventListener('dblclick', function(e) {
    if (ToolMode != 'Lasso') return

    lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
    lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)

    var mousePos = toolDrawCtx.getTransformedPoint(lastX, lastY)
    mousePos.x = Math.round(mousePos.x)
    mousePos.y = Math.round(mousePos.y)


    if (!isDrawingMode || storedPolygonLines.length == 0) return
    curPt = mousePos
    if (e.shiftKey) {
      const angle = Math.atan2(Math.abs(mousePos.y - prevPt.y), Math.abs(mousePos.x - prevPt.x))
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
      drawCtx.lineTo(
        Math.round(mousePos.x - clientOffset.x),
        Math.round(mousePos.y - clientOffset.y))
      minX_lasso = Math.min(minX_lasso, Math.round(mousePos.x - clientOffset.x))
      maxX_lasso = Math.max(maxX_lasso, Math.round(mousePos.x - clientOffset.x))
      minY_lasso = Math.min(minY_lasso, Math.round(mousePos.y - clientOffset.y))
      maxY_lasso = Math.max(maxY_lasso, Math.round(mousePos.y - clientOffset.y))
    }
    drawCtx.lineTo(
      Math.round(firstPt.x - clientOffset.x),
      Math.round(firstPt.y - clientOffset.y))
    isDrawingMode = false
    drawCtx.closePath()
    drawCtx.fill()
    ClearCanvas(selectionCtx)
    mask = {
      canvas: drawCanvas,
      context: drawCtx,
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

  var handleScroll = function(e) {
    e.preventDefault()
    SCROLL_SENSITIVITY = 0.005
    const delta = -e.deltaY * SCROLL_SENSITIVITY

    if (delta) {
      const factor = Math.pow(scalefactor, delta)
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

  setInterval(function() {
    hatchTick()
  }, 50)
};

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
  } else if (event.code == 'KeyD' || event.code == 'Escape') {
    if (event.code == 'KeyD' && !event.ctrlKey) return
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
  } else if (event.shiftKey) {
    SelectionMode = 'Add'
  } else if (event.altKey) {
    SelectionMode = 'Subtract'
  }
})

document.addEventListener("keyup", function(event) {
  if (event.key == 'Shift') {
    SelectionMode = 'New'
  } else if (event.key == 'Alt') {
    SelectionMode = 'New'
  }
})

function getRotationDegrees(obj) {
  var matrix = obj.css("-webkit-transform") ||
    obj.css("-moz-transform") ||
    obj.css("-ms-transform") ||
    obj.css("-o-transform") ||
    obj.css("transform");
  if (matrix !== 'none') {
    var values = matrix.split('(')[1].split(')')[0].split(',');
    var a = values[0];
    var b = values[1];
    var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
  } else { var angle = 0; }
  return (angle < 0) ? angle + 360 : angle;
}

function hatchTick() {
  hatchOffset = (hatchOffset + 1) % (hatchLength * 2)
  drawBorder()
}

function distance(pt1, pt2) {
  var result = Math.sqrt(Math.pow((pt2[0] - pt1[0]), 2) + Math.pow((pt2[1] - pt1[1]), 2))
  return result
}

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
  mask = MagicWand.floodFill(image, Math.round(x), Math.round(y), tolerance, null, true)
  var resCanvas = $("<canvas>")
    .attr("width", curimgCanvas.width)
    .attr("height", curimgCanvas.height)[0]
  var resCtx = resCanvas.getContext("2d")
  resCtx.filter = `blur(${(feather / (curzoomfactor * imgscale)).toString()}px)`
  resCtx.drawImage(mask.canvas, 0, 0)
  mask.canvas = resCanvas
  mask.context = resCtx

  // curimgCtx.clearRect(0, 0, curimgCanvas.width, curimgCanvas.height)
  // curimgCtx.drawImage(resCanvas, 0, 0)
  // redraw()

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
  // 	xl = Math.max(0, prevmask.bounds.minX - 2 * feather)
  // 	xr = Math.min(curimgCanvas.width, prevmask.bounds.maxX + 2 * feather)
  // 	yt = Math.max(0, prevmask.bounds.minY - 2 * feather)
  // 	yb = Math.min(curimgCanvas.height, prevmask.bounds.maxY + 2 * feather)

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
  xl = Math.max(0, prevmask.bounds.minX - 2 * feather)
  xr = Math.min(curimgCanvas.width, prevmask.bounds.maxX + 2 * feather)
  yt = Math.max(0, prevmask.bounds.minY - 2 * feather)
  yb = Math.min(curimgCanvas.height, prevmask.bounds.maxY + 2 * feather)
  var _tmpCanvas = $("<canvas>")
    .attr("width", Math.round(curimgCanvas.width * curzoomfactor * imgscale))
    .attr("height", Math.round(curimgCanvas.height * curzoomfactor * imgscale))[0]
  _tmpCtx = _tmpCanvas.getContext("2d")
  _tmpCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
  _tmpCtx.drawImage(prevmask.canvas, 0, 0)
  coremask = {
    canvas: _tmpCanvas,
    context: _tmpCtx,
    bounds: {
      minX: Math.round(xl * curzoomfactor * imgscale),
      minY: Math.round(yt * curzoomfactor * imgscale),
      maxX: Math.round(xr * curzoomfactor * imgscale),
      maxY: Math.round(yb * curzoomfactor * imgscale)
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

  _tmpCtx.putImageData(imgData, coremask.bounds.minX, coremask.bounds.minY)
  borderCtx.scale(1 / (curzoomfactor * imgscale), 1 / (curzoomfactor * imgscale))
  borderCtx.drawImage(_tmpCanvas, 0, 0)
  borderCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
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

function ClearCanvas(_context) {
  var p1 = _context.getTransformedPoint(-3 * _context.canvas.width, -3 * _context.canvas.height)
  var p2 = _context.getTransformedPoint(3 * _context.canvas.width, 3 * _context.canvas.height)
  _context.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)
  _context.clearRect(-10 * _context.canvas.width, -10 * _context.canvas.height, 20 * _context.canvas.width, 20 * _context.canvas.height)
}

function redraw() {
  ClearCanvas(toolDrawCtx)
  canvasOffset = toolDrawCtx.getActualPoint(clientOffset.x, clientOffset.y)
    // toolDrawCtx.drawImage(curimgCanvas, clientOffset.x, clientOffset.y, Math.round(curimgCanvas.width / imgscale), Math.round(curimgCanvas.height / imgscale))
  toolDrawCtx.drawImage(curimgCanvas, 0, 0)

  imgOffset = toolDrawCtx.getActualPoint(0, 0)
  imgOffset.x = imgOffset.x - $('#themeLayout').offset().left
  imgOffset.y = imgOffset.y - $('#themeLayout').offset().top
  imgOffset.x = imgOffset.x / stagescale
  imgOffset.y = imgOffset.y / stagescale
}

function oninit() {
  coremask = null
  mask = null
  prevmask = null
  ClearCanvas(toolDrawCtx)
  ClearCanvas(selectionCtx)
  ClearCanvas(borderCtx)
  toolDrawCtx.setTransform(1, 0, 0, 1, 0, 0)
  selectionCtx.setTransform(1, 0, 0, 1, 0, 0)
  borderCtx.setTransform(1, 0, 0, 1, 0, 0)

  curimgCanvas = $("<canvas>")
    .attr("width", origimg.width)
    .attr("height", origimg.height)[0]
  curimgCtx = curimgCanvas.getContext("2d")
  curimgCtx.drawImage(origimg, 0, 0)

  curzoomfactor = stagescale
  prezoomfactor = stagescale

  toolDrawCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
  selectionCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
  borderCtx.scale(curzoomfactor * imgscale, curzoomfactor * imgscale)
  const pt = toolDrawCtx.getTransformedPoint(
    $('#themeLayout').offset().left + $("#obj_" + curobjectid)[0].offsetLeft * curzoomfactor,
    $('#themeLayout').offset().top + $("#obj_" + curobjectid)[0].offsetTop * curzoomfactor)
  toolDrawCtx.translate(pt.x, pt.y)
  selectionCtx.translate(pt.x, pt.y)
  borderCtx.translate(pt.x, pt.y)

  toolDrawCtx.translate(origimg.width / 2, origimg.height / 2)
  selectionCtx.translate(origimg.width / 2, origimg.height / 2)
  borderCtx.translate(origimg.width / 2, origimg.height / 2)
  toolDrawCtx.rotate((Math.PI / 180) * rotAngle)
  selectionCtx.rotate((Math.PI / 180) * rotAngle)
  borderCtx.rotate((Math.PI / 180) * rotAngle)
  toolDrawCtx.translate(-origimg.width / 2, -origimg.height / 2)
  selectionCtx.translate(-origimg.width / 2, -origimg.height / 2)
  borderCtx.translate(-origimg.width / 2, -origimg.height / 2)
  redraw()
}

function OnValueChanged(_size, _feather, _tolerance) {
  sizeVal = _size
  tolerance = _tolerance
  feather = _feather
}

function OnChangeTool(_toolMode) {
  ToolMode = _toolMode
  redraw()
  if (ToolMode == 'Move') selectionCanvas.style.cursor = 'move'
  else if (ToolMode == 'Eraser') selectionCanvas.style.cursor = 'none'
  else if (ToolMode == 'Rectangle' || ToolMode == 'Ellipse') selectionCanvas.style.cursor = 'crosshair'
  else selectionCanvas.style.cursor = 'default'
  ClearCanvas(selectionCtx)
}

function OnChangeSelection(_selectionMode) {
  alert(_selectionMode)
  SelectionMode = _selectionMode
  if (SelectionMode == 'New') {
    prevmask = null
    mask = null
    coremask = null
    feathereddata = null
    ClearCanvas(borderCtx)
    ClearCanvas(selectionCtx)
  }
}

function Reset() {
  oninit()
}

function onFinish() {
  $("#image_" + curobjectid)[0].src = curimgCanvas.toDataURL()
  $("#image_" + curobjectid).css('display', 'block')
  $("#toolDrawCanvas").css('z-index', -1)
  $("#selectionCanvas").css('z-index', -1)
  $("#borderCanvas").css('z-index', -1)
  ClearCanvas(toolDrawCtx)
  ClearCanvas(selectionCtx)
  ClearCanvas(borderCtx)
  coremask = null
  mask = null
  prevmask = null
  curimgCanvas = null
}