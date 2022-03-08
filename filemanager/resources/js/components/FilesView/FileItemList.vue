<template>
    <div class="file-wrapper" @mousedown="onMouseDown" @click="clickedItem" @dblclick="goToItem" spellcheck="false">
        <!--List preview-->
        <div
            :draggable="canDrag"
            id="drag"
            @dragstart="$emit('dragstart')"
            @drop="drop()"
            @dragleave="dragLeave"
            @dragover.prevent="dragEnter"
            class="file-item" :class="{'is-clicked': isClicked, 'no-clicked' : !isClicked && this.$isMobile(), 'is-dragenter': area, 'is-cutted' : isCutted }"
        >
            <!-- MultiSelecting for the mobile version -->
            <transition name="slide-from-left">
                <div class="check-select" v-if="mobileMultiSelect">
                    <div class="select-box" :class="{'select-box-active' : isClicked } ">
                        <CheckIcon v-if="isClicked" class="icon" size="17"/>
                    </div>
                </div>
            </transition>

            <!--Thumbnail for item-->
            <div class="icon-item">
                <!--If is file or image, then link item-->
                <!-- <span v-if="isFile || (isImage && !item.thumbnail)" class="file-icon-text">
                    {{ item.mimetype | limitCharacters }}
                </span> -->
                <span v-if="isFile || (isImage && !item.thumbnail)" class="file-icon-text fileTypePlain">

                    <div v-if="this.item.mimetype === 'postscript'" class="fileTypeIcon fileTypeEps">
                        <img class="icon" src="./images/illust.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'vnd.adobe.photoshop'" class="fileTypeIcon fileTypePsd">
                        <img class="icon" src="./images/photoshop.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'vnd.openxmlformats-officedocument.presentationml.presentation'" class="fileTypeIcon fileTypePptx">
                        <img class="icon" src="./images/msPowerPoint.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'" class="fileTypeIcon fileTypeXlsx">
                        <img class="icon" src="./images/msExcel.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'vnd.openxmlformats-officedocument.wordprocessingml.document'" class="fileTypeIcon fileTypeDocx">
                        <img class="icon" src="./images/msWord.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'pdf'" class="fileTypeIcon fileTypePdf">
                        <img class="icon" src="./images/acrobat.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'zip'" class="fileTypeIcon fileTypeZip">
                        <img class="icon" src="./images/zip.svg"/>
                    </div>
                    <div v-if="this.item.mimetype === 'hic'" class="fileTypeIcon fileTypeHic">
                        <img class="icon" src="./images/hiC.svg"/>
                    </div>    
                    <div v-if="this.item.mimetype === 'vnd.microsoft.icon'" class="fileTypeIcon fileTypeIco">

                    </div>       
                    <div v-if="this.item.mimetype === 'mp4'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div> 
                    <div v-if="this.item.mimetype === 'x-msvideo'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div> 
                    <div v-if="this.item.mimetype === 'quicktime'" class="fileTypeIcon fileTypeVideo">
                        <img class="icon" src="./images/video.svg"/>
                    </div>                                                 
                    <div v-if="this.item.mimetype === 'webm'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/video.svg"/>
                    </div>                         
                    <div v-if="this.item.mimetype === 'mp3'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>    
                    <div v-if="this.item.mimetype === 'x-wav'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>       
                    <div v-if="this.item.mimetype === 'x-ms-asf'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>                 
                    <div v-if="this.item.mimetype === 'x-aiff'" class="fileTypeIcon fileTypeAudio">
                        <img class="icon" src="./images/audio.svg"/>
                    </div>                                                      
                                                                            
                </span>     
                <!--Folder thumbnail-->
                <FontAwesomeIcon v-if="isFile || (isImage && !item.thumbnail)" class="file-icon" icon="file"
                    v-bind:class="{
                        'fileTypeEps' : this.item.mimetype === 'postscript', 
                        'fileTypePsd' : this.item.mimetype === 'vnd.adobe.photoshop',
                        'fileTypeExe' : this.item.mimetype === 'x-dosexec',
                        'fileTypePptx' : this.item.mimetype === 'vnd.openxmlformats-officedocument.presentationml.presentation',
                        'fileTypeXlsx' : this.item.mimetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'fileTypeDocx' : this.item.mimetype === 'vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'fileTypePdf' : this.item.mimetype === 'pdf',
                        'fileTypeZip' : this.item.mimetype === 'zip',
                        'fileTypeHic' : this.item.mimetype === 'hic',
                        'fileTypeVideo' : this.item.mimetype === 'mp4' || this.item.mimetype === 'x-msvideo' || this.item.mimetype === 'quicktime' || this.item.mimetype === 'webm',
                        'fileTypeAudio' : this.item.mimetype === 'mp3' || this.item.mimetype === 'x-wav' || this.item.mimetype === 'x-ms-asf' || this.item.mimetype === 'x-aiff' 
                        }"
                />

                <!--Image thumbnail-->
                <img loading="lazy" v-if="isImage && item.thumbnail" class="image" :style="{width: thumbnailwidth}" style="height: auto;" :src="item.thumbnail" :alt="item.name"/>
                
                 <!--Else show only folder icon-->
                <FolderIcon v-if="isFolder" :item="item" location="file-item-list" class="folder" />
            </div>

            <!--Name-->
            <div class="item-name">
                <!--Name-->
                <input :ref="item.unique_id" 
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
                    style="border: none; width: 100%; background: transparent;">
                
                <div class="item-info">
                    <!--Shared Icon-->
                    <div v-if="$checkPermission('master') && item.shared" class="item-shared">
                        <link-icon size="12" class="shared-icon"></link-icon>
                    </div>

                    <!--Participant owner Icon-->
                    <div v-if="$checkPermission('master') && item.user_scope !== 'master'" class="item-shared">
                        <user-plus-icon size="12" class="shared-icon"></user-plus-icon>
                    </div>

                    <!--Filesize and timestamp-->
                    <span v-if="!isFolder" class="item-size">{{ item.filesize }}, {{ timeStamp }}</span>

                    <!--Folder item counts-->
                    <span v-if="isFolder" class="item-length"> {{ folderItems == 0 ? $t('folder.empty') : $tc('folder.item_counts', folderItems) }}, {{ timeStamp }} </span>
                </div>
            </div>

            <!--Show item actions-->
            <transition name="slide-from-right">
                <div class="actions" v-if="$isMobile() && ! mobileMultiSelect">
                    <span @mousedown.stop="showItemActions" class="show-actions">
                        <FontAwesomeIcon icon="ellipsis-v" class="icon-action"></FontAwesomeIcon>
                    </span>
                </div>
            </transition>
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
    name: 'FileItemList',
    props: ['item'],
    components: {
        UserPlusIcon,
        LinkIcon,
        FolderIcon,
        CheckIcon,
    },
    computed: {
        ...mapGetters([
            'FilePreviewType', 
            'fileInfoDetail', 
            'fileInfoPreview',  
            'copyOrCutInfo', 
            'clipBoard',  
            'data', 
            'status',
            'focusNameID', 
            'treefolders',
            'currentFolder']),
        isClicked() {
            return this.fileInfoDetail.some(element => element.unique_id == this.item.unique_id) || (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] === this.item)
        },
        itemid() {
            return 'itemid' + this.item.unique_id
        },        
        isCutted(){
            return this.copyOrCutInfo  && this.clipBoard.some(element => element.unique_id == this.item.unique_id)
        },
        isFolder() {
            return this.item.type === 'folder'
        },
        isFile() {
            return this.item.type !== 'folder' && this.item.type !== 'image'
        },
        isImage() {
            return this.item.type === 'image'
        },
        isPdf() {
            return this.item.mimetype === 'pdf'
        },
        isVideo() {
            return this.item.type === 'video'
        },
        isAudio() {
            let mimetypes = ['mpeg', 'mp3', 'mp4', 'wan', 'flac']
            return mimetypes.includes(this.item.mimetype) && this.item.type === 'audio'
        },
        //hiCreo
        isHic() {
            return this.item.mimetype === 'hic' && this.item.type === 'file'
        },
        canEditName() {
            return !this.$isMobile() && !this.$isThisLocation(['trash', 'trash-root']) && !this.$checkPermission('visitor') && !(this.sharedDetail && this.sharedDetail.type === 'file')
        },
        canDrag() {
            return !this.isDeleted && this.$checkPermission(['master', 'editor'])
        },
        timeStamp() {
            return this.item.deleted_at ? this.$t('item_thumbnail.deleted_at', { time: this.item.deleted_at }) : this.item.created_at
        },
        folderItems() {
            return this.item.deleted_at ? this.item.trashed_items : this.item.items
        },
        isDeleted() {
            return this.item.deleted_at ? true : false
        },
        thumbnailwidth() {
            if (this.isImage) {
                var width = parseInt(this.item.width)
                var height = parseInt(this.item.height)   
                if (Math.max(width, height) > 50) {
                    if (Math.max(width, height) === width) {
                        return width + 'px'
                    }
                    else if (Math.max(width, height) === height) {
                        return width * 50 / height + 'px'
                    }
                }
                return width + 'px'
            }
        
            return '50px';
        },              
    },
    filters: {
        limitCharacters(str) {
            if (str.length > 3) {
                return str.substring(0, 3) + '...'
            } else {
                return str.substring(0, 3)
            }
        }
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
            mobileMultiSelect: false,
            originalName: undefined
        }
    },
    methods: {
        onMouseDown() {
            events.$emit('unClick')
        },
        drop() {
            this.area = false
            events.$emit('drop')
        },
        showItemActions() {
            // Load file info detail
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
            this.$store.commit('GET_FILEINFO_DETAIL', this.item)

            events.$emit('mobileMenu:show')
        },
        dragEnter() {
            if (this.item.type !== 'folder') return

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

                // console.log(this.item.mimetype);

                // After click deselect new folder rename input
                document.getSelection().removeAllRanges();

                if (e.ctrlKey && !e.shiftKey && !e.metaKey) {
                    // Click + Ctrl
                    if (this.fileInfoDetail.find(item => item.unique_id === this.item.unique_id)) {
                        this.$store.commit('REMOVE_ITEM_FILEINFO_DETAIL', this.item)
                    } else {
                        this.$store.commit('GET_FILEINFO_DETAIL', this.item)
                    }
                } else if (e.shiftKey) {
                    // Click + Shift
                    if (this.fileInfoDetail.length < 1)
                        return
                    let beginItemIndex = this.data.indexOf(this.fileInfoDetail[0])
                    let clickedItemIndex = this.data.indexOf(this.item)

                    // If Click + Shift + Ctrl dont remove already selected items
                    // if (!e.ctrlKey && !e.metaKey) {
                    //     this.$store.commit('CLEAR_FILEINFO_DETAIL')
                    // }

                    // remove all items already clicked
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
                    this.$store.commit('CLEAR_FILEINFO_DETAIL')
                    this.$store.commit('GET_FILEINFO_DETAIL', this.item)

                    // if first clicked
                    if (this.fileInfoPreview.length === 0)
                    {
                        this.$store.commit('SET_FILEINFO_PREV', this.item)
                    }
                        
                    else if (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] != this.item)
                    {
                        this.$store.commit('CLEAR_FILEINFO_PREV')
                        this.$store.commit('SET_FILEINFO_PREV', this.item)
                    }
                    else if (this.fileInfoPreview.length === 1 && this.fileInfoPreview[0] === this.item){
                        // Show the preview dialog for the selected media item (image, video and audio)
                        // this.$store.commit('SET_FILEINFO_PREV', this.item)
                        // this.status['IS_SHOW_PREVIEW'] = true
                        console.log("passed preview by click of item twice")
                    }
                        
                    else{
                        this.$store.commit('CLEAR_FILEINFO_PREV')
                    }
                }
            }

            if (!this.mobileMultiSelect && this.$isMobile()) {

                if (this.isFolder) {

                    if (this.$isThisLocation('public')) {
                        this.$store.dispatch('browseShared', [{ folder: this.item, back: false, init: false }])
                    } else {
                        this.$store.dispatch('getFolder', [{ folder: this.item, back: false, init: false }])
                    }
                } else {

                    if (this.isImage || this.isVideo || this.isAudio || this.isPdf) {
                        this.$store.commit('LOAD_FILEINFO_DETAIL', this.item)
                        events.$emit('fileFullPreview:show')
                    }
                }
            }

            if (this.mobileMultiSelect && this.$isMobile()) {
                if (this.fileInfoDetail.some(item => item.unique_id === this.item.unique_id)) {
                    this.$store.commit('REMOVE_ITEM_FILEINFO_DETAIL', this.item)
                } else {
                    this.$store.commit('GET_FILEINFO_DETAIL', this.item)
                }
            }

            // Get target classname
            let itemClass = e.target.className

            if (['name', 'icon', 'file-link', 'file-icon-text'].includes(itemClass)) return
        },
        goToItem() {
            //hiCreo
            if(this.currentFolder.location === 'trash-root') return

            if (this.isImage || this.isVideo || this.isAudio || this.isHic) {
                this.$store.commit('CLEAR_FILEINFO_PREV')
                this.$store.commit('SET_FILEINFO_PREV', this.item)
                this.$store.commit('SET_FILEINFO_PREV', this.item)
                this.status['IS_SHOW_PREVIEW'] = true
                events.$emit('popup:open', {name: 'fileinfo-preview'})
            } else if (this.isFile || !this.isFolder && !this.isVideo && !this.isAudio && !this.isImage) {
                if (this.isPdf) {
                    window.open('assets/' + this.item.basename, '_blank')
                }
                else
                    this.$downloadFile(this.item.file_url, this.item.name + '.' + this.item.mimetype)                

            } else if (this.isFolder) {

                //Clear selected items after open another folder
                this.$store.commit('CLEAR_FILEINFO_DETAIL')

                if (this.$isThisLocation('public')) {
                    this.$store.dispatch('browseShared', [{ folder: this.item, back: false, init: false }])
                } else {
                    this.$store.dispatch('getFolder', [{ folder: this.item, back: false, init: false }])
                }

                var parents = this.getParents(this.item)
                for (let i = 0; i < parents.length + 1 ; i++) {
                    setTimeout(() => {
                        events.$emit('leftMenu:show', this.item, parents)
                    }, i * 10)
                }                 
            }
        },
        endRename(e){
            if (this.itemName === '') {
                this.itemName = this.originalName
            }
            this.$store.dispatch('renameItem', {
                unique_id: this.item.unique_id,
                type: this.item.type,
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

            this.$store.commit('SET_FOCUS_NAME_ID', this.item.unique_id)
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
                unique_id: this.item.unique_id,
                type: this.item.type,
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

        this.itemName = this.item.name
        this.originalName = this.item.name
        events.$on('newFolder:focus', (unique_id) => {

            if(this.item.unique_id == unique_id && !this.$isMobile()) {
                this.$refs[unique_id].focus()
                document.execCommand('selectAll')
            }
        })

        events.$on('mobileSelecting:start', () => {
            this.mobileMultiSelect = true
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
        })

        events.$on('mobileSelecting:stop', () => {
            this.mobileMultiSelect = false
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
        })

        // Change item name
        events.$on('change:name', (item) => {
            if (this.item.unique_id == item.unique_id) {
                this.itemName = item.name
                this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)
            }
        })    
    },
    mounted() {
        events.$on('nametag:copy', (text, caretPos) => {
            if (this.item.unique_id === this.focusNameID) {
                this.itemName = text
                this.$store.commit('SET_FOCUS_NAME_TEXT', this.itemName)

                var input = document.getElementById(this.itemid)
                this.$nextTick(() => {
                    this.doSetCaretPosition(input, caretPos)
                })
            }
        })

        events.$on('nametag:cut', (text, caretPos) => {
            if (this.item.unique_id === this.focusNameID) {
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


.slide-from-left-move {
    transition: transform 300s ease;
}

.slide-from-left-enter-active,
.slide-from-right-enter-active,
.slide-from-left-leave-active,
.slide-from-right-leave-active {
    transition: all 300ms;
}

.slide-from-left-enter,
.slide-from-left-leave-to {
    opacity: 0;
    transform: translateX(-100%);
}

.slide-from-right-enter,
.slide-from-right-leave-to {
    opacity: 0;
    transform: translateX(100%);
}


.check-select {
    margin-right: 15px;
    margin-left: 6px;

    .select-box {
        width: 20px;
        height: 20px;
        background-color: darken($light_background, 5%);
        display: flex;
        justify-content: center;
        align-items: center;
        // border-radius: 5px;
        border-radius: 0px;
    }

    .select-box-active {
        background-color: $theme;

        .icon {
            stroke: white;
        }
    }
}

.file-wrapper {
    user-select: none;
    position: relative;
    margin:2px 10px;

    &:hover {
        border-color: transparent;
    }

    .actions {
        text-align: right;
        width: 50px;

        .show-actions {
            cursor: pointer;
            padding: 12px 6px 12px;

            .icon-action {
                @include font-size(14);

                path {
                    fill: $theme;
                }
            }
        }
    }

    .item-name {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .item-info {
            display: block;
            line-height: 1;
        }

        .item-shared {
            display: inline-block;

            .label {
                @include font-size(12);
                font-weight: 400;
                color: $theme;
            }

            .shared-icon {
                vertical-align: middle;

                path,
                circle,
                line {
                    stroke: $theme;
                }
            }
        }

        .item-size,
        .item-length {
            @include font-size(11);
            font-weight: 400;
            color: rgba($text, 0.7);
        }

        .name {
            white-space: nowrap;

            &[contenteditable] {
                -webkit-user-select: text;
                user-select: text;
            }

            &[contenteditable='true']:hover {
                text-decoration: underline;
            }
        }

        .name {
            color: $text;
            @include font-size(14);
            font-weight: 700;
            max-height: 40px;
            overflow: hidden;
            text-overflow: ellipsis;

            &.actived {
                max-height: initial;
            }
        }
    }

    &.selected {
        .file-item {
            background: $light_background;
        }
    }

    .icon-item {
        text-align: center;
        position: relative;
        flex: 0 0 50px;
        line-height: 0;
        margin-right: 20px;
        height:50px;
        display: flex;
        overflow:hidden;
        justify-content: center;
        
        .folder {
            width: 52px;
            height: 52px;

            /deep/ .folder-icon {
                @include font-size(52)
            }
        }

        .file-icon {
            @include font-size(45);
            margin-top:2px;

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
                stroke: #dfe0e8;
                stroke-width: 1;
            }
        }

        .file-icon-text {
            line-height: 1;
            // top: 40%;
            @include font-size(11);
            margin: 0 auto;
            position: absolute;
            text-align: center;
            left: 0;
            right: 0;
            color: $theme;
            font-weight: 600;
            user-select: none;
            max-width: 50px;
            // max-height: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            
            &.fileTypePlain{
                
                &:after{
                    content:'FILE';
                    font-size:10px;
                    display:block;
                    margin-top:18px;
                }
                .fileTypeIcon{
                    width:50px;
                    height:50px;
                    overflow:hidden;

                    &.fileTypeZip{

                        img{
                            width:60px;
                            height:60px;
                            margin-left:-4px;
                            margin-top:-2px;
                        }

                        &:after{
                            content:'ZIP';
                            font-size:10px;
                            margin-top:18px;
                            position:absolute;
                            margin-left:18px;
                            left:0;
                        }
                    }

                    &.fileTypeIco{
                        &:after{
                            content:'ICO';
                            font-size:10px;
                            margin-top:18px;
                            position:absolute;
                            margin-left:-9px;
                        }
                    }

                    img{
                        width:80px;
                        height:80px;
                        margin-left:-15px;
                        margin-top:-15px;
                    }

                }
            }
        }

        .image {
            margin: auto;
            object-fit: contain;
            user-select: none;
            max-width: 100%;
            // border-radius: 5px;
            border-radius: 3px;
            width: 50px;
            height: 50px;
            pointer-events: none;
        }
    }

    .file-item {
        border: 2px dashed transparent;
        width: 100%;
        display: flex;
        align-items: center;
        padding: 7px;

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

            .item-name {
                .name {
                    color: $text !important;
                }
            }
        }

        &:hover,
        &.is-clicked {
            border-radius: 0px;
            background: $selected_background;
        }
    }
}

@media (prefers-color-scheme: dark) {
    .check-select {

        .select-box {
            background-color: lighten($dark_mode_foreground, 10%);
        }

        .select-box-active {
            background-color: $theme;

            .icon {
                stroke: white;
            }
        }
    }

    .file-wrapper {
        .icon-item {
            .file-icon {
                path {
                    fill: $dark_mode_foreground;
                    stroke: #2f3c54;
                }
            }
        }

        .file-item {
            
            &.is-cutted {
                opacity: 50%;
            }
            &.no-clicked {
                background: $dark_mode_background !important;

                .file-icon {

                    path {
                        fill: $dark_mode_foreground !important;
                        stroke: #2F3C54;
                    }
                }

                .item-name {

                    .name {
                        color: $dark_mode_text_primary !important;
                    }
                }
            }

            &:hover,
            &.is-clicked {
                background: $dark_mode_foreground;

                .item-name .name {
                    color: $theme;
                }

                .file-icon {
                    path {
                        fill: $dark_mode_background;
                    }
                }
            }
        }

        .item-name {
            .name {
                color: $dark_mode_text_primary;
            }

            .item-size,
            .item-length {
                color: $dark_mode_text_secondary;
            }
        }
    }
}
</style>