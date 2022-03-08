<template>
    <div :class="[{'is-apple': $isApple()}, location]">
        <Emoji
            v-if="emoji"
            :emoji="emoji"
            class="emoji-icon"
        />
                        
        <span class="file-icon-text">
            <div v-if="!emoji" class="fileTypeIcon fileTypeEps"
            >
                <svg v-if="folderItems === 0" :width="width" :height="height" viewBox="0 0 512 512" fill="none" :style="{stroke: color}" :class="[{'default-color' : ! color}]" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="folder" role="img" xmlns="http://www.w3.org/2000/svg">
                    <path data-v-ae0399f4="" :class="[{'default-color' : ! color}]" :style="{fill: color}" d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z" class=""/>                
                    </svg>
                <svg v-if="folderItems !== 0" :width="width" :height="height" viewBox="0 0 512 512" fill="none" :style="{stroke: color}" :class="[{'default-color' : ! color}]">
                    <path :class="[{'default-color' : ! color}]" :style="{fill: color}" d="M464,128H272l-64-64H48C21.5,64,0,85.5,0,112v288c0,26.5,21.5,48,48,48h416c26.5,0,48-21.5,48-48V176	C512,149.5,490.5,128,464,128z M484,210.6H271.9l-64,64H30v-84.8c0-11.4,9.2-20.6,20.6-20.6h412.7c11.4,0,20.6,9.2,20.6,20.6V210.6z	"/>
                </svg>
                <!-- <svg-filler v-if="folderItems === 0" path="./images/folder_empty.svg" width="70px" height="80px" :stroke="color" fill="none"/> -->
                <!-- <svg-filler path="./images/folder_file.svg" width="80px" height="80px" /> -->
                <!-- <img v-if="folderItems === 0" class="icon" src="./images/folder_empty.svg"/>
                <img v-if="folderItems !== 0" class="icon" src="./images/folder_file.svg"/> -->
            </div>
        </span>
        <!-- <FontAwesomeIcon
            v-if="!emoji"
            :class="[{ 'is-deleted': isDeleted },{'default-color' : ! color && ! isDeleted}, 'folder-icon' ]"
            :style="{fill: color}"
            icon="folder"
        /> -->
    </div>
</template>

<script>
    import Emoji from '@/components/Others/Emoji'
    import {mapGetters} from 'vuex'

    export default {
        name: 'FolderIcon',
        props: [
            'item',
            'folderIcon',
            'location'
        ],
        components: {
            Emoji,
        },
        computed: {
            ...mapGetters([
                'FilePreviewType',
            ]),
            width(){
                if (this.FilePreviewType === 'grid') return '80px'
                else if (this.FilePreviewType === 'list') return '50px'
            },
            height() {
                if (this.FilePreviewType === 'grid') return '80px'
                else if (this.FilePreviewType === 'list') return '50px'
            },
            folderItems() {
                return this.item.deleted_at ? this.item.trashed_items : this.item.items
            },
            isDeleted() {
                return this.item.deleted_at ? true : false
            },
            emoji() {
                // Return emoji if is changed from rename popup
                if (this.folderIcon)
                    return this.folderIcon.emoji ? this.folderIcon.emoji : false

                // Return emoji if is already set
                return this.item.icon_emoji ? this.item.icon_emoji : false
            },
            color() {
                // Return color if is changed from rename popup
                if (this.folderIcon)
                    return this.folderIcon.color ? this.folderIcon.color : false

                // Return color if is already set
                return this.item.icon_color ? this.item.icon_color : false
            }
        }
    }
</script>

<style lang="scss" scoped>
@import '@assets/vue-file-manager/_variables';
@import '@assets/vue-file-manager/_mixins';

// Locations
.file-item-list {
    &.is-apple .emoji-icon {
        font-size: 50px;
        line-height: 1.1;
    }
}

.file-item-grid {
    &.is-apple .emoji-icon {
        font-size: 80px;
        line-height: 1.1;
    }
}

.thumbnail-item {
    &.is-apple .emoji-icon {
        font-size: 36px;
        line-height: 1.1;
    }
}

.emoji-picker-preview {
    &.is-apple .emoji-icon {
        font-size: 22px;
        line-height: 1.1;
    }
}

.default-color {
    path {
        fill: $theme !important;
    }
}

.folder-icon {

    path {
        fill: inherit;
    }

    &.is-deleted {
        path {
            fill: $dark_background;
        }
    }
}

@media (prefers-color-scheme: dark) {

    .folder-icon {
        &.is-deleted {
            path {
                fill: lighten($dark_mode_foreground, 5%);
            }
        }
    }
}
</style>
