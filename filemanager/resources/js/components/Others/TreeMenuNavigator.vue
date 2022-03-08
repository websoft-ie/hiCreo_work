<template>
    <transition name="folder">
        <div class="folder-item-wrapper">

            <div :draggable="true" class="folder-item" :class="{'is-selected': isSelected , 'is-dragenter': area, 'is-inactive': disabledFolder || disabled }"
                                    :style="indent" 
                                    style="height: 100%;"
                                    @click="getFolder"
                                    @dragstart="$emit('dragstart')"
                                    @mouseover="focusFolder"
                                    @dragover.prevent="dragEnter"
                                    @dragleave="dragLeave"
                                    @drop="dragFinish($event)"
                                    @contextmenu.prevent="contextMenu($event, undefined)"

             >
                <div class="folder-item-info-wrap">
                    <chevron-right-icon @click.stop="showTree" size="17" class="icon-arrow"
                                        :class="{'is-opened': isVisible, 'is-visible': nodes.folders.length !== 0}">
                    </chevron-right-icon>
                <!-- <folder-icon size="17" class="icon"></folder-icon> -->
                <!-- <img v-if="isemptyfolder" class="icon" src="../FilesView/images/folder_empty.svg"/>
                <img v-if="!isemptyfolder" class="icon" src="../FilesView/images/folder_file.svg"/> -->
                
                    <svg v-if="isemptyfolder" class="icon" width="17" height="17"  version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                        viewBox="0 0 17 17" style="enable-background:new 0 0 17 17;" xml:space="preserve">
                        <path class="st0" d="M15.6,13.5c0,0.8-0.6,1.4-1.4,1.4H2.8c-0.8,0-1.4-0.6-1.4-1.4V3.5c0-0.8,0.6-1.4,1.4-1.4h3.5l1.4,2.1h6.4
                            c0.8,0,1.4,0.6,1.4,1.4V13.5z"/>                     
                    </svg>
                    <svg v-if="!isemptyfolder" class="icon" width="17" height="17" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                        viewBox="0 0 17 17" style="enable-background:new 0 0 17 17;" xml:space="preserve">
                        <path class="st0" d="M15.6,13.5c0,0.8-0.6,1.4-1.4,1.4H2.8c-0.8,0-1.4-0.6-1.4-1.4V3.5c0-0.8,0.6-1.4,1.4-1.4h3.5l1.4,2.1h6.4
                            c0.8,0,1.4,0.6,1.4,1.4V13.5z"/>
                        <path class="st0" d="M15.4,6.3H8L6.6,8.4H2.1"/>
                        <line class="st0" x1="1.9" y1="6" x2="15.3" y2="6"/>
                        <path class="st0" d="M1.9,14.2"/>
                    </svg>                
                    <span class="label">{{ nodes.name }}</span>
                </div>
            </div>                 

            <TreeMenuNavigator  @dragstart="dragStart(item)" :disabled="disableChildren" :depth="depth + 1" v-if="isVisible" :nodes="item" v-for="item in nodes.folders"
                               :key="item.unique_id"
                               />
        </div>
    </transition>
</template>

<script>
    import TreeMenuNavigator from '@/components/Others/TreeMenuNavigator'
    import {FolderIcon, ChevronRightIcon} from 'vue-feather-icons'
    import { mapGetters } from 'vuex'
    import {events} from "@/bus"

    export default {
        name: 'TreeMenuNavigator',
        props: [
            'nodes', 'depth' , 'disabled',
        ],
        components: {
            TreeMenuNavigator,
            ChevronRightIcon,
            FolderIcon,
        },
        computed: {
            ...mapGetters([
                'fileInfoDetail',
                'curclickedItem', 
                'data', 
                'status',
                'user', 
                'treefolders',
                'currentFolder',
            ]),

            disabledFolder() {
            //     let disableFolder = false
            //     let ismultiple = 0
            //     var curDragItem = this.curclickedItem && this.curclickedItem.type === 'folder' ? this.curclickedItem : undefined
            //     if (!curDragItem && this.fileInfoDetail.length > 0){
            //         for (let i = 0; i < this.fileInfoDetail.length; i++){
            //             if (this.fileInfoDetail[i].type === 'folder'){
            //                 curDragItem = this.fileInfoDetail[i]
            //                 ismultiple = ismultiple + 1
            //             }
            //         }
            //     }
            //     if(curDragItem) {
            //         //Disable the parent of the folder
            //         if(this.nodes.parent_id === curDragItem.unique_id){
            //             disableFolder = true
            //             this.disableChildren = true
            //         }
            //         //Disable the self folder with all children
            //         if (this.nodes.unique_id === curDragItem.parent_id) {
            //             disableFolder = true
            //             if (ismultiple > 1)
            //                 {
            //                     this.disableChildren = true
            //                 }
            //         }
            //         if (this.nodes.unique_id === curDragItem.unique_id & !this.status['sidebar']){
            //             disableFolder = true
            //         }
                        
            //         if(this.disabled) {
            //             this.disableChildren = true
            //         }
                   
            //     }else {
            //         disableFolder = false
            //         this.disableChildren = false
            //    }
            // return disableFolder
                return false
            },
            indent() {

                var offset = window.innerWidth <= 1024 ? 17 : 22;

                var value = this.depth == 0 ? offset : offset + (this.depth * 20);

                return {paddingLeft: value + 'px'}
            },
            isemptyfolder() {
                var itemcnt = this.nodes.items;
                if (itemcnt === 0) return true
                else return false
            },
        },
        data() {
            return {
                isVisible: false,
                isSelected: false,
                area:false,
                draggedItem: undefined,
                disableChildren:false,
                focusedParentIndex: 0,
                focusedNodes: undefined
            }
        },
        methods: {
            // Call this function when start to drag folder in UNDER-ROOT TreeMenu
            dragStart(item) {
                this.status['sidebar'] = true
                this.$store.commit('CLEAR_FILEINFO_DETAIL')
                this.$store.commit('SET_ITEM_TO_MOVE', item)
            },
            getParents(item){
                var parents = [item]
                let parent = this.treefolders.filter(element => element.unique_id === item.parent_id)
                if (parent.length > 0) {
                    parents.push(parent[0])
                    while (parent[0].parent_id !== 0) {
                        parent = this.treefolders.filter(element => element.unique_id === parent[0].parent_id)
                        if (parent.length > 0) parents.push(parent[0])
                    }
                }
                return parents
            },          
            // Call this function when finish to drag on folder in TreeMenu            
            dragFinish(evt) {
                this.area = false
                if (evt.dataTransfer.types.length === 1 && evt.dataTransfer.types[0] === 'text/plain') return

                
                if (evt.dataTransfer.types.length === 1 && evt.dataTransfer.types[0] === 'Files') {
                    this.$uploadExternalFiles(evt, this.nodes.unique_id)

                    this.$store.dispatch('getAppData')
                    for (let i = 0; i < evt.dataTransfer.files.length; i++) {
                        this.$store.commit('INCREASE_FOLDER_ITEM', this.nodes.unique_id)
                    }                                       
                    this.status['IsExternalUploadedToTreeMenu'] = true
                    return
                }

                if(this.curclickedItem !== undefined && !this.fileInfoDetail.includes(this.curclickedItem)) {
                    // If drop the folder in itself, return
                    if (this.curclickedItem.type === 'folder')
                        if (this.curclickedItem.unique_id === this.nodes.unique_id) {
                            this.draggedItem = undefined
                            this.area = false
                            this.$store.commit('CLEAR_ITEM_MOVED')
                            this.status['sidebar'] = false
                            return
                        }

                    var folder_id = this.curclickedItem.type === 'folder' ? this.curclickedItem.parent_id : this.curclickedItem.folder_id
                   
                    var children = this.getParents(this.nodes)
                    if (children.length > 0) {
                        var found = children.filter(item => item.unique_id === folder_id)
                        if (found.length > 0) {
                            return
                        }
                    }     

                    if (folder_id !== this.nodes.unique_id)
                       this.$store.dispatch('moveItem', {to_id: this.nodes.unique_id ,noSelectedItem:this.curclickedItem})
                    this.draggedItem = undefined
                }
                // Move all selected items
                // if(this.fileInfoDetail.includes(this.draggedItem)) {
                else {
                    var folder_id = this.fileInfoDetail[0].type == 'folder' ? this.fileInfoDetail[0].parent_id : this.fileInfoDetail[0].folder_id
                    folder_id = parseInt(folder_id)

                    var folders = this.fileInfoDetail.filter(element => element.type === 'folder')
                    if (folders.length > 0) {
                        for (let i = 0; i < folders.length; i++) {
                            var children = this.getParents(this.nodes)
                            if (children.length > 0) {
                                var found = children.filter(item => item.unique_id === folders[i].unique_id)
                                if (found.length > 0) {
                                    return
                                }
                            }                             
                        }
                    }

                    var itemself = this.fileInfoDetail.filter(element => element.unique_id === this.nodes.unique_id)
                    if (itemself.length > 0) return

                    if (this.nodes.unique_id === this.currentFolder.unique_id) return
                     
                    var checksame = this.fileInfoDetail.find(item => item.unique_id === this.nodes.unique_id)
                    if (folder_id !== this.nodes.unique_id && (checksame === undefined || checksame.length === 0))
                        this.$store.dispatch('moveItem', {to_id: this.nodes.unique_id ,noSelectedItem:null})
                    this.draggedItem = undefined
                }

                if (this.currentFolder.location !== 'public')
                    this.$store.dispatch('getAppData')
                if (this.currentFolder.location === 'public')
                    this.$store.dispatch('getFolderTree')
                
                this.$store.commit('CLEAR_ITEM_MOVED')
                this.status['sidebar'] = false
                // this.draggedItem = undefined
                
                // this.getFolder()
            },
            dragEnter() {
                this.area = true
                setTimeout(() => {
                    this.isVisible = true
                }, 500)
               
            },
            dragLeave() {
                this.area = false
            },
            getFolder() {
                window.location.hash = '#file-content-id'
                events.$emit('show-folder', this.nodes)

                // Go to folder
                if (this.$isThisLocation('public')) {
                    this.$store.dispatch('browseShared', [{ folder: this.nodes, back: false, init: false }])
                } else {
                    this.$store.dispatch('getFolder', [{ folder: this.nodes, back: false, init: false }])
                }
                document.getElementById('file-content-id').click()
            },
            showTree() {
                this.isVisible = !this.isVisible
            },
            contextMenu(event, item) {
                this.status['focusedParentFolderIndex'] = this.focusedParentIndex
                this.status['focusedNodes'] = this.focusedNodes
                events.$emit('contextMenu:show', event, item, true)
                this.focusedParentIndex = 0
                this.focusedNodes = undefined
                
                
            },
            focusFolder()
            {   
                this.focusedParentIndex = this.nodes.unique_id
                this.focusedNodes = this.nodes
                // alert(this.status['focusFolderID'])
            },
            noneFocusFolder()
            {
                // this.focusFolderID = -1
                // this.status['focusFolderID'] = -1
            },
            checkParent(folder){
                let parent = this.treefolders.filter(element => element.unique_id === folder.parent_id)
                if (parent[0].unique_id === this.nodes.unique_id) return parent[0]
                while (parent[0].parent_id !== 0) {
                    parent = this.treefolders.filter(element => element.unique_id === parent[0].parent_id)
                    if (parent.length > 0 && parent[0].unique_id === this.nodes.unique_id) return parent[0]
                }
                return false
            },
        },
        created() {
            this.status['sidebar'] = true
            // events.$on('drop' , () => {
            //     this.draggedItem = []
            // })

            //Get dragged item
            events.$on('dragstart' , (data, selectedItems) => {
               //If another one, other than the selected items, is selected
                if(!selectedItems.includes(data)) {
                    this.$store.commit('SET_ITEM_TO_MOVE', data)
                    this.$store.commit('CLEAR_FILEINFO_DETAIL')
                }
                //If one of the selected items is selected
                else {
                    this.draggedItem = data
                    this.$store.commit('CLEAR_ITEM_MOVED')
                }
            })

            // Select clicked folder
            events.$on('show-folder', node => {
                this.isSelected = false

                if (this.nodes.unique_id == node.unique_id)
                    this.isSelected = true
            })

            events.$on('leftMenu:show', (item, parents) => {                
                
                this.isSelected = false
                if (item === undefined) return

                if (parents !== undefined && parents.length > 0) {
                    var found = parents.filter(item => item.unique_id === this.nodes.unique_id)
                    if (found.length > 0) {
                        this.isVisible = true
                    }
                }
                                
                if (item.unique_id === this.nodes.unique_id) {
                    this.isSelected = true
                    // this.isVisible = true
                }
            })
        }
    }
</script>

<style lang="scss" scoped>
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .is-inactive {
        opacity: 0.5;
        pointer-events: none;
    }

    // .is-dragenter {
	// 		border: 2px dashed $theme !important;
	// 		border-radius: 8px;
	// 	}

    .folder-item {
        display: block;
        @include transition(150ms);
        cursor: pointer;
        position: relative;
        white-space: nowrap;
        width: 100%;

        .folder-item-info-wrap{
            display:inline-block;
            padding: 2px 5px 2px 0;        
            border: 2px dashed transparent ;

            .icon {
                line-height: 0;
                width: 15px;
                margin-right: 9px;
                vertical-align: middle;
                margin-top: -1px;

                path, line, polyline, rect, circle {
                    @include transition(150ms);
                }
            }
            .icon {
                stroke: $text;
                fill: none;
                path,
                line,
                polyline,
                rect,
                circle,
                ellipse {
                    stroke: $text;
                    fill: none;
                }
            }
            &:hover {
                background: rgba($theme, .1);
                .label {
                color: $theme;
                }
                .icon {
                    stroke: $dark_mode_text_primary;
                    fill: none;
                    path,
                    line,
                    polyline,
                    rect,
                    circle,
                    ellipse {
                        stroke: $theme;
                        fill: none;
                    }
                }
            }
        }
        .icon-arrow {
            @include transition(300ms);
            margin-right: 4px;
            vertical-align: middle;
            opacity: 0;

            &.is-visible {
                opacity: 1;
            }

            &.is-opened {
                @include transform(rotate(90deg));
            }
        }

        .label {
            @include transition(150ms);
            @include font-size(12);
            font-weight: normal;
            vertical-align: middle;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            color: $text;
            max-width: 130px;
        }

        &:hover,
        &.is-selected {

            .icon {
                path, line, polyline, rect, circle {
                    stroke: $theme;
                }
            }

            .label {
                color: $theme;
            }
        }
        &.is-dragenter{
            .folder-item-info-wrap{
                border: 2px dashed $theme !important;
        		border-radius: 4px;
            }
        }
    }

    @media only screen and (max-width: 1024px) {

        .folder-item {
            padding: 2px 0;
        }
    }

    // Dark mode
    @media (prefers-color-scheme: dark) {

        .folder-item {

            .label {
                color: $dark_mode_text_primary;
            }

            &:hover {
                background: rgba($theme, .1);
            }

            &.is-selected {
                background: rgba($theme, .1);
            }
        }

        &.is-selected {
            background: rgba($theme, .1);
        }
    }

    @media (prefers-color-scheme: dark) and (max-width: 690px) {
        .folder-item {

            &:hover,
            &.is-selected {
                background: rgba($theme, .1);
            }
        }
    }

</style>
