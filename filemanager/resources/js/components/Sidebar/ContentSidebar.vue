<template>
    <section ref="contentsidebar" class="content-sidebar" id="content-sidebar" @drop.stop.prevent="dropUpload($event)" @contextmenu.prevent.capture="contextMenu($event, undefined)">
        <slot></slot>
    </section>
</template>

<script>
    import {mapGetters} from 'vuex'
    import {events} from '@/bus'
    
    export default {
        name: 'ContentSidebar',
        computed: {
            ...mapGetters([
                'currentFolder', 
                'data',
                'status',
            ]),
        },
        methods: {
            contextMenu(event, item) {
                this.status['focusedParentFolderIndex'] = 0
                events.$emit('contextMenu:show', event, item, true)
            },
            dropUpload(event) {
                if (event.dataTransfer.types[0] === undefined || event.dataTransfer.types[0] !== 'Files') return
                if (this.status['IsExternalUploadedToTreeMenu'] === undefined) {
                    this.status['IsExternalUploadedToTreeMenu'] = false
                }
                if (this.status['IsExternalUploadedToTreeMenu']) return
                this.$uploadExternalFiles(event, 0)
            },
        },
        mounted() {
            const { contentsidebar } = this.$refs;
            contentsidebar.addEventListener("dragover",function(e){
                e = e || event;
                e.preventDefault();
            },false);        
            contentsidebar.addEventListener("drop",function(e){
                e = e || event;
            },false);
        }
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .content-sidebar {
        //background: linear-gradient(0deg, rgba(246, 245, 241, 0.4) 0%, rgba(243, 244, 246, 0.4) 100%);
        background: rgba($light_background, 0.6);
        user-select: none;
        /*hiCreo padding-top: 25px;*/
        // overflow-y: auto;
        flex: 0 0 225px;
        border-right:1px solid #ddd;
        width:200px;
    }

    @media only screen and (max-width: 1024px) {
        .content-sidebar {
            flex: 0 0 205px;
        }
    }

    @media only screen and (max-width: 690px) {
        .content-sidebar {
            display: none;
        }
    }

    @media (prefers-color-scheme: dark) {

        .content-sidebar {
            background: rgba($dark_mode_foreground, 0.2);
        }
    }
</style>
