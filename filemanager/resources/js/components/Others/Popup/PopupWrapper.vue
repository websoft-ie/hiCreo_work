<template>
    <transition name="popup">
        <div class="popup" v-if="isVisibleWrapper">
            <div class="popup-wrapper" :class="{ 'fileinfo-preview': name === 'fileinfo-preview' }">
                <slot></slot>
            </div>
        </div>
    </transition>
</template>

<script>
    import {events} from '@/bus'
    import {mapGetters} from 'vuex'

    export default {
        name: 'PopupWrapper',
        props: [
            'name'
        ],
        computed: {
            ...mapGetters([
                'data',
                'status',
            ]),  
        },        
        data() {
            return {
                isVisibleWrapper: false,
            }
        },
        methods: {
            closePopup() {
                events.$emit('popup:close')
                this.status['IS_SHOW_PREVIEW'] = false
            }
        },
        created() {

            // Open called popup
            events.$on('popup:open', ({name}) => {

                if (this.name === name)
                    this.isVisibleWrapper = true
            })

            // Open called popup
            events.$on('confirm:open', ({name}) => {

                if (this.name === name)
                    this.isVisibleWrapper = true
            })

            // Close popup
            events.$on('popup:close', () => {
                document.getElementById('file-content-id').focus()
                this.isVisibleWrapper = false
                this.status['IS_SHOW_CONFIRM_DELETE'] = false
                this.status['IS_SHOW_PREVIEW'] = false
                this.$store.commit('CLEAR_FILEINFO_PREV')
            })
        }
    }
</script>

<style lang="scss" scoped>
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .fileinfo-preview {
        width: 512px !important;
        // height: 500px !important;
    }
    .popup {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 19;
        overflow-y: auto;
        display: grid;
        padding: 40px;
        height: 100%;
    }

    .popup-wrapper {
        box-shadow: $light_mode_popup_shadow;
        border-radius: 0px;
        background: white;
        margin: auto;
        width: 400px;
        z-index: 12;
    }

    // Desktop, tablet
    .medium, .large {
        // Animations
        .popup-enter-active {
            animation: popup-in 0.35s 0.15s ease both;
        }

        .popup-leave-active {
            animation: popup-in 0.15s ease reverse;
        }
    }

    @keyframes popup-in {
        0% {
            opacity: 0;
            transform: scale(0.7);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes popup-slide-in {
        0% {
            transform: translateY(100%);
        }
        100% {
            transform: translateY(0);
        }
    }

    @media only screen and (max-width: 690px) {
        .popup {
            overflow: hidden;
        }
        .popup-wrapper {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            transform: translateY(0) scale(1);
            box-shadow: none;
            width: 400px;
            height: 500px;
            border-radius: 0px;
        }
        // Animations
        .popup-enter-active {
            animation: popup-slide-in 0.35s 0.15s ease both;
        }
        .popup-leave-active {
            animation: popup-slide-in 0.15s ease reverse;
        }
    }

    @media only screen and (max-width: 320px){
        .popup-wrapper {
            overflow-y: auto;
        }
    }

    @media (prefers-color-scheme: dark) {
        .popup-wrapper {
            background: $dark_mode_background;
            box-shadow: $dark_mode_popup_shadow;
            border:1px solid #666;
        }
    }

    @media (prefers-color-scheme: dark) and (max-width: 690px) {
        .popup-wrapper {
            background: $dark_mode_background;
            border:1px solid #666;      
        }
    }
</style>
