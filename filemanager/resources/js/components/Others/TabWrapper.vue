<template>
    <div>
        <div class="tab-wrapper">
            <div class="tab" :class="{ active: tab.isActive }" @click="selectTab(tab)" v-for="(tab, i) in tabs" :key="i">

                <!--Icon-->
                <mail-icon v-if="tab.icon === 'email'" class="tab-icon" size="17"/>
                <link-icon v-if="tab.icon === 'link'" class="tab-icon" size="17"/>
                <smile-icon v-if="tab.icon === 'emoji'" class="tab-icon" size="17"/>
                <folder-icon v-if="tab.icon === 'folder'" class="tab-icon" size="17"/>

                <!--Title-->
                <b class="tab-title">{{tab.title}}</b>
            </div>
        </div>
        <slot></slot>
    </div>

</template>

<script>
     import {
        LinkIcon,
        MailIcon,
        SmileIcon,
        FolderIcon } from 'vue-feather-icons'

    export default {
        name: "TabWrapper",
        components: {
            LinkIcon,
            MailIcon,
            SmileIcon,
            FolderIcon
        },
        data () {
            return {
                tabs: []
            }
        },
        methods: {
            selectTab(selectedTab) {
                this.tabs.forEach(tab => {
                    tab.isActive = tab.title == selectedTab.title
                })
            }
        },
        mounted () {
            this.tabs = this.$children
        }
    }
</script>

<style scoped lang="scss">
    @import "@assets/vue-file-manager/_inapp-forms.scss";
    @import '@assets/vue-file-manager/_forms';

    .tab-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        cursor: pointer;
        align-items: center;
        background: white;
        color: $text;
        // border-radius: 8px;
        border-radius: 0px;
        overflow: hidden;
        border: 1px solid #E8E9EB;

        .tab-title {
            @include font-size(12);
            font-weight:normal;
        }

        .tab {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;

            .tab-icon {
                margin-right: 10px;
            }
            .tab-title {
                color: $text;
            }
            &.active {
                background: $light_background;

                .tab-icon {
                    margin-right: 10px;

                    path,
                    circle,
                    line,
                    polyline {
                        stroke: $theme !important;
                    }
                }

                .tab-title {
                    color: $theme;
                }
            }
        }
        
    }


    @media (prefers-color-scheme: dark) {
        .tab-wrapper {
            background: $dark_mode_foreground;
            border-color: transparent;

            .tab.active {
                background: rgba($theme, 0.1);

                .tab-title {
                    color: $theme;
                }
            }
            .tab {

                .tab-title {
                    color: $dark_mode_text_primary;
                }
            }
        }
    }

</style>
