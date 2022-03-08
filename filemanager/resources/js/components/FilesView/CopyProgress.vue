<template>
    <transition name="info-panel">
        <div v-if="copyItemQueue.length > 0" class="copy-progress">
            <div class="progress-title">
				<span v-if="copyItemQueue.length > 0">
                    Copying {{copyProgress}}% - {{copiedItems}}/{{itemsInCopyQueueTotal}}
                    <!-- Copied {{ $t({current:copiedItems, total: itemsInCopyQueueTotal, progress: (itemsInCopyQueueTotal - copyItemQueue.length) * 100 / itemsInCopyQueueTotal}) }} -->
                </span>
            </div>
            <div class="progress-wrapper">
                <ProgressBar :progress="copyProgress" />
            </div>
        </div>
    </transition>
</template>

<script>
    import ProgressBar from '@/components/FilesView/ProgressBar'
    import { RefreshCwIcon, XIcon } from 'vue-feather-icons'
    import {mapGetters} from 'vuex'
    import {events} from '@/bus'

    export default {
        name: 'CopyProgress',
        components: {
            RefreshCwIcon,
            ProgressBar,
            XIcon,
        },
        computed: {
            ...mapGetters([
                'itemsInCopyQueueTotal',
                'copyItemQueue',
            ]),
            copiedItems() {
                const cnt = this.itemsInCopyQueueTotal - this.copyItemQueue.length
                return cnt
            },
            copyProgress() {
                const percentage = (this.itemsInCopyQueueTotal - this.copyItemQueue.length) * 100 / this.itemsInCopyQueueTotal
                // console.log(percentage)
                return Math.round(percentage)
            },
        },
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .sync-alt {
        animation: spin 1s linear infinite;
        margin-right: 5px;

        polyline, path {
            stroke: $theme;
        }
    }

    @keyframes spin {
        0% {
            transform: rotate(0);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .info-panel-enter-active,
    .info-panel-leave-active {
        transition: all 0.3s ease;
    }

    .info-panel-enter,
    .info-panel-leave-to {
        opacity: 0;
        transform: translateY(-100%);
    }

    .copy-progress {
        width: 100%;
        padding-bottom: 10px;
        position: relative;
        z-index: 1;

        .progress-wrapper {
            display: flex;

            .cancel-icon {
                cursor: pointer;
                padding: 0 13px;

                &:hover {

                    line {
                        stroke: $theme;
                    }
                }
            }
        }

        .progress-title {
            font-weight: 700;
            text-align: center;

            span {
                @include font-size(14);
            }
        }
    }

    @media only screen and (max-width: 690px) {

        .copy-progress {

            .progress-wrapper .cancel-icon {
                padding: 0 9px;
            }
        }
    }

    @media (prefers-color-scheme: dark) {
        .progress-bar {
            background: $dark_mode_foreground;
        }
    }
</style>
