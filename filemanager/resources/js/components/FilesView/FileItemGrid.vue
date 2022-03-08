<template>
    <div class="file-wrapper" @click="clickedItem" @dblclick="goToItem" spellcheck="false">
        <!--Grid preview-->
        <div :draggable="canDrag" id="drag" @mousedown="onMouseDown" @dragstart="$emit('dragstart')" @drop="
				drop()
				area = false" @dragleave="dragLeave" @dragover.prevent="dragEnter" class="file-source" :class="{'is-clicked' : isClicked, 'no-clicked' : !isClicked && this.$isMobile(), 'is-dragenter': area, 'is-cutted' : isCutted }">
            <!--Thumbnail for source-->
            <div class="icon-source">

                <!-- MultiSelecting for the mobile version -->
                <div :class="{'check-select-folder' : isFolder, 'check-select' : this.source.type !== 'folder'}" v-if="multiSelectMode">
                    <div class="select-box" :class="{'select-box-active' : isClicked } ">
                        <CheckIcon v-if="isClicked" class="icon" size="17"/>
                    </div>
                </div>

                <!--If is file or image, then link source-->
                <!-- <span v-if="isFile || (isImage && !source.thumbnail)" class="file-icon-text">
                    {{ source.mimetype }}
                </span> -->

                <!-- <span v-if="isFile || (isImage && !source.thumbnail)" class="file-icon-text fileTypePlain"
                    v-bind:class="{
                        'fileTypeEps' : this.source.mimetype === 'postscript', 
                        'fileTypePsd' : this.source.mimetype === 'vnd.adobe.photoshop',
                        'fileTypeExe' : this.source.mimetype === 'x-dosexec',
                        'fileTypePptx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.presentationml.presentation',
                        'fileTypeXlsx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'fileTypeDocx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'fileTypePdf' : this.source.mimetype === 'pdf',
                        'fileTypeZip' : this.source.mimetype === 'zip',
                        'fileTypeHic' : this.source.mimetype === 'hic'
                        }"
                    > -->

                <span v-if="isFile || (isImage && !source.thumbnail)" class="file-icon-text fileTypePlain">

                    <div v-if="this.source.mimetype === 'postscript'" class="fileTypeIcon fileTypeEps">
                        <img class="icon" src="./images/illust.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'vnd.adobe.photoshop'" class="fileTypeIcon fileTypePsd">
                        <img class="icon" src="./images/photoshop.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'vnd.openxmlformats-officedocument.presentationml.presentation'" class="fileTypeIcon fileTypePptx">
                        <img class="icon" src="./images/msPowerPoint.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'" class="fileTypeIcon fileTypeXlsx">
                        <img class="icon" src="./images/msExcel.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'vnd.openxmlformats-officedocument.wordprocessingml.document'" class="fileTypeIcon fileTypeDocx">
                        <img class="icon" src="./images/msWord.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'pdf'" class="fileTypeIcon fileTypePdf">
                        <img class="icon" src="./images/acrobat.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'zip'" class="fileTypeIcon fileTypeZip">
                        <img class="icon" src="./images/zip.svg"/>
                    </div>
                    <div v-if="this.source.mimetype === 'hic'" class="fileTypeIcon fileTypeHic">
                        <img class="icon" src="./images/hiC.svg"/>
                    </div>    
                    <div v-if="this.source.mimetype === 'vnd.microsoft.icon'" class="fileTypeIcon fileTypeIco">

                    </div>       
                    <div v-if="this.source.mimetype === 'mp4'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div> 
                    <div v-if="this.source.mimetype === 'x-msvideo'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div> 
                    <div v-if="this.source.mimetype === 'quicktime'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div>                                                 
                    <div v-if="this.source.mimetype === 'webm'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/video.svg"/>
                    </div>                         
                    <div v-if="this.source.mimetype === 'mp3'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>    
                    <div v-if="this.source.mimetype === 'x-wav'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>       
                    <div v-if="this.source.mimetype === 'x-ms-asf'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>                 
                    <div v-if="this.source.mimetype === 'x-aiff'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>                                                      
                                                                            
                </span>                

                <!--Folder thumbnail-->
                <FontAwesomeIcon v-if="isFile || (isImage && !source.thumbnail)" class="file-icon" icon="file"
                v-bind:class="{
                        'fileTypeEps' : this.source.mimetype === 'postscript', 
                        'fileTypePsd' : this.source.mimetype === 'vnd.adobe.photoshop',
                        'fileTypeExe' : this.source.mimetype === 'x-dosexec',
                        'fileTypePptx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.presentationml.presentation',
                        'fileTypeXlsx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'fileTypeDocx' : this.source.mimetype === 'vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'fileTypePdf' : this.source.mimetype === 'pdf',
                        'fileTypeZip' : this.source.mimetype === 'zip',
                        'fileTypeHic' : this.source.mimetype === 'hic',
                        'fileTypeVideo' : this.source.mimetype === 'mp4' || this.source.mimetype === 'x-msvideo' || this.source.mimetype === 'quicktime' || this.source.mimetype === 'webm',
                        'fileTypeAudio' : this.source.mimetype === 'mp3' || this.source.mimetype === 'x-wav' || this.source.mimetype === 'x-ms-asf' || this.source.mimetype === 'x-aiff' 
                        }"
                />

                <!--Image thumbnail-->
                <img loading="lazy" v-if="isImage && source.thumbnail" class="image" :style="{width: thumbnailwidth}" :src="source.thumbnail" :alt="source.name"/>
                
                 <!--Else show only folder icon-->
                <FolderIcon v-if="isFolder" :item="source" location="file-source-grid" class="folder"/>
            </div>

            <!--Name-->
            <div class="source-name">
                <!--Name-->
                <input :ref="source.unique_id" 
                    :id="itemid"
                    v-model="itemName" 
                    @input="renameItem" 
                    @keydown.delete.stop 
                    @keydown.enter="endRename" 
                    @click.stop 
                    @focus="onFocus"
                    v-on:blur="lostNameFocus"
                    class="name"
                    allow="clipboard-read; clipboard-write"
                    style="border: none; text-align: center; width: 100%; background: transparent;">
                <div class="source-info">

                    <!--Shared Icon-->
                    <div v-if="$checkPermission('master') && source.shared" class="source-shared">
                        <link-icon size="12" class="shared-icon"></link-icon>
                    </div>

                    <!--Participant owner Icon-->
                    <div v-if="$checkPermission('master') && source.user_scope !== 'master'" class="source-shared">
                        <user-plus-icon size="12" class="shared-icon"></user-plus-icon>
                    </div>

                    <!--Filesize-->
                    <span v-if="! isFolder" class="source-size">{{ source.filesize }}</span>

                    <!--Folder source counts-->
                    <span v-if="isFolder" class="source-length">
                        {{ folderItems == 0 ? $t('folder.empty') : $tc('folder.item_counts', folderItems) }}
				    </span>
                </div>
            </div>

            <span @mousedown.stop="showItemActions" class="show-actions" v-if="$isMobile() && ! multiSelectMode && canShowMobileOptions">
                <FontAwesomeIcon icon="ellipsis-h" class="icon-action"></FontAwesomeIcon>
            </span>
        </div>
    </div>
</template>

<script>
import { LinkIcon, UserPlusIcon, CheckIcon } from 'vue-feather-icons'
import FolderIcon from '@/components/FilesView/FolderIcon'
import { debounce } from 'lodash'
import { mapGetters } from 'vuex'
import { events } from '@/bus'

export default {
    name: 'FileItemGrid',
    props: { 
    source: {
      type: Object,
      default() {
        return {}
      }
    }},
    components: {
        UserPlusIcon,
        CheckIcon,
        LinkIcon,
        FolderIcon
    },
    computed: {
        ...mapGetters([
            'FilePreviewType', 
            'sharedDetail', 
            'fileInfoDetail', 
            'copyOrCutInfo', 
            'clipBoard', 
            'fileInfoPreview', 
            'data', 
            'status',
            'focusNameID', 
            'treefolders',
            'currentFolder'
        ]),
        itemid() {
            return 'itemid' + this.source.unique_id
        },
         folderEmojiOrColor(){

             // If folder have set some color
            if(this.source.icon_color) {
                 this.$nextTick(() => {
                    this.$refs[`folder${this.source.unique_id}`].firstElementChild.style.fill = `${this.source.icon_color}`
                })
                return false
            }
               
            // If folder have set some emoji
            if(this.source.icon_emoji)
                return this.source.icon_emoji

        },
        isClicked() {
            return this.fileInfoDetail.some(element => element.unique_id == this.source.unique_id) || (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] === this.source)
        },
        isCutted(){
            return this.copyOrCutInfo  && this.clipBoard.some(element => element.unique_id == this.source.unique_id)
        },
        temp() {
            return this.isClickedItem
        },
        isFolder() {
            return this.source.type === 'folder'
        },
        isFile() {
            return this.source.type !== 'folder' && this.source.type !== 'image'
        },
        isPdf() {
            return this.source.mimetype === 'pdf'
        },
        isImage() {
            return this.source.type === 'image'
        },
        isVideo() {
            return this.source.type === 'video'
        },
        isAudio() {
            let mimetypes = ['mpeg', 'mp3', 'mp4', 'wan', 'flac']
            return mimetypes.includes(this.source.mimetype) && this.source.type === 'audio'
        },
        //hiCreo
        isHic() {
            return this.source.mimetype === 'hic' && this.source.type === 'file'
        },
        canEditName() {
            return !this.$isMobile()
                && !this.$isThisLocation(['trash', 'trash-root'])
                && !this.$checkPermission('visitor')
                && !(this.sharedDetail && this.sharedDetail.type === 'file')
        },
        canShowMobileOptions() {
            return !(this.sharedDetail && this.sharedDetail.type === 'file')
        },
        canDrag() {
            return !this.isDeleted && this.$checkPermission(['master', 'editor'])
        },
        timeStamp() {
            return this.source.deleted_at ? this.$t('item_thumbnail.deleted_at', this.source.deleted_at) : this.source.created_at
        },
        folderItems() {
            return this.source.deleted_at ? this.source.trashed_items : this.source.items
        },
        isDeleted() {
            return this.source.deleted_at ? true : false
        },
        thumbnailwidth() {
            if (this.isImage) {
                var width = parseInt(this.source.width)
                var height = parseInt(this.source.height)   
                if (Math.max(width, height) > 80) {
                    if (Math.max(width, height) === width) {
                        return width + 'px'
                    }
                    else if (Math.max(width, height) === height) {
                        return width * 80 / height + 'px'
                    }
                }
                return width + 'px'
            }
        
            return '80px';
        },
    },
    watch: {
        itemName() {
            // this.itemName = this.itemName.replace(/[^a-z]/gi, '');
        }
    },
    data() {
        return {
            area: false,
            itemName: undefined,
            multiSelectMode: false,
            originalName : undefined
        }
    },
    methods: {
        onMouseDown() {
            this.$store.commit('SET_ITEM_TO_MOVE', this.source)
            events.$emit('unClick')
        },
        drop() {
            // events.$emit('drop')
        },
        showItemActions() {
            // Load file info detail
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
            this.$store.commit('GET_FILEINFO_DETAIL', this.source)

            events.$emit('mobileMenu:show')
        },
        dragEnter() {
            if (this.source.type !== 'folder') return

            this.area = true
        },
        dragLeave() {
            this.area = false
        },
        getParents(item){
            var parents = []
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
        clickedItem(e) {
            // Disabled right click
            if (e.button === 2) return

            if (!this.$isMobile()) {

                // After click deselect new folder rename input
                document.getSelection().removeAllRanges();
                
                if (e.ctrlKey && !e.shiftKey && !e.metaKey) {
                    // Click + Ctrl
                    if (this.fileInfoDetail.find(source => source.unique_id === this.source.unique_id)) {
                        this.$store.commit('REMOVE_ITEM_FILEINFO_DETAIL', this.source)
                    } else {
                        this.$store.commit('GET_FILEINFO_DETAIL', this.source)
                    }
                } else if (e.shiftKey) {
                    // Click + Shift
                    if (this.fileInfoDetail.length < 1)
                        return
                    let beginItemIndex = this.data.indexOf(this.fileInfoDetail[0])
                    let clickedItemIndex = this.data.indexOf(this.source)

                    console.log('clickedItem Shift')
                    this.$store.commit('CLEAR_FILEINFO_DETAIL')

                    //Shift selecting from top to bottom
                    if (beginItemIndex < clickedItemIndex) {
                        for (let i = beginItemIndex; i <= clickedItemIndex; i++) {
                            this.$store.commit('GET_FILEINFO_DETAIL', this.data[i])
                        }
                        //Shift selecting from bottom to top
                    } else {
                        for (let i = beginItemIndex; i >= clickedItemIndex; i--) {
                            this.$store.commit('GET_FILEINFO_DETAIL', this.data[i])
                        }
                    }
                } else {

                    // if first clicked
                    //console.log('clickedItem ', this.source)
                    this.$store.commit('CLEAR_FILEINFO_DETAIL')
                    this.$store.commit('GET_FILEINFO_DETAIL', this.source)

                    if (this.fileInfoPreview.length === 0)
                    {
                        // this.$store.commit('SET_FILEINFO_PREV', this.source)
                    }
                    else if (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] != this.source)
                    {
                        // If another source has been selected after once-clicked, replace that source with the first-clicked source
                        this.$store.commit('CLEAR_FILEINFO_PREV')
                        this.$store.commit('SET_FILEINFO_PREV', this.source)
                    }
                    else if (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] === this.source) {
                        // Show the preview dialog for the selected media source (image, video and audio)
                        // this.$store.commit('SET_FILEINFO_PREV', this.source)
                        // this.status['IS_SHOW_PREVIEW'] = true
                        console.log("passed preview by click of source twice")
                    }
                    else{
                        this.$store.commit('CLEAR_FILEINFO_PREV')
                    }
                    
                }
            }

            if (!this.mobileMultiSelect && this.$isMobile()) {

                if (this.isFolder) {

                    if (this.$isThisLocation('public')) {
                        this.$store.dispatch('browseShared', [{ folder: this.source, back: false, init: false }])
                    } else {
                        this.$store.dispatch('getFolder', [{ folder: this.source, back: false, init: false }])
                    }
                } else {

                    if (this.isImage || this.isVideo || this.isAudio || this.isPdf) {
                        this.$store.commit('LOAD_FILEINFO_DETAIL', this.source)
                        events.$emit('fileFullPreview:show')
                    }
                }
            }

            if (this.multiSelectMode && this.$isMobile()) {
                if (this.fileInfoDetail.some(source => source.unique_id === this.source.unique_id)) {
                    this.$store.commit('REMOVE_ITEM_FLEINFO_DETAIL', this.source)
                } else {I
                    this.$store.commit('GET_FILEINFO_DETAIL', this.source)
                }
            }
            // Get target classname
            let itemClass = e.target.className

            if (
                ['name', 'icon', 'file-link', 'file-icon-text'].includes(
                    itemClass
                )
            )
            return
        },
        showPreview(){
            if (this.isImage || this.isVideo || this.isAudio || this.isHic)
            {
                this.$store.commit('CLEAR_FILEINFO_DETAIL')
                this.$store.commit('GET_FILEINFO_DETAIL', this.source)
            }
        },
        goToItem() {
            //hiCreo
            if(this.currentFolder.location === 'trash-root') return

            if (this.isImage || this.isVideo || this.isAudio || this.isHic) {
                this.$store.commit('CLEAR_FILEINFO_PREV')
                this.$store.commit('SET_FILEINFO_PREV', this.source)
                this.$store.commit('SET_FILEINFO_PREV', this.source)
                this.status['IS_SHOW_PREVIEW'] = true
                
                events.$emit('popup:open', {name: 'fileinfo-preview'})
            } else if (this.isFile || !this.isFolder && !this.isVideo && !this.isAudio && !this.isImage) {
                if (this.isPdf) {
                    window.open('assets/' + this.source.basename, '_blank')
                }
                else
                    this.$downloadFile(this.source.file_url, this.source.name + '.' + this.source.mimetype)
            } else if (this.isFolder) {
                //Clear selected data after open another folder
                this.$store.commit('CLEAR_FILEINFO_DETAIL')

                if (this.$isThisLocation('public')) {
                    this.$store.dispatch('browseShared', [{ folder: this.source, back: false, init: false }])
                } else {
                    this.$store.dispatch('getFolder', [{ folder: this.source, back: false, init: false }])
                }

                var parents = this.getParents(this.source)
                for (let i = 0; i < parents.length + 1 ; i++) {
                    setTimeout(() => {
                        events.$emit('leftMenu:show', this.source, parents)
                    }, i * 10)
                }                
            }
        },
        endRename(e){
            if (this.itemName === '') {
                this.itemName = this.originalName
            }
            this.$store.dispatch('renameItem', {
                unique_id: this.source.unique_id,
                type: this.source.type,
                name: this.itemName
            })            
            window.getSelection().removeAllRanges();
            this.$store.commit('SET_FOCUS_NAMETAG', false)
        },
        onFocus(e) {
            var id = this.itemid
            var input = document.getElementById(id)            
            var closest = input.closest("#drag");
            closest.setAttribute('draggable', false)

            this.$store.commit('SET_FOCUS_NAME_ID', this.source.unique_id)
            this.$store.commit('SET_FOCUS_NAMETAG', true)
            this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)
        },
        lostNameFocus(e) {
            var id = this.itemid
            var input = document.getElementById(id)            
            var closest = input.closest("#drag");
            closest.setAttribute('draggable', true)

            if (this.itemName === '') {
                this.itemName = this.originalName
            }
            this.$store.dispatch('renameItem', {
                unique_id: this.source.unique_id,
                type: this.source.type,
                name: this.itemName
            })  
            this.$store.commit('SET_FOCUS_NAMETAG', false)       
        },
        renameItem: debounce(function(e) {
            this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)
        }, 300),
        doSetCaretPosition (oField, iCaretPos) {

            // IE Support
            if (document.selection) { 

                // Set focus on the element
                oField.focus ();
            
                // Create empty selection range
                var oSel = document.selection.createRange ();
            
                // Move selection start and end to 0 position
                oSel.moveStart ('character', -oField.value.length);
            
                // Move selection start and end to desired position
                oSel.moveStart ('character', iCaretPos);
                oSel.moveEnd ('character', 0);
                oSel.select ();
            }

            // Firefox support
            else if (oField.selectionStart || oField.selectionStart == '0') {
                oField.selectionStart = iCaretPos;
                oField.selectionEnd = iCaretPos;
                oField.focus ();
            }
        },
    },
    created() {
        this.itemName = this.source.name
        this.originalName = this.source.name
         events.$on('newFolder:focus', (unique_id) => {

            if(this.source.unique_id == unique_id && !this.$isMobile()) {
                this.$refs[unique_id].focus()
                document.execCommand('selectAll')
            }
        })

        events.$on('mobileSelecting:start', () => {
            this.multiSelectMode = true
            console.log('mobileSelecting:start')
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
        })

        events.$on('mobileSelecting:stop', () => {
            this.multiSelectMode = false
            console.log('mobileSelecting:stop')
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
        })
        // Change source name
        events.$on('change:name', (source) => {
            if (this.source.unique_id == source.unique_id) {
                this.itemName = source.name
                this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)
            }
        })
    },
    mounted() {
        events.$on('nametag:copy', (text, caretPos) => {
            if (this.source.unique_id === this.focusNameID) {
                this.itemName = text
                this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)

                var input = document.getElementById(this.itemid)
                this.$nextTick(() => {
                    this.doSetCaretPosition(input, caretPos)
                })
            }
        })

        events.$on('nametag:cut', (text, caretPos) => {
            if (this.source.unique_id === this.focusNameID) {
                this.itemName = this.itemName.replace(text, '')
                this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)

                var input = document.getElementById(this.itemid)
                this.$nextTick(() => {
                    this.doSetCaretPosition(input, caretPos)
                })                
            }         
        })
    }
}
</script>

<style scoped lang="scss">
@import '@assets/vue-file-manager/_variables';
@import '@assets/vue-file-manager/_mixins';

.check-select {
    margin-right: 10px;
    margin-left: 3px;
    position: absolute;
    top: -10px;
    z-index: 5;
    left: 0px;
}

.check-select-folder {
    margin-right: 10px;
    margin-left: 3px;
    position: absolute;
    top: 8px;
    z-index: 5;
    left: 10px;
}

.select-box {
    width: 20px;
    height: 20px;
    background-color: $light_background;
    display: flex;
    justify-content: center;
    align-items: center;
    // border-radius: 5px;
    border-radius: 0px;
    box-shadow: 0 3px 15px 2px hsla(220, 36%, 16%, 0.05);
}

.select-box-active {
    background-color: $theme;

    .icon {
        stroke: white;
    }
}


.show-actions {
    cursor: pointer;
    padding: 4px 26px;

    .icon-action {
        @include font-size(12);
    }

    path {
        fill: $theme;
    }
}

.file-wrapper {
    user-select: none;
    position: relative;
    text-align: center;
    display: inline-block;
    vertical-align: text-top;
    width: 100%;
    margin:5px 0;

    .source-name {
        display: block;
        padding-left: 10px;
        padding-right: 10px;
        line-height: 20px;

        .source-size,
        .source-length {
            @include font-size(11);
            font-weight: 400;
            color: rgba($text, 0.7);
            display: inline-block;
        }

        .source-info {
            display: block;
            line-height: 1;
        }

        .source-shared {
            display: inline-block;

            .label {
                @include font-size(12);
                font-weight: 400;
                color: $theme;
            }

            .shared-icon {
                vertical-align: middle;

                path, circle, line {
                    stroke: $theme;
                }
            }
        }

        .name {
            color: $text;
            @include font-size(12);
            font-weight: normal;
            // max-height: 40px;
            // overflow: hidden;
            // text-overflow: ellipsis;
            // word-break: break-all;

            text-overflow: ellipsis;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            white-space: normal;
            max-height: none;

            &[contenteditable] {
                -webkit-user-select: text;
                user-select: text;
            }

            &[contenteditable='true']:hover {
                text-decoration: underline;
            }

            &.actived {
                max-height: initial;
            }
        }
    }

    &.selected {
        .file-source {
            background: $light_background;
        }
    }

    .file-source {
        border: 2px dashed transparent;
        width: 140px;
        margin: 2px auto;
        cursor: pointer;
        position: relative;
        padding: 10px 0;
        border: 1px solid transparent;

        &.is-dragenter {
            border: 2px dashed $theme;
            // border-radius: 8px;
            border-radius: 0px;
        }

        &.is-cutted {
            opacity: 50%;
        }

        &.no-clicked {
            background: white !important;
            border: 1px solid transparent;
            .source-name {
                .name {
                    color: $text !important;
                }
            }
        }

        &:hover,
        &.is-clicked {
            // border-radius: 8px;
            border-radius: 0px;
            //  background: rgba(230, 122, 122, 1);
            background: $selected_background;
            border: 1px solid #99d1ff;
        }
    }

    .icon-source {
        text-align: center;
        position: relative;
        height: 80px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;


        .file-link {
            display: block;
        }

        .file-icon {
            @include font-size(100);
            margin: 0 auto;

            &.fileTypeEps, &.fileTypePdf, &.fileTypePsd, &.fileTypePptx, &.fileTypeHic, &.fileTypeXlsx, &.fileTypeHic, &.fileTypeDocx, &.fileTypeVideo, &.fileTypeAudio
            {//background file image - hide
                display:none;
            }
            &.fileTypeZip{
                path {
                    fill: #fafafc;
                    // stroke: #dfe0e8;
                    stroke: #ccc;
                    stroke-width: 1px;
                }
            }           
            path {
                fill: #fafafc;
                // stroke: #dfe0e8;
                stroke: #ccc;
                stroke-width: 1;
            }
        }

        .file-icon-text {
            margin: 5px auto 0;
            position: absolute;
            text-align: center;
            left: 0;
            right: 0;
            color: $theme;
            @include font-size(12);
            font-weight: 600;
            user-select: none;
            max-width: 120px;
            max-height: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &.fileTypePlain{
                
                &:after{
                    content:'FILE';
                    font-size:12px;
                }

                .fileTypeIcon{
                    width:120px;
                    height:120px;
                    position:relative;
                    
                    &.fileTypeZip{
                        &:after{
                            content:'ZIP';
                            font-size:12px;
                            margin-top:50px;
                            position:absolute;
                            margin-left:-8px;
                        }
                    }
                    &.fileTypeIco{
                        &:after{
                            content:'ICO';
                            font-size:12px;
                            margin-top:50px;
                            position:absolute;
                            margin-left:-10px;
                        }
                    }
                    .icon{
                        width:120px;
                        height:120px;
                        position:absolute;
                        top:0px;
                        left:0px;

                    }    
                }                                         
            }
        }

        .image {
            max-width: 95%;
            object-fit: contain;
            user-select: none;
            height: 80px;
            // border-radius: 5px;
            border-radius: 0px;
            margin: 0 auto;
            pointer-events: none;
        }

        .folder {
            width: 80px;
            height: 80px;
            margin: auto;

            /deep/ .folder-icon {
                @include font-size(80)
            }
        }
    }
}

@media only screen and (max-width: 960px) {

    .file-wrapper {

        .icon-source {
            margin-bottom: 15px;

            &.is-cutted {
                opacity: 50%;
            }
        }
    }
}

@media only screen and (max-width: 690px) {
    .file-wrapper {

        .file-source {
            width: 120px;

            &.is-cutted {
                opacity: 50%;
            }
        }

        .icon-source {
            margin-bottom: 10px;
            height: 90px;

            .file-icon {
                @include font-size(75);
            }

            .file-icon-text {
                @include font-size(12);
            }
            

            .folder {
                width: 75px;
                height: 75px;
                margin-top: 0;
                margin-bottom: 0;

                /deep/ .folder-icon {
                    @include font-size(75)
                }                
            }

            .image {
                width: 90px;
                height: 90px;
            }
        }

        .source-name .name {
            @include font-size(13);
            line-height: .9;
            max-height: 30px;
        }
    }
}

@media (prefers-color-scheme: dark) {

    .select-box {
        background-color: lighten($dark_mode_foreground, 10%);
    }

    .select-box-active {
        background-color: lighten($theme, 5%);

        .icon {
            stroke: white;
        }
    }

    .file-wrapper {

        .icon-source {

            .file-icon {

                path {
                    fill: $dark_mode_foreground;
                    stroke: #2F3C54;
                }
            }
        }

        .file-source {
            &.no-clicked {
                background: $dark_mode_background !important;

                .file-icon {

                    path {
                        fill: $dark_mode_foreground !important;
                        stroke: #2F3C54;
                    }
                }

                .source-name {

                    .name {
                        color: $dark_mode_text_primary !important;
                    }
                }
            }
            &.is-cutted {
                opacity: 50%;
            }

            &:hover,
            &.is-clicked {
                background: $dark_mode_foreground;

                .file-icon {

                    path {
                        fill: $dark_mode_background;
                    }
                }
            }
        }

        .source-name {

            .name {
                color: $dark_mode_text_primary;
            }

            .source-size,
            .source-length {
                color: $dark_mode_text_secondary;
            }
        }

    }
}


</style>
