<template>
  <div
    id="container"
    ref="container"
    style="position: relative; user-select: none; touch-action: none; height: 100%;"
  >
    <slot v-bind="{ selected: intersected }" />
  </div>
</template>

<script>
const getDimensions = (p1, p2) => ({
  width: Math.abs(p1.x - p2.x),
  height: Math.abs(p1.y - p2.y)
});
const collisionCheck = (node1, node2) =>
  node1.left < node2.left + node2.width &&
  node1.left + node1.width > node2.left &&
  node1.top < node2.top + node2.height &&
  node1.top + node1.height > node2.top;

export default {
  props: {
    attribute: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: "#4299E1"
    },
    opacity: {
      type: Number,
      default: 0.7
    }
  },
  data() {
    return {
      intersected: []
    };
  },
  watch: {
    intersected(i) {
      this.$emit("change", i);
    }
  },
  mounted() {
    const { container } = this.$refs;
    const self = this;

    let containerRect = container.getBoundingClientRect();

    const getCoords = e => ({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top
    });

    let children;

    let box = document.createElement("div");
    box.setAttribute("data-drag-box-component", "");
    box.style.position = "absolute";
    box.style.zIndex = "99";
    box.style.backgroundColor = this.color;
    box.style.opacity = this.opacity;

    let start = { x: 0, y: 0 };
    let end = { x: 0, y: 0 };

    function intersection() {
      const rect = box.getBoundingClientRect();
      const intersected = [];

      for (let i = 0; i < children.length; i++) {
        try{
          if (collisionCheck(rect, children[i].getBoundingClientRect())) {
            // const attr = children[i].getAttribute(self.attribute);
            // if (children[i].hasAttribute(self.attribute)) {
              intersected.push(i);
            // }
          }
        }
        catch (err) {
          continue
        }
      }

      if (
        JSON.stringify([...intersected]) !==
        JSON.stringify([...self.intersected])
      )
        self.intersected = intersected;
    }

    function touchStart(e) {
      e.preventDefault();
      startDrag(e.touches[0]);
    }
    function touchMove(e) {
      e.preventDefault();
      drag(e.touches[0]);
    }

    function startDrag(e) {
      self.$emit("startDrag", e)
      start = getCoords(e);      
      containerRect = container.getBoundingClientRect();
      children = container.firstChild.childNodes;
      box.style.top = start.y + "px";
      box.style.left = start.x + "px";
      for (let i = 0; i < children.length; i++) {
        const childrenRect = children[i].getBoundingClientRect();
        if ((start.x + containerRect.left > childrenRect.x && start.x + containerRect.left < childrenRect.x + childrenRect.width) && 
            (start.y + containerRect.top > childrenRect.y && start.y + containerRect.top < childrenRect.y + childrenRect.height)) {
            // self.intersected.push(i)
            return
        }
      }

      end = start;
      document.addEventListener("mousemove", drag);
      document.addEventListener("touchmove", touchMove);

      container.prepend(box);
      intersection();
    }

    function drag(e) {
      end = getCoords(e);
      const dimensions = getDimensions(start, end);

      if (end.x < start.x) {
        box.style.left = end.x + "px";
      }
      if (end.y < start.y) {
        box.style.top = end.y + "px";
      }
      box.style.width = dimensions.width + "px";
      box.style.height = dimensions.height + "px";

      intersection();
    }

    function endDrag(e) {
      // If occurs within ToolBar region, return
      let fileBrowserRect = document.getElementById('file-content-id').getBoundingClientRect();
      const curPos = {x: e.clientX, y: e.clientY}
      curPos.x = curPos.x - fileBrowserRect.left
      curPos.y = curPos.y - fileBrowserRect.top
      if ((start.x <= 0 || start.y <= 0) && (curPos.x <= 0 || curPos.y <= 0)) return

      if (self.intersected.length == 0) {
        let isOutRegion = true
        //hiCreo
        if(children){
          for (let i = 0; i < children.length; i++) {
            const childrenRect = children[i].getBoundingClientRect();
            if ((start.x + containerRect.left > childrenRect.x && start.x + containerRect.left < childrenRect.x + childrenRect.width) && 
                (start.y + containerRect.top > childrenRect.y && start.y + containerRect.top < childrenRect.y + childrenRect.height)) {
                // self.intersected.push(i)
                isOutRegion = false
            }
          }
        }
        if (isOutRegion)
          self.$emit("clickoutside")
      }

      start = { x: 0, y: 0 };
      end = { x: 0, y: 0 };

      box.style.width = 0;
      box.style.height = 0;

      document.removeEventListener("mousemove", drag);
      document.removeEventListener("touchmove", touchMove);
      box.remove();


    }

    container.addEventListener("mousedown", startDrag);
    container.addEventListener("touchstart", touchStart);

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    this.$once("on:destroy", () => {
      container.removeEventListener("mousedown", startDrag);
      container.removeEventListener("touchstart", touchStart);
      document.removeEventListener("mouseup", endDrag);
      document.removeEventListener("touchend", endDrag);
    });
  }
};
</script>
