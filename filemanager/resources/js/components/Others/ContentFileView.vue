<template>
    <div @contextmenu.prevent.capture="contextMenu($event, undefined)"
         id="files-view">
        <!-- <ContextMenu/> -->
        <DesktopSortingAndPreview/>
        <DesktopToolbar/>
        <FileBrowser/>
    </div>
</template>

<script>
    import DesktopSortingAndPreview from '@/components/FilesView/DesktopSortingAndPreview'
    import DesktopToolbar from '@/components/FilesView/DesktopToolbar'
    import FileBrowser from '@/components/FilesView/FileBrowser'
    import ContextMenu from '@/components/FilesView/ContextMenu'
    import {mapGetters} from 'vuex'
    import {events} from '@/bus'

    export default {
        name: 'ContentFilesView',
        components: {
            DesktopSortingAndPreview,
            DesktopToolbar,
            FileBrowser,
            // ContextMenu,
        },
        computed: {
            ...mapGetters([
                'config', 
                'currentFolder', 
                'data',
                'status',
            ]),
        },
        methods: {
            contextMenu(event, item) {
                this.status['focusedParentFolderIndex'] = this.currentFolder.unique_id
                this.status['focusedNodes'] = undefined
                events.$emit('contextMenu:show', event, item, false)
            },
        },
    }
</script>

<style lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    #files-view {
        font-family: 'Open Sans', sans-serif;
        font-size: 16px;
        width: 100%;
        height: 100%;
        position: relative;
        min-width: 320px;
        overflow-x: hidden;
        padding-left: 15px;
        padding-right: 15px;
        overflow-y: auto;
    }

    @media only screen and (max-width: 690px) {
        #files-view {
            padding-left: 0;
            padding-right: 0;
        }
    }

</style>
