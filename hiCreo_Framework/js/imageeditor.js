// // function OnUpload() {
// //   document.getElementById("file-upload").click()
// // }

// // function openImg(inp) {
// //   return new Promise(resolve => {
// //     setTimeout(() => {
// //       if (inp.files && inp.files[0]) {
// //         var reader = new FileReader()
// //         reader.onload = function(e) {
// //           document.getElementById('file-upload').value = ""
// //           var iFrameDOM = $("iframe#Stage").contents()
// //           iFrameDOM.find("#image_1633620372169")[0].src = e.target.result
// //         }
// //         reader.readAsDataURL(inp.files[0])
// //       }
// //     }, 500);
// //   });
// // }

// // async function imgChange(inp) {
// //   await openImg(inp)
// // }


// window.onload = function() {
//   // $(".editable_item").on('click', function(event) {
//   //   const _id = event.currentTarget.id
//   //   if (_id === 'obj_1633619122581' || _id === 'obj_1633620372169') {
//   //     window.parent.imageEditor(event.currentTarget)
//   //   }
//   // });

//   isDrawingMode = false
//   firstPt = null
//   prevPt = null
//   storedPolygonLines = []

//   iFrameDOM = $("iframe#Stage").contents()
//   toolDrawCanvas = iFrameDOM.find("#toolDrawCanvas")[0]
//   toolDrawCtx = toolDrawCanvas.getContext('2d')
//   toolDrawCanvas.width = iFrameDOM.find("#lsContainer")[0].clientWidth
//   toolDrawCanvas.height = iFrameDOM.find("#lsContainer")[0].clientHeight

//   toolDrawCanvas.addEventListener('mousedown', function(e) {
//     lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
//     lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)

//     if (e.button != 0) return
//     var mousePos = { x: lastX, y: lastY }

//     if (!isDrawingMode) {
//       isDrawingMode = true
//       storedPolygonLines = []
//       prevPt = mousePos
//       firstPt = prevPt
//     } else {
//       if (storedPolygonLines.length > 0 && distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
//         storedPolygonLines.push({
//           x1: prevPt.x,
//           y1: prevPt.y,
//           x2: firstPt.x,
//           y2: firstPt.y
//         })
//         isDrawingMode = false
//       } else {

//         storedPolygonLines.push({
//           x1: prevPt.x,
//           y1: prevPt.y,
//           x2: mousePos.x,
//           y2: mousePos.y
//         })
//         prevPt = {
//           x: mousePos.x,
//           y: mousePos.y
//         }
//       }
//     }

//   }, false)

//   toolDrawCanvas.addEventListener('mousemove', function(e) {
//     if (e.button != 0 && (!isDrawingMode)) return

//     lastX = e.offsetX || (e.pageX - toolDrawCanvas.offsetLeft)
//     lastY = e.offsetY || (e.pageY - toolDrawCanvas.offsetTop)

//     var mousePos = { x: lastX, y: lastY }

//     if (isDrawingMode) {
//       redrawStoredPolygonLines()
//       if (distance([firstPt.x, firstPt.y], [mousePos.x, mousePos.y]) < 5) {
//         toolDrawCtx.save()
//         toolDrawCtx.beginPath()
//         toolDrawCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
//         toolDrawCtx.shadowColor = '#111111'
//         toolDrawCtx.shadowBlur = 4
//         toolDrawCtx.arc(lastX, lastY, 5, 0, 2 * Math.PI)
//         toolDrawCtx.stroke()
//         toolDrawCtx.restore()
//       }

//       toolDrawCtx.save()
//       toolDrawCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
//       toolDrawCtx.shadowColor = '#111111'
//       toolDrawCtx.shadowBlur = 4
//       toolDrawCtx.beginPath()
//       toolDrawCtx.moveTo(prevPt.x, prevPt.y)
//       toolDrawCtx.lineTo(lastX, lastY)
//       toolDrawCtx.stroke()
//       toolDrawCtx.restore()
//     }
//   }, false)

// };

// function distance(pt1, pt2) {
//   var result = Math.sqrt(Math.pow((pt2[0] - pt1[0]), 2) + Math.pow((pt2[1] - pt1[1]), 2))
//   return result
// }

// function redrawStoredPolygonLines() {
//   toolDrawCanvas.width = iFrameDOM.find("#lsContainer")[0].clientWidth
//   toolDrawCanvas.height = iFrameDOM.find("#lsContainer")[0].clientHeight

//   if (storedPolygonLines.length == 0) return

//   toolDrawCtx.save()
//   toolDrawCtx.strokeStyle = 'rgba(255, 255, 255, 1)'
//   toolDrawCtx.shadowColor = '#111111'
//   toolDrawCtx.shadowBlur = 4
//   for (var i = 0; i < storedPolygonLines.length; i++) {
//     toolDrawCtx.beginPath()
//     toolDrawCtx.moveTo(storedPolygonLines[i].x1, storedPolygonLines[i].y1)
//     toolDrawCtx.lineTo(storedPolygonLines[i].x2, storedPolygonLines[i].y2)
//     toolDrawCtx.stroke()
//   }
//   toolDrawCtx.restore()
// }