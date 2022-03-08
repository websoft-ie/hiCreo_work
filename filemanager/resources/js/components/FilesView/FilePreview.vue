<template>
    <!-- <div v-if="canBePreview" class="preview" v-bind:style="{ backgroundImage: 'url(../../assets/images/transparent-tile-light.jpg)' }"> -->
    <div v-if="canBePreview" class="preview">
        <img :style="{width: imgwidth}" ref="img" v-if="fileInfoPreview[0].type == 'image' && fileInfoPreview[0].thumbnail" :src="fileInfoPreview[0].thumbnail" :alt="fileInfoPreview[0].name" />
        <audio v-else-if="fileInfoPreview[0].type == 'audio'" :src="fileInfoPreview[0].file_url" controlsList="nodownload" controls></audio>
        <video v-else-if="fileInfoPreview[0].type == 'video'" controlsList="nodownload" disablePictureInPicture playsinline controls>
            <source :src="fileInfoPreview[0].file_url" type="video/mp4">
        </video>
        <iframe
            v-if="fileInfoPreview[0].type == 'file' && fileInfoPreview[0].mimetype == 'hic'"
            :src="``"
            id="hicContainer"
            name="hicContainer"
            width="100%"
            height="300"
            frameborder="0" >
        </iframe>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex'
    import { includes } from 'lodash'

    export default {
        name: 'FilePreview',
        computed: {
            ...mapGetters(['fileInfoPreview']),
            canBePreview() {
                //debugger
                //hiCreo
                //console.log("?? ~ file: FilePreview.vue ~ line 20 ~ canBePreview ~ canBePreview", this.fileInfoPreview[0])
                if (this.fileInfoPreview === undefined) return false
                if(this.fileInfoPreview[0] && ! includes(['folder', 'file'], this.fileInfoPreview[0].type)){
                    return true
                }else{
                    const _data = this.fileInfoPreview[0].basename;
                    hiCreoEventHandler({type:'sender', action:'getHic', data: _data})
                    return true
                }
            }
        },
        data() {
        return {
            smaller: false,
            imgwidth: '100px',
        }
    },
        
        created() {
            var width = parseInt(this.fileInfoPreview[0].width)
            var height = parseInt(this.fileInfoPreview[0].height)
            if (width < 512) {
                this.smaller = true
                this.imgwidth = this.fileInfoPreview[0].width + 'px'
            }
            else {
                this.smaller = false
                this.imgwidth = '512px'
                if (height > width) {
                    this.imgwidth = width * 300 / height + 'px'
                }
            }
                
        },
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .preview {
        width: 100%;
        // height: 320px;
        // display: block;
        // height: 300px;
        // margin-bottom: 7px;
        background-image: url("images/transparent-tile-light.jpg");
        display:flex;
        align-items:center;
        justify-content: center;
        // padding-top: 10px !important;
        // padding-bottom: 10px !important;
        
        img {
            // border-radius: 4px;
            overflow: hidden;
            // width: 100%;
            height: 300px;
            object-fit: contain;
            pointer-events: none;
        }

        audio {
            width: 100%;
            height: 54px;
            background-color: $light_background;
            
            &::-webkit-media-controls-panel {
                background-color: $light_background;
            }

            &::-webkit-media-controls-play-button {
                color: $theme;
            }
        }

        video {
            width: 100%;
            // height: 100%;
            height:300px;
            // border-radius: 3px;
        }

        file {
            width: 100%;
            // height: 100%;
            height:300px;
            // border-radius: 3px;
        }
    }
    @media (prefers-color-scheme: dark) {
        .preview {
            background-image: url("images/transparent-tile-dark.jpg");
        }
    }
</style>