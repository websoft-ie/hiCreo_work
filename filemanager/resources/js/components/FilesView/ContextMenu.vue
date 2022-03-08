<template>
    <div :style="{ top: positionY + 'px', left: positionX + 'px' }" @click="closeAndResetContextMenu" class="contextmenu" v-show="isVisible || showFromPreview" ref="contextmenu" :class="{ 'filePreviewFixed' : showFromPreview}">

        <!-- Trash location-->
        <div v-if="$isThisLocation(['trash', 'trash-root']) && $checkPermission('master') && !showFromPreview" id="menu-list" class="menu-options">

            <!-- Single options -->
            <OptionGroup v-if="!multiSelected">
                <Option @click.native="restoreItem" v-if="item" :title="$t('context_menu.restore')" icon="restore"/>
                <Option @click.native="deleteItem" v-if="item" :title="$t('context_menu.delete')" icon="trash"/>
                <Option @click.native="emptyTrash" :title="$t('context_menu.empty_trash')" icon="empty-trash"/>
            </OptionGroup>

            <!-- Multi options -->
            <OptionGroup v-if="multiSelected">
                <Option @click.native="restoreItem" v-if="item" :title="$t('context_menu.restore')" icon="restore"/>
                <Option @click.native="deleteItem" :title="$t('context_menu.delete')" icon="trash"/>
                <Option @click.native="emptyTrash" :title="$t('context_menu.empty_trash')" icon="empty-trash"/>
            </OptionGroup>
        </div>


        <!-- Base location with MASTER permission-->
        <div v-if="$isThisLocation(['base', 'participant_uploads', 'latest']) && $checkPermission('master') && !showFromPreview" id="menu-list" class="menu-options">
            
            <!-- No Files options -->
            <OptionGroup v-if="!$isThisLocation(['participant_uploads', 'latest']) && !item">
                <Option @click.native="createFolder" :title="$t('context_menu.create_folder')" icon="create-folder"/>
                <Option @click.native="pasteItem" v-if="canPaste && !isMenu" title="Paste" icon="paste"/>
            </OptionGroup>


            <OptionGroup v-if="item && !multiSelected">
                <Option @click.native="renameItem" :title="$t('context_menu.rename')" icon="rename"/>
                <Option @click.native="deleteItem" :title="$t('context_menu.delete')" icon="trash"/>
                <Option @click.native="copyOrcutItem(false)" title="Copy" icon="copy"/>
                <Option @click.native="copyOrcutItem(true)"  title="Cut" icon="cut"/>
                <Option @click.native="pasteItem" v-if="canPaste && isFolder" title="Paste" icon="paste"/>
                <Option @click.native="downloadItem" v-if="!isFolder" :title="$t('context_menu.download')" icon="download"/>
                <Option @click.native="downloadFolder" v-if="isFolder" :title="$t('context_menu.zip_folder')" icon="zip-folder"/>
            </OptionGroup>

            <!-- Multi options -->
            <OptionGroup v-if="item && multiSelected">
                <Option @click.native="AddToPage" v-if="onlyMediaSelected" title="Add to Page"/>
                <Option @click.native="deleteItem" :title="$t('context_menu.delete')" icon="trash"/>
                <Option @click.native="copyOrcutItem(false)" title="Copy" icon="copy"/>
                <Option @click.native="copyOrcutItem(true)" title="Cut" icon="cut"/>
            </OptionGroup>

        </div>
    </div>
</template>

<script>
import OptionGroup from '@/components/FilesView/OptionGroup'
import Option from '@/components/FilesView/Option'
import { mapGetters } from 'vuex'
import { events } from '@/bus'

export default {
    name: 'ContextMenu',
    components: {
        OptionGroup,
        Option
    },
    computed: {
        ...mapGetters(['user', 'fileInfoDetail', 'clipBoard', 'copyOrCutInfo', 'data', 'status']),
        hasFolder() {

            // Check if selected items includes some folder
            if (this.fileInfoDetail.find(item => item.type === 'folder'))
                return true

        },
        hasFile() {

            // Check if selected items includes some files
            if (this.fileInfoDetail.find(item => item.type !== 'folder'))
                return true

        },
        multiSelected(){
            if (this.isMultipleMenu) return true
            if (this.fileInfoDetail.length > 1)
                return true
            if (this.fileInfoDetail.length == 1 && !this.fileInfoDetail.includes(this.item))
                return true
            return false
        },
        isFolder() {
            return this.item && this.item.type === 'folder'
        },
        isFile() {
            return (
                this.item &&
                this.item.type !== 'folder' &&
                this.item &&
                this.item.type !== 'image'
            )
        },
        isImage() {
            return this.item && this.item.type === 'image'
        },

        isCut(){
            return this.copyOrCutInfo
        },
        canCopyorCut(){
            return this.clipBoard.length < 1 || !this.clipBoard.includes(this.item)
        },
        canPaste(){
            return this.clipBoard.length > 0 && !this.clipBoard.includes(this.item)
        },
        onlyMediaSelected() {
            let onlymedia = true
            if (this.fileInfoDetail.length > 1) {
                this.fileInfoDetail.forEach(element => {
                    var type = element.type
                    if (type !== 'image' && type !== 'audio' && type !== 'video') {
                        onlymedia = false
                    }
                });
            }
            else {
                onlymedia = false
            }
            return onlymedia
        }
    },
    data() {
        return {
            showFromPreview: false,
            item: undefined,
            isMenu: false,
            isVisible: false,
            isMultipleMenu: false,
            positionX: 0,
            positionY: 0
        }
    },

    methods: {
        downloadFolder(){
            this.status['IS_SHOW_CONTEXT'] = false
	        this.$store.dispatch('downloadFolder' , this.item)
        },

        emptyTrash() {
            this.status['IS_SHOW_CONTEXT'] = false
            this.$store.dispatch('emptyTrash')
        },

        restoreItem() {
            this.status['IS_SHOW_CONTEXT'] = false
            // If is item not in selected items restore just this single item
            if(!this.fileInfoDetail.includes(this.item))
                this.$store.dispatch('restoreItem', this.item)

            // If is item in selected items restore all items from fileInfoDetail
            if(this.fileInfoDetail.includes(this.item))
                this.$store.dispatch('restoreItem', null)
        },

        renameItem() {
            this.status['IS_SHOW_CONTEXT'] = false
            events.$emit('popup:open', { name: 'rename-item', item: this.item })
        },

        copyOrcutItem(bcut) {
            this.status['IS_SHOW_CONTEXT'] = false
            let item = this.item
            if (this.isMenu && this.status['focusedNodes'])
                item = this.status['focusedNodes']
            
            if(!this.fileInfoDetail.includes(item))
                this.$store.commit('GET_FILEINFO_DETAIL', item)
            this.$store.commit('SET_COPY_CUT_STATE', bcut)
            this.$store.commit('STORE_COPY_CUT_ITEM')
            this.isVisible = false

            events.$emit('focus:fileBrowser')
        },

        AddToPage() {
            var details = []
            this.fileInfoDetail.forEach(element => {
                details.push({'name': element.name, 'basename': element.basename})
                console.log('name: ', element.name, ', basename: ', element.basename)
            });
        },

        pasteItem() {
            this.status['IS_SHOW_CONTEXT'] = false
            let parent_id = (this.item) ? this.item.unique_id : this.status['focusedParentFolderIndex']
            
            //console.log(parent_id)
            if (this.copyOrCutInfo){
                // cut-paste
                this.$store.dispatch('cutItem', {to_id:parent_id})
            }
            else{
                // copy-paste
                this.$store.dispatch('copyItem', {to_id:parent_id})
                // this.$copyFunc(parent_id)
            }
        },

        downloadItem() {
            this.status['IS_SHOW_CONTEXT'] = false

            if (this.fileInfoDetail.length > 1)
                
                this.$store.dispatch('downloadFiles')
            else {
                this.$downloadFile(this.item.file_url, this.item.name + '.' + this.item.mimetype)
            }
        },

        deleteItem(evt) {
            this.status['IS_SHOW_CONTEXT'] = false

            if (!this.fileInfoDetail.includes(this.item)) {
                this.$store.commit('CLEAR_FILEINFO_DETAIL')
                this.$store.commit('GET_FILEINFO_DETAIL', this.item)
            }            
            // If is context menu open to multi selected items dele this selected items
            if (this.fileInfoDetail.includes(this.item)) {
                if (evt.shiftKey) {
                    events.$emit('popup:open', {name: 'confirm-delete'})
                }
                else {
                    this.$store.dispatch('deleteItem', false)
                }                
            }
        },

        createFolder() {
            // Deselect itms clicked by outside
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
            this.$store.commit('CLEAR_FILEINFO_PREV')
            this.$store.commit('CLEAR_ITEM_MOVED')

            this.status['IS_SHOW_CONTEXT'] = false

            // this.$store.dispatch('testapi', {id:38})
            this.$store.dispatch('createFolder', this.$t('popup_create_folder.folder_default_name'))
        },

        closeAndResetContextMenu() {
            this.status['IS_SHOW_CONTEXT'] = false          
            // Close context menu
            this.isVisible = false

            // Reset item container
            this.item = undefined

        },

        showFolderActionsMenu() {
            let container = document.getElementById('folder-actions')

            this.positionX = container.offsetLeft + 16
            this.positionY = container.offsetTop + 30

            // Show context menu
            this.isVisible = true
        },
        showContextMenu(event) {
            if (this.status['IS_SHOW_PREVIEW']) return

            if (this.fileInfoDetail.length > 1) this.isMultipleMenu = true
            else this.isMultipleMenu = false
            
            this.status['IS_SHOW_CONTEXT'] = true
            
            let parent = document.getElementById('menu-list')
            let nodesSameClass = parent.getElementsByClassName('menu-option')
            
            
            let VerticalOffsetArea = nodesSameClass.length * 50
            let HorizontalOffsetArea = 190

            // let container = document.getElementById('files-view')
            
            let container = document.getElementById('viewport')
            
            var offset = container.getClientRects()[0]

            let x = event.clientX - offset.left
            let y = event.clientY - offset.top

            // Set position Y
            if (container.offsetHeight - y < VerticalOffsetArea) {
                this.positionY = y - VerticalOffsetArea
            } else {
                this.positionY = y
            }

            // Set position X
            if (container.offsetWidth - x < HorizontalOffsetArea) {
                this.positionX = x - HorizontalOffsetArea
            } else {
                this.positionX = x
            }

            // Show context menu
            this.isVisible = true
        },
        showFilePreviewMenu() {
            let container = document.getElementById('fast-preview-menu')
            if (container) {
                this.positionX = container.offsetLeft + 16
                this.positionY = container.offsetTop + 51
            }
        }
    },
    watch: {
        item(newValue, oldValue) {
            if (oldValue != undefined && this.showFromPreview) {
                this.showFromPreview = false
            }
        }
    },

    mounted() {
        events.$on('actualShowingImage:ContextMenu', (item) => {
            this.item = item
        })
    },
    created() {
        events.$on('showContextMenuPreview:show', (item) => {
            if (!this.showFromPreview) {
                this.item = item
                this.showFromPreview = true
                // this.showFilePreviewMenu()
            } else if (this.showFromPreview) {
                this.showFromPreview = false
                this.item = undefined
            }
        })

        events.$on('showContextMenuPreview:hide', () => {
            this.isVisible = false
            this.showFromPreview = false
            this.item = undefined

        })

        events.$on('contextMenu:show', (event, item, side) => {
            // If the file preview window is active, return
            if (this.status['IS_SHOW_PREVIEW']) return
            
            // Store item
            this.item = item
            this.isMenu = side
            /* console.log('---------------------------')
            console.log(this.status['focusedParentFolderIndex'])
            console.log(this.item)
            console.log(this.fileInfoDetail.length)
            console.log(this.status['focusedNodes'])
            console.log('---------------------------') */
            // alert(this.clipBoard.length)
            // alert(this.fileInfoDetail.length)
            // Show context menu
            setTimeout(() => this.showContextMenu(event, item), 10)
        })

        
        events.$on('unClick', () => this.closeAndResetContextMenu())

        events.$on('folder:actions', (folder) => {
            // Store item
            this.item = folder

            if (this.isVisible) this.isVisible = false
            else this.showFolderActionsMenu()
        })
    }
}
</script>

<style scoped lang="scss">
@import "@assets/vue-file-manager/_variables";
@import "@assets/vue-file-manager/_mixins";

.no-options {
    /deep/ .text-label {
        color: $text-muted !important;
    }

    /deep/ &:hover {
        background: transparent;
    }

    /deep/ path,
    /deep/ line,
    /deep/ circle {
        stroke: $text-muted !important;
    }
}

.filePreviewFixed {
    position: fixed !important;
    display: flex;
}

.contextmenu {
    min-width: 250px;
    position: absolute;
    z-index: 99;
    box-shadow: $shadow;
    background: white;
    // border-radius: 8px;
    border-radius: 4px;
    overflow: hidden;

    &.showed {
        display: block;
    }
}

.menu-options {
    list-style: none;
    width: 100%;
    margin: 0;
    padding: 0;
}

@media (prefers-color-scheme: dark) {
    .contextmenu {
        background: $dark_mode_foreground;
    }
    .no-options {
        /deep/ .text-label {
            color: $dark_mode_text_secondary !important;
        }

        /deep/ &:hover {
            background: transparent;
        }

        /deep/ path,
        /deep/ line,
        /deep/ circle {
            stroke: $dark_mode_text_secondary !important;
        }
    }
}
</style>
