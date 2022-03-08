<template>
    <div class="search-bar">
        <!-- <div class="icon" v-if="!isQuery"> -->
            <!-- <search-icon size="19"></search-icon> -->
        <!-- </div> -->

        <input  v-shortkey.avoid
                @paste="onPaste"
                v-model="query"
                class="query"
                type="text"
                name="query"
                :placeholder="$t('inputs.placeholder_search_files')"
        />

        <div class="icon search_clear" v-if="isQuery" @click="resetQuery">
            <!-- <x-icon class="pointer" size="19"></x-icon> -->
        </div>        
    </div>
</template>

<script>
    import { SearchIcon, XIcon } from 'vue-feather-icons'
    import {mapGetters} from 'vuex'
    import {debounce} from 'lodash'
    import {events} from '@/bus'

    export default {
        name: 'SearchBar',
        components: {
            SearchIcon,
            XIcon,
        },
        computed: {
            ...mapGetters(['currentFolder']),
            isQuery() {
                return this.query !== '' && typeof this.query !== 'undefined'
            }
        },
        data() {
            return {
                query: ''
            }
        },
        watch: {
            query(val) {
                return this.getResult(val)
            }
        },
        methods: {
            onPaste() {

            },
            resetQuery() {
                this.query = ''
            },
            getResult: debounce(function (value) {
                if (this.isQuery) {
                    // Get search result if query is not empty
                    this.$store.dispatch('getSearchResult', value)
                } else if (typeof value !== 'undefined') {
                    if (this.currentFolder) {

                        // Get back after delete query to previosly folder
                        if ( this.$isThisLocation('public') ) {
                            this.$store.dispatch('browseShared', [{folder: this.currentFolder, back: true, init: false}])
                        } else {
                            this.$store.dispatch('getFolder', [{folder: this.currentFolder, back: true, init: false}])
                        }
                    }

                    this.$store.commit('CHANGE_SEARCHING_STATE', false)
                }
            }, 300)
        },
        created() {
            events.$on('clear-query', () => (this.query = undefined))
        }
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .search-bar {
        position: relative;

        input {
            background: transparent;
            outline: 0;
            // padding: 9px 20px 9px 43px;
            padding: 5px 20px 5px 30px;
            background-image: url(https://editor.hicreo.com/web/image/portfolio/search_btn.svg);
	        background-repeat:no-repeat;
            background-size:24px;
	        background-position:left center;
            border: none;
            border-bottom: 1px solid #aaa;
            font-weight: 400;
            @include font-size(16);
            min-width: 175px;
            transition: 0.15s all ease;            
            -webkit-appearance: none;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;

            &:hover{
                border-bottom: 1px solid #666;
                background-image: url(https://editor.hicreo.com/web/image/portfolio/search_btn_hover.svg);
            }

            &::placeholder {
                color: $text;
                @include font-size(14);
                font-weight: 500;
            }

            // &:focus {
            //     border: 1px solid $theme;
            //     box-shadow: 0 0 7px rgba($theme, 0.3);
            // }

            // &:focus + .icon {
            //     path {
            //         fill: $theme;
            //     }
            // }
        }

        .icon {
            
            // position: absolute;
            // top: 0;
            // left: 0;
            // padding: 11px 15px;

            &.search_clear{
                position: absolute;
                right: 0px;
                top: 10px;
                cursor: pointer;
                display: block;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='23' height='23'><path style='fill:%23666666;' d='M8.9,7.5l6.1,6.1L13.6,15L7.5,8.9L1.4,15L0,13.6l6.1-6.1L0,1.4L1.4,0l6.1,6.1L13.6,0L15,1.4L8.9,7.5z'/></svg>");
                background-position:6px 6px; 
                background-size:16px; 
                background-repeat:no-repeat; 
                cursor:pointer;
                width:20px; 
                height:20px; 
            }

            .pointer {
                cursor: pointer;
            }
        }
    }

    @media only screen and (max-width: 1024px) {

        .search-bar input {
            max-width: 190px;
            padding-right: 16px;
        }
    }

    @media only screen and (max-width: 690px) {

        .search-bar {

            input {
                min-width: initial;
                width: 100%;
                max-width: initial;
                padding: 9px 20px 9px 30px;

                &:focus {
                    border: 1px solid transparent;
                    box-shadow: none;
                }
            }

            .icon {
                padding: 11px 15px 11px 0;
            }
        }

    }

    @media (prefers-color-scheme: dark) {
        .search-bar {
            input {
                border-color: transparent;
                color: $dark_mode_text_primary;

                &::placeholder {
                    color: $dark_mode_text_secondary;
                }
            }

            .icon svg path {
                fill: $dark_mode_text_secondary;
            }
        }
    }
</style>
