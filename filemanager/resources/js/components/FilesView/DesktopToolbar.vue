<template>
    <div id="desktop-toolbar" ref="desktoptoolbar">
        <div class="toolbar-wrapper" @drop.stop.prevent="dropUpload($event)">
            <!-- Go back-->
            <div class="toolbar-go-back" v-if="homeDirectory">
                <div @click="goBack" class="go-back-button">
                    <chevron-left-icon size="17" :class="{ 'is-active': browseHistory.length > 1 }" class="icon-back"></chevron-left-icon>

                    <span class="back-directory-title">
            {{ directoryName }}
          </span>

                    <span @click.stop="folderActions" v-if="
              browseHistory.length > 1 && $isThisLocation(['base', 'public'])
            " class="folder-options" id="folder-actions">
            <more-horizontal-icon size="14" class="icon-more"></more-horizontal-icon>
          </span>
                </div>
            </div>

            <!-- Tools-->
            <div class="toolbar-tools">
                <!--Search bar-->
                <div class="toolbar-button-wrapper">
                    <SearchBar/>
                </div>

                <!--Creating controls-->
                <div class="toolbar-button-wrapper" v-if="$checkPermission(['master', 'editor'])">
                    <ToolbarButtonUpload :class="{ 'is-inactive': canUploadInView || !hasCapacity }" :action="$t('actions.upload')"/>
                    <!-- <ToolbarButton :class="{ 'is-inactive': canCreateFolderInView }" @click.native="createFolder" source="folder-plus" :action="$t('actions.create_folder')"/> -->

                    <button title="Create folder" class="button create-folder" :class="{ 'is-inactive': canCreateFolderInView }" @click="createFolder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19px" height="19px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder-plus">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <!-- <line x1="12" y1="11" x2="12" y2="17"></line>
                            <line x1="9" y1="14" x2="15" y2="14"></line> -->
                        </svg> 
                    </button>

                </div>

                <!--File Controls-->
                <div class="toolbar-button-wrapper" v-if="$checkPermission(['master', 'editor']) && ! $isMobile()">
                    <ToolbarButton source="trash" :class="{ 'is-inactive': canDeleteInView }" :action="$t('actions.delete')" @click.native="deleteItem"/>
                </div>

                <!--View Controls-->
                <div class="toolbar-button-wrapper">
                    <ToolbarButton source="preview-sorting" class="preview-sorting" :action="$t('actions.sorting_view')" :class="{ active: sortingAndPreview }" @click.stop.native="sortingAndPreview = !sortingAndPreview"/>
                </div>

            </div>
        </div>
        <UploadProgress/>
        <CopyProgress/>
    </div>
</template>

<script>
import ToolbarButtonUpload from '@/components/FilesView/ToolbarButtonUpload'
import { ChevronLeftIcon, MoreHorizontalIcon } from 'vue-feather-icons'
import UploadProgress from '@/components/FilesView/UploadProgress'
import CopyProgress from '@/components/FilesView/CopyProgress'
import ToolbarButton from '@/components/FilesView/ToolbarButton'
import SearchBar from '@/components/FilesView/SearchBar'
import { mapGetters } from 'vuex'
import { events } from '@/bus'
import { last } from 'lodash'

export default {
    name: 'ToolBar',
    components: {
        ToolbarButtonUpload,
        MoreHorizontalIcon,
        ChevronLeftIcon,
        UploadProgress,
        CopyProgress,
        ToolbarButton,
        SearchBar
    },
    computed: {
        ...mapGetters([
            'FilePreviewType',
            'fileInfoVisible',
            'fileInfoDetail',
            'currentFolder',
            'browseHistory',
            'homeDirectory',
            'data',
            'status',
            'treefolders'
        ]),
        hasCapacity() {
            // Check if set storage limitation
            if (!this.$store.getters.config.storageLimit) return true

            // Check if is loaded user
            if (!this.$store.getters.user) return true

            // Check if user has storage
            return (
                this.$store.getters.user.relationships.storage.data.attributes.used <=
                100
            )
        },
        directoryName() {
            return this.currentFolder
                ? this.currentFolder.name
                : this.homeDirectory.name
        },
        preview() {
            return this.FilePreviewType === 'list' ? 'th' : 'th-list'
        },
        canCreateFolderInView() {
            return !this.$isThisLocation(['base', 'public'])
        },
        canDeleteInView() {
            let locations = [
                'trash',
                'trash-root',
                'base',
                'participant_uploads',
                'latest',
                'shared',
                'public'
            ]
            return !this.$isThisLocation(locations) || this.fileInfoDetail.length === 0
        },
        canUploadInView() {
            return !this.$isThisLocation(['base', 'public'])
        },
        canMoveInView() {
            let locations = [
                'base',
                'participant_uploads',
                'latest',
                'shared',
                'public'
            ]
            return !this.$isThisLocation(locations) || this.fileInfoDetail.length === 0

        },
        canShareInView() {
            let locations = [
                'base',
                'participant_uploads',
                'latest',
                'shared',
                'public'
            ]

            return !this.$isThisLocation(locations) || this.fileInfoDetail.length > 1 || this.fileInfoDetail.length === 0
        }
    },
    data() {
        return {
            sortingAndPreview: false
        }
    },
    watch: {
        sortingAndPreview() {
            if (this.sortingAndPreview) {
                events.$emit('sortingAndPreview', true)
            }

            if (!this.sortingAndPreview) {
                events.$emit('unClick')
            }
        }
    },
    methods: {
        dropUpload(event) {
            if (event.dataTransfer.types[0] === 'Files')
                this.$uploadExternalFiles(event, 0)
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
        goBack() {
            // Get previous folder
            let previousFolder = last(this.browseHistory)

            if (!previousFolder) return

            if (previousFolder.location === 'trash-root') {
                this.$store.dispatch('getTrash')
            } else if (previousFolder.location === 'shared') {
                this.$store.dispatch('getShared')
            } else {
                if (this.$isThisLocation('public')) {
                    this.$store.dispatch('browseShared', [
                        { folder: previousFolder, back: true, init: false }
                    ])
                } else {
                    this.$store.dispatch('getFolder', [
                        { folder: previousFolder, back: true, init: false }
                    ])
                }
            }
            var parents = this.getParents(previousFolder)
            for (let i = 0; i < parents.length + 1 ; i++) {
                setTimeout(() => {
                    events.$emit('leftMenu:show', previousFolder, parents)
                }, i * 10)
            }            
        },
        folderActions() {
            events.$emit('folder:actions', this.currentFolder)
        },
        deleteItem(evt) {
            if (this.fileInfoDetail.length > 0) {
                this.status['IS_SHOW_PREVIEW'] = false
                if (evt.shiftKey) {
                    events.$emit('popup:open', {name: 'confirm-delete'})
                }
                else {
                    this.$store.dispatch('deleteItem')
                }            
            }
        },
        createFolder() {
            // Deselect itms clicked by outside
            this.$store.commit('CLEAR_FILEINFO_DETAIL')
            this.$store.commit('CLEAR_FILEINFO_PREV')
            this.$store.commit('CLEAR_ITEM_MOVED')

            this.status['focusedParentFolderIndex'] = this.currentFolder.unique_id
            this.$store.dispatch('createFolder', this.$t('popup_create_folder.folder_default_name'))
        },
        moveItem() {
            if (this.fileInfoDetail.length > 0)
                events.$emit('popup:open', { name: 'move', item: this.fileInfoDetail })
        },
        shareItem() {
            if (this.fileInfoDetail[0]) {
                //ADD BY M
                if (this.fileInfoDetail[0].shared) {
                    events.$emit('popup:open', {
                        name: 'share-edit',
                        item: this.fileInfoDetail[0]
                    })
                } else {
                    events.$emit('popup:open', {
                        name: 'share-create',
                        item: this.fileInfoDetail[0]
                    })
                }
            }
        }
    },
    mounted() {
        const { desktoptoolbar } = this.$refs;
        desktoptoolbar.addEventListener("dragover",function(e){
            e = e || event;
            e.preventDefault();
        },false);        
        desktoptoolbar.addEventListener("drop",function(e){
            e = e || event;
            e.preventDefault();
        },false);
        events.$on('unClick', () => {
            this.sortingAndPreview = false
        })

        events.$on('delete:treemenu', () => {
            this.goBack()
        })
    }
}
</script>

<style scoped lang="scss">
@import "@assets/vue-file-manager/_variables";
@import "@assets/vue-file-manager/_mixins";

.preview-sorting {
    /deep/ .label {
        color: $text !important;
    }

    /deep/ .preview-sorting {
        path, line, polyline, rect, circle {
            stroke: $text !important;
        }
    }

    &:hover {
        /deep/ .preview-sorting {
            path, line, polyline, rect, circle {
                stroke: $theme !important;
            }
        }
    }
}

.toolbar-wrapper {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    position: relative;
    z-index: 2;

    > div {
        flex-grow: 1;
        align-self: center;
        white-space: nowrap;
    }
}

.directory-name {
    vertical-align: middle;
    @include font-size(17);
    color: $text;
    font-weight: 700;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
}

.icon-back {
    vertical-align: middle;
    cursor: pointer;
    margin-right: 6px;
    opacity: 0.15;
    pointer-events: none;
    @include transition(150ms);

    &.is-active {
        opacity: 1;
        pointer-events: initial;
    }
}

.toolbar-go-back {
    cursor: pointer;

    .folder-options {
        vertical-align: middle;
        margin-left: 6px;
        padding: 1px 4px;
        line-height: 0;
        border-radius: 3px;
        @include transition(150ms);

        svg circle {
            @include transition(150ms);
        }

        &:hover {
            background: $light_background;

            svg circle {
                stroke: $theme;
            }
        }

        .icon-more {
            vertical-align: middle;
        }
    }

    .back-directory-title {
        @include font-size(15);
        line-height: 1;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        vertical-align: middle;
        color: $text;
    }
}

.toolbar-position {
    text-align: center;

    span {
        @include font-size(17);
        font-weight: 600;
    }
}

.toolbar-tools {
    text-align: right;

    .toolbar-button-wrapper {
        margin-left: 28px;
        display: inline-block;
        vertical-align: middle;

        &:first-child {
            margin-left: 0 !important;
        }
    }

    .button {
        margin-left: 5px;

        &.create-folder{
            height: 42px;
            width: 42px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            text-align: center;
            cursor: pointer;
            white-space: nowrap;
            outline: none;
            border: none;
            @include transition(150ms);
            background:#fff;

            &:hover {
                 background-color:rgb(239, 239, 239) !important;

                .preview-sorting {
                    path, line, polyline, rect, circle {
                        stroke: $theme !important;
                    }
                }
            }


            &:hover{
                svg{
                    path{
                        stroke: $theme;
                    }
                }
               
            }
        }

        &.active {
            /deep/ svg {
                line,
                circle,
                rect {
                    stroke: $theme;
                }
            }

            &.preview-sorting {
                background: $light_background;

                /deep/ .preview-sorting {
                    path, line, polyline, rect, circle {
                        stroke: $theme !important;
                    }
                }
            }
        }

        &.is-inactive {
            opacity: 0.25;
            pointer-events: none;
        }

        &:first-child {
            margin-left: 0;
        }
    }
}

@media only screen and (max-width: 1024px) {
    .toolbar-go-back .back-directory-title {
        max-width: 120px;
    }

    .toolbar-tools {
        .button {
            margin-left: 0;
            height: 40px;
            width: 40px;
        }

        .toolbar-button-wrapper {
            margin-left: 25px;
        }
    }
}
// block mobile version_SK
// @media only screen and (max-width: 960px) {
//     #desktop-toolbar {
//         display: none;
//     }
// }

@media (prefers-color-scheme: dark) {
    .toolbar .directory-name {
        color: $dark_mode_text_primary;
    }

    .toolbar-go-back {
        .back-directory-title {
            color: $dark_mode_text_primary;
        }

        .folder-options {
            &:hover {
                background: $dark_mode_foreground;
            }
        }
    }

    .active {
        &.preview-sorting {
            background: $dark_mode_foreground !important;
        }
    }
    .preview-sorting {
        /deep/ .label {
            color: $text !important;
        }

        /deep/ .preview-sorting {
            path, line, polyline, rect, circle {
                stroke: $dark_mode_text_primary !important;
            }
        }
    }
}
</style>
