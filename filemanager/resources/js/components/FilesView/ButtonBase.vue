<template>
    <button class="button-base" :class="buttonStyle" type="button">
        <div v-if="loading" class="icon">
            <refresh-cw-icon size="16" class="sync-alt"></refresh-cw-icon>
		</div>
        <div class="content">
            <slot v-if="! loading"></slot>
        </div>
    </button>
</template>

<script>
    import { RefreshCwIcon } from 'vue-feather-icons'

    export default {
        name: 'ButtonBase',
        props: ['buttonStyle', 'loading'],
        components: {
            RefreshCwIcon,
        }
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .button-base {
        @include font-size(12);
        font-weight: normal;
        cursor: pointer;
        transition: 0.15s all ease;
        border-radius: 0px;
        border: 1px solid #aaa;;
        padding: 10px 20px;
        color:#666;
        white-space: nowrap;
        display: inline-block;
        background:#fff;

        .icon {
            line-height: 1;
            margin-right: 10px;
        }

        &:active {
            transform: scale(0.95);
        }

        &.theme {
            // background: rgba($theme, .1);
            background:#fff;
            .content {
                // color: $theme;
                font-size:12px;
                font-weight:normal;
                color:#666;
            }

            polyline, path {
                stroke: $theme;
            }
        }

        &.theme-solid {
            background: $theme;

            .content {
                color: white;
            }

            polyline, path {
                stroke: white;
            }
        }

        &.danger {
            background: rgba($danger, .1);

            .content {
                color: $danger;
            }

            polyline, path {
                stroke: $danger;
            }
        }

        &.danger-solid {
            // background: $danger;

            .content {
                color: #666;
                font-size:12px;
            }

            polyline, path {
                stroke: white;
            }
        }

        &.secondary {
            // background: $light_background;
            background:#fff;

            .content {
                // color: $text;
                font-size:12px;
                font-weight:normal;
                color:#666;                
            }

            polyline, path {
                stroke: $text;
            }
        }
    }

    .sync-alt {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    @media (prefers-color-scheme: dark) {

        .button-base {

            &.secondary {
                background: $dark_mode_foreground;

                .content {
                    color: $dark_mode_text_primary;
                }

                polyline, path {
                    stroke: $theme;
                }
            }
            &.theme {

                .content {
                    color: $dark_mode_text_primary;
                }
            }
        }
    }
</style>
