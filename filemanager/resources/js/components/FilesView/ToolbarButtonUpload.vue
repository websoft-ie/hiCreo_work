<template>
    <label label="file" class="button file-input">
        <!-- <upload-cloud-icon size="17"></upload-cloud-icon> -->

            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve" width='19' height='19' class="uploadIcon" >
            <path d="M12,2.9c3.4,0,6.1,2.7,6.1,6.1c0,0.3,0,0.6-0.1,0.8l-0.1,0.8h0.9c1.8,0,3.2,1.4,3.2,3.2c0,1.7-1.3,3-2.9,3.2v2l0.2,0
                c2.7-0.2,4.8-2.5,4.8-5.2c0-2.4-1.7-4.4-3.9-5c-0.1-4.4-3.7-8-8.1-8l0,0c-4.4,0-8,3.6-8.1,8C3,9.1,2.2,9.6,1.5,10.2
                c-1,1-1.5,2.3-1.5,3.6c0,2.7,2.1,4.9,4.8,5.2l0.1,0h0.1v-2C3.3,16.9,2,15.5,2,13.9c0-0.8,0.3-1.6,0.9-2.2c0.6-0.6,1.4-0.9,2.3-0.9
                h0.9L6,9.8c0-0.2-0.1-0.5-0.1-0.8C5.9,5.6,8.6,2.9,12,2.9"/>
            <path d="M7.1,16.2L7.1,16.2c0.4,0.4,1,0.4,1.4,0l2.5-2.5v8.5c0,0.6,0.4,1,1,1h0.1c0.6,0,1-0.4,1-1v-8.5l2.5,2.5c0.4,0.4,1,0.4,1.4,0
                h0c0.4-0.4,0.4-1,0-1.4l-4.2-4.2c-0.4-0.4-1-0.4-1.4,0l-4.2,4.2C6.7,15.2,6.7,15.8,7.1,16.2z"/>
            </svg>

        <input
                @change="emmitFiles"
                v-show="false"
                id="file"
                type="file"
                name="files[]"
                multiple
        />
    </label>
</template>

<script>
    import { UploadCloudIcon } from 'vue-feather-icons'

    export default {
        name: 'ToolbarButtonUpload',
        props: ['action'],
        components: {
            UploadCloudIcon,
        },
        methods: {
            emmitFiles(e) {
                // var thumbnailImgs = []
                // for(let index = 0; index < e.target.files.length; index++) {
                //     const file = e.target.files[index]
                //     var reader = new FileReader()
                //     reader.onload = function(evt) {
                //         var img = new Image()
                //         img.src = evt.target.result
                //         img.onload = function() {
                //             var c = document.createElement("canvas");
                //             c.width = 512
                //             c.height = 512
                //             var ctx = c.getContext("2d");
                //             ctx.scale(512 / img.width, 512 / img.height)
                //             ctx.drawImage(img, 0, 0)
                //             thumbnailImgs.push(c.toDataURL())
                //             if (thumbnailImgs.length === e.target.files.length) {
                                this.$uploadFiles(e.target.files)
                //             }
                //         }
                //     }
                //     reader.readAsDataURL(file)
                // }
                // this.$uploadFiles(e.target.files)
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .button {
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

        &:hover {
            background: $light_background;

            path, line, polyline, rect, circle {
                @include transition(150ms);
                stroke: $theme;
            }
            .uploadIcon{
                path, line, polyline, rect, circle, ellipse {
                fill:$theme;
                stroke: none;
                }
          }  
        }
    }

    @media (prefers-color-scheme: dark) {

        .button {
            background: transparent;

            &:hover {
                background: $dark_mode_foreground;
            }

            path, line, polyline, rect, circle {
                stroke: $dark_mode_text_primary;
            }
        }
    }
</style>
