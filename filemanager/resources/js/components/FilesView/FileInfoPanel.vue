<template>
    <PopupWrapper name="fileinfo-preview" >

        <!--Title-->
        <PopupHeader title="Preview" icon="edit" />

        <!--Content-->
        <PopupContent>

            <!--Form to set sharing-->
            <ValidationObserver tag="form" class="form-wrapper">
                <ValidationProvider tag="div" mode="passive" rules="required" v-slot="{ errors }">
                    <div class="file-headline" spellcheck="false">
                        <FilePreview/>

                        <!--File info-->
                        <div class="file-info fileName">
                            <div class="">
                                <span ref="name" class="name">{{ fileInfoPreview[0].name }}</span>
                            </div>
                        </div>
                        <div class="file-info fileDetail">
                            <span v-if="(fileInfoPreview[0].metadata !== null) && fileInfoPreview[0].metadata.ExifImageWidth && fileInfoPreview[0].metadata.ExifImageLength" ref="" class="detail">Dimention: {{ fileInfoPreview[0].metadata.ExifImageWidth }}X{{ fileInfoPreview[0].metadata.ExifImageLength }} | </span>
                            <span v-if="(fileInfoPreview[0].width !== null && fileInfoPreview[0].height !== null)" ref="" class="detail size">
                                <span class="label">
                                    Dimension:
                                </span>
                                {{ fileInfoPreview[0].width }}px X {{ fileInfoPreview[0].height }}px | 
                                
                            </span>
                            <span ref="" class="detail size">
                                <span class="label">
                                    Size:
                                </span>
                                {{ fileInfoPreview[0].filesize }} | 
                                
                            </span>
                            <span ref="" class="detail date">
                                <span class="label">
                                    Date: 
                                </span>
                                {{ fileInfoPreview[0].created_at }}
                            </span>
                        </div>
                    </div>               
                </ValidationProvider>
            </ValidationObserver>
        </PopupContent>

        <!--Actions-->
        <PopupActions>
            <ButtonBase
                class="popup-button"
                @click.native="addToPage"
                button-style="theme"
            >Add To page</ButtonBase>   
            <ButtonBase
                class="popup-button"
                @click.native="renameItem"
                button-style="theme"
            >Rename</ButtonBase>  
            <ButtonBase
                class="popup-button"
                @click.native="deleteItem"
                button-style="theme"
            >Delete</ButtonBase>  
            <ButtonBase
                class="popup-button"
                @click.native="downloadItem"
                button-style="theme"
            >Download</ButtonBase>  
        </PopupActions>
    </PopupWrapper>
</template>

<script>
    import {Edit2Icon, LockIcon, UnlockIcon, ImageIcon, VideoIcon, FolderIcon, FileIcon} from 'vue-feather-icons'
    import ImageMetaData from '@/components/FilesView/ImageMetaData'
    import FilePreview from '@/components/FilesView/FilePreview'
    import CopyInput from '@/components/Others/Forms/CopyInput'
    import ListInfoItem from '@/components/Others/ListInfoItem'
    import ListInfo from '@/components/Others/ListInfo'
    import {mapGetters} from 'vuex'
    import {events} from "@/bus"
    import TextLabel from '@/components/Others/TextLabel.vue'
    import {ValidationProvider, ValidationObserver} from 'vee-validate/dist/vee-validate.full'
    import PopupWrapper from '@/components/Others/Popup/PopupWrapper'
    import PopupActions from '@/components/Others/Popup/PopupActions'
    import PopupContent from '@/components/Others/Popup/PopupContent'
    import PopupHeader from '@/components/Others/Popup/PopupHeader'
    import ThumbnailItem from '@/components/Others/ThumbnailItem'
    import ActionButton from '@/components/Others/ActionButton'
    import ButtonBase from '@/components/FilesView/ButtonBase'
    import {required} from 'vee-validate/dist/rules'
    import axios from 'axios'
    
    export default {
        name: 'FileInfoPanel',
        components: {
            ImageMetaData,
            ListInfoItem,
            ListInfo,
            FilePreview,
            FolderIcon,
            UnlockIcon,
            VideoIcon,
            CopyInput,
            ImageIcon,
            FileIcon,
            Edit2Icon,
            LockIcon,
            TextLabel,
            ValidationProvider,
            ValidationObserver,
            ThumbnailItem,
            ActionButton,
            PopupWrapper,
            PopupActions,
            PopupContent,
            PopupHeader,
            ButtonBase,
            required,
        },
        data() {
            return {
                name: undefined,
            }
        },
        computed: {
            ...mapGetters(['fileInfoPreview', 'permissionOptions', 'data', 'status']),
            fileType() {
                return this.fileInfoPreview[0].type
            },
            canShowMetaData() {
                return this.fileInfoPreview[0].metadata && this.fileInfoPreview[0].metadata.ExifImageWidth
            },

            isLocked() {
                return this.fileInfoPreview[0].shared.protected
            }
        },
        methods: {
            addToPage(){
                var _data = [{type: this.fileInfoPreview[0].type, name: this.fileInfoPreview[0].name, basename: this.fileInfoPreview[0].basename}];
                if(this.fileInfoPreview[0].type == 'file' && this.fileInfoPreview[0].mimetype == 'hic'){
                    _data[0].type = 'hic'
                    _data[0].basename = document.querySelector('#hicContainer').getAttribute('file')
                }else{

                }
                
                hiCreoEventHandler({type:'sender', action:'addToPage', data: _data})

                events.$emit('popup:close')
            },
            renameItem(){
                events.$emit("popup:open", { name: "rename-item", item: this.fileInfoPreview[0]})
            },
            deleteItem(){
                this.$store.dispatch("deleteItem", false, this.fileInfoPreview[0])
                events.$emit('popup:close')
            },
            downloadItem(){
                this.$downloadFile(this.fileInfoPreview[0].file_url, this.fileInfoPreview[0].name + '.' + this.fileInfoPreview[0].mimetype)
                events.$emit('popup:close')
            },
            closeInfo() {
                try {
                    this.status['IS_SHOW_CONTEXT'] = false
                } catch (error) {
                    if (error.message.includes('object is not extensible')) {
                        let tmpPromo = Object.assign({colspan: 0}, this.data);
                        tmpPromo['IS_SHOW_CONTEXT'] = false                  
                    }
                }   
            }
        },
        mounted() {
            events.$on('popup:open', args => {

                if (args.name !== 'fileinfo-preview') return

                if (! this.$isMobile()) {
                    // this.$nextTick(() => this.$refs.input.focus())
                }
            })

            events.$on('popup:close', () => {
                this.closeInfo()
            })
        },
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .modal-mask {
    position: absolute;
    // left: 20%;
    z-index: 9998;
    width: 100%;
    height: 100%;
    margin: auto;
    background-color: rgba(0, 0, 0, 0.5);
    display: block;
    transition: opacity 0.3s ease;
    }

    .modal-container {
    width: 512px;
    margin: 0px auto;
    margin-top: 10%;
    // padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    transition: all 0.3s ease;
    font-family: Helvetica, Arial, sans-serif;
    }

    .modal-title {
    background-color: #3f3f3f;
    color: rgb(250, 250, 250) !important;
    padding: 0.4em 1em;
    
        b{font-size: 14px !important;}
        button {
                float: right;
                width: 16px;
                height: 16px;
                background: none;
                border: 0px solid #aaa;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='23' height='23'><path style='fill:%23dddddd;' d='M8.9,7.5l6.1,6.1L13.6,15L7.5,8.9L1.4,15L0,13.6l6.1-6.1L0,1.4L1.4,0l6.1,6.1L13.6,0L15,1.4L8.9,7.5z'/></svg>");
                margin-top: 3px;

                &:hover{
                    cursor:pointer;
                    }
                    
                }
    }

    .file-info-content {
        padding-bottom: 20px;
    }

    .file-headline {
        margin-bottom: 20px;
        border-radius: 8px;

        .flex {
            display: flex;
            align-items: flex-start;
        }

        .icon-preview {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            text-align: center;
            cursor: pointer;
            white-space: nowrap;
            outline: none;
            border: none;
        }

        .file-info {
            
            width: 100%;
            word-break: break-all;

            &.fileName{
                padding: 15px 20px 5px 20px;
            }
            &.fileDetail{
                padding: 5px 20px;
            }
            &.previewBtns{
                padding: 5px 20px 15px 20px;
            }

            .file-info-button {
                margin: auto;
                text-align:center;

                button {
                    background: #fff;
                    padding: 10px 20px;
                    color: #666;
                    margin: 0 2px !important;
                    display: inline-block;
                    font-size: 12px;
                    border-radius: 0;
                    border: 1px solid #d3d3d3;
                    &:hover{
                        color: #06f;
                        border: 1px solid #06f;
                        cursor:pointer;
                    }
                }
            }
            .name {
                @include font-size(14);
                font-size:12px;
                font-weight: 700;
                line-height: 1.4;
                display: block;
                color: $text;
            }

            .mimetype {
                @include font-size(12);
                font-weight: 600;
                color: $theme;
                display: block;
            }
        }
        .file-info {

            .detail{
                &.size{
                    font-size:12px;
                    .label{
                        font-size:10px;
                    }
                }
            }

            .detail{
                &.date{
                    font-size:12px;
                    .label{
                        font-size:10px;
                    }
                }
            }   

        }
    }

    .sharelink {
        display: flex;
        width: 100%;
        align-items: center;
        margin-top: 10px;

        .lock-icon {
            display: inline-block;
            width: 15px;
            margin-right: 9px;
            cursor: pointer;
        }

        .copy-sharelink {
            width: 100%;
        }
    }

    @media (prefers-color-scheme: dark) {

        .file-headline {

            .file-info {

                .name {
                    color: $dark_mode_text_primary;
                }
            }
        }

        .sharelink {

            .lock-icon {

                &:hover {

                    path, rect {
                        stroke: $theme;
                    }
                }
            }
        }
    }
</style>
