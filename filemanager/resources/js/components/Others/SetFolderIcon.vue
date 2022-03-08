<template>
    <TabWrapper class="set-folder-icon">

        <!-- Emojis -->
        <TabOption :selected="true" id="emoji-list" :title="$t('popup_rename.tab_emoji_title')" icon="emoji">
            <div class="select-emoji-wrapper">
                <label class="main-label">{{ $t('popup_rename.select_emoji_label') }}:</label>

                <!-- Selected Emoji input -->
                <div @click.stop="openMenu" class="select-input-wrapper" :class="{'active-menu' : selectOpen}">

                    <!-- If is emoji selected -->
                    <div class="select-input" v-if="selectedEmoji">
                        <div @click.stop="resetEmoji" class="select-input-icon-wrapper">
                            <x-icon size="14" class="select-input-icon"/>
                        </div>
                        <Emoji class="emoji-preview" :emoji="selectedEmoji" location="emoji-picker-preview" />
                        <span>{{ selectedEmoji.name }}</span>
                    </div>

                    <!-- If is emoji not selected -->
                    <div class="not-selected" v-if="! selectedEmoji">
                        <span> {{ $t('popup_rename.set_emoji_input_placeholder') }}</span>
                    </div>

                    <chevron-down-icon class="row-icon" size="19"/>
                </div>

                <!-- Emojis List -->
                <transition name="slide-in">
                    <div v-if="selectOpen">
                        <!-- Spinner -->
                        <div v-if="!loadedList" class="emoji-wrapper spinner">
                            <Spinner/>
                        </div>

                        <!-- List -->
                        <div v-if="loadedList && emojis" class="emoji-wrapper">

                            <div  @click.stop="" class="emoji-wrapper-header">
                                Emojis List
                                <div class="close" @click.stop="closeMenu()">
                                    <svg data-v-7db04ff5="" xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close-icon feather feather-x"><line data-v-7db04ff5="" x1="18" y1="6" x2="6" y2="18"></line><line data-v-7db04ff5="" x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                            </div>

                            <!-- Search input -->
                            <div @click.stop="" class="emoji-wrapper-body">
                                <input v-shortkey.avoid @paste="onPaste" @click.stop @input="filterEmojis" v-model="searchInput" class="emoji-input" :placeholder="$t('popup_rename.search_emoji_input_placeholder')">

                                <!-- Navigation of Emojis Groups -->
                                <ul v-show="searchInput.length < 1" class="groups-list">
                                    <li @click.stop="scrollToGroup(group.name)" v-for="(group,i) in emojis.emojisGroups" :key="i" class="group-option" :class="{'active' : group.name === groupInView}">
                                        <Emoji :emoji="group.emoji" location="emoji-picker" />
                                    </li>
                                </ul>

                                <!-- All Emojis -->
                                <div v-show="searchInput.length < 1" @scroll="checkGroupInView" id="group-box" class="group-wrapper">
                                    <div v-for="(group, name) in allEmoji" :key="name" class="options-wrapper" :id="`group-${name}`">
                                        <label class="group-name-label">{{ name }}</label>
                                        <ul class="options-list">
                                            <li @click="setIcon({'emoji':emoji})" v-for="(emoji,i) in group" :key="i" class="option">
                                                <Emoji :emoji="emoji" location="emoji-picker" />
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <!-- Searched emojis -->
                                <div v-if="searchInput.length > 0" class="group-wrapper">
                                    <div class="options-wrapper">
                                        <ul class="options-list">
                                            <li @click="setIcon({'emoji':emoji})" v-for="(emoji,i) in filteredEmojis" :key="i" class="option">
                                                <Emoji :emoji="emoji" location="emoji-picker" />
                                            </li>
                                        </ul>
                                        <span class="not-found" v-if="filteredEmojis.length === 0"> {{ $t('popup_rename.emoji_list_not_found') }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </TabOption>

        <!-- Colors -->
        <TabOption :title="$t('popup_rename.tab_color_title')" icon="folder">
            <div class="color-pick-wrapper">
                <label class="main-label">{{ $t('popup_rename.color_pick_label') }}:</label>
                <ul class="color-wrapper">
                    <li v-for="(color, i) in colors" :key="i" @click="setIcon({'color': color})" class="single-color">
                        <check-icon v-if="color === selectedColor" class="color-icon" size="22"/>
                        <span :style="{background:color}" class="color-box"></span>
                    </li>
                </ul>
            </div>
        </TabOption>
    </TabWrapper>
</template>

<script>
import { SmileIcon, FolderIcon, ChevronDownIcon, XIcon, CheckIcon } from 'vue-feather-icons'
import TabWrapper from '@/components/Others/TabWrapper'
import TabOption from '@/components/Others/TabOption'
import Spinner from '@/components/FilesView/Spinner'
import Emoji from '@/components/Others/Emoji'
import { groupBy } from 'lodash'
import { mapGetters } from 'vuex'
import { events } from '@/bus'

export default {
    name: 'SetFolderIcon',
    props: ['folderData', 'unique_id'],
    components: {
        ChevronDownIcon,
        TabWrapper,
        FolderIcon,
        SmileIcon,
        CheckIcon,
        TabOption,
        Spinner,
        XIcon,
        Emoji
    },
    computed: {
        ...mapGetters(['emojis']),
        allEmoji() {
            return groupBy(this.emojis.emojisList, 'group')
        }
    },
    data() {
        return {
            selectedEmoji: undefined,
            selectedColor: undefined,
            searchInput: '',
            filteredEmojis: [],
            selectOpen: false,
            loadedList: false,
            groupInView: 'Smileys & Emotion',
            colors: [
                '#41B883',
                '#FE6F6F',
                '#FE6F91',
                '#FE6FC0',
                '#FE6FF0',
                '#DD6FFE',
                '#AD6FFE',
                '#7D6FFE',
                '#6F90FE',
                '#6FC0FE',
                '#6FF0FE',
                '#6FFEDD',
                '#6FFEAD',
                '#6FFE7D',
                '#90FE6F',
                '#C0FE6F',
                '#F0FE6F',
                '#FEDD6F',
                '#FEAD6F',
                '#FE7D6F',
                '#4c4c4c',
                '#06070B',
            ]
        }
    },
    methods: {
        checkGroupInView: _.debounce(function() {

            this.emojis.emojisGroups.forEach(group => {

                let element = document.getElementById(`group-${group.name}`).getBoundingClientRect()
                let groupBox = document.getElementById('group-box').getBoundingClientRect()

                // Check if the group is in the viewport of group-box
                if (element.top < groupBox.top && element.bottom > groupBox.top) {
                    this.groupInView = group.name
                }
            })

        }, 200),
        onPaste() {

        },
        scrollToGroup(name) {

            let group = document.getElementById(`group-${name}`)

            group.scrollIntoView({ behavior: 'smooth' })

            this.groupInView = name
        },
        filterEmojis: _.debounce(function(emoji) {

            this.filteredEmojis = this.emojis.emojisList.filter(emoji => emoji.name.includes(this.searchInput))

        }, 800),
        openMenu() {

            this.selectOpen = !this.selectOpen

            //Load emojis
            if (this.selectOpen) {
                this.$store.dispatch('getEmojisList').then((loaded) => {
                    this.loadedList = loaded
                })
            }

            if (!this.selectOpen)
                this.loadedList = false

            this.searchInput = ''

            this.groupInView = 'Smileys & Emotion'
        },
        setIcon(value) {

            // Set emoji
            if (value.emoji) {
                this.selectedEmoji = value.emoji
                this.selectedColor = undefined
            }

            // Set color
            if (value.color) {
                this.selectedColor = value.color
                this.selectedEmoji = undefined
            }

            events.$emit('setFolderIcon', { 'value': value })

            this.selectOpen = false
        },
        resetEmoji() {

            this.selectedEmoji = undefined

            events.$emit('setFolderIcon', { 'value': 'default' })
        },
        closeMenu(){
            this.selectOpen = false
        }
    },
    mounted() {

        this.selectOpen = false

        // If folder have already set some emoji set this emoji to selected emoji
        this.folderData.icon_emoji ? this.selectedEmoji = this.folderData.icon_emoji : ''

        // If folder have already set some color set this color to selected color
        this.folderData.icon_color ? this.selectedColor = this.folderData.icon_color : ''

        events.$on('unClick', () => {

            this.selectOpen = false

            this.loadedList = false
        })
    }
}
</script>

<style scoped lang="scss">
@import "@assets/vue-file-manager/_inapp-forms.scss";
@import '@assets/vue-file-manager/_forms';

.color-pick-wrapper {
    .color-wrapper {
        margin-bottom: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, 32px);
        justify-content: space-between;
        gap: 7px;

        .single-color {
            height: 31px;
            list-style: none;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;

            .color-icon {
                z-index: 2;

                polyline {
                    stroke: white;
                }
            }

            .color-box {
                width: 100%;
                height: 100%;
                position: absolute;
                display: block;
            }
        }
    }
}

.select-emoji-wrapper {
    margin-bottom: 20px;
}

.main-label {
    // @include font-size(14);
    // font-weight: 700;
    @include font-size(12);
    font-weight: normal;
    margin-bottom: 8px;
    display: block;
}

.emoji-wrapper {
    // height: 400px;
    // width: 100%;
    // position: absolute;
    // border: 1px solid transparent;
    // box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12);
    // border-radius: 0px;
    // background: white;
    // display: flex;
    // flex-direction: column;
    // padding: 10px;
    // z-index: 10;
    // top: 120px;

    height: 70%;
    width: 70%;
    position: fixed;
    border: 1px solid transparent;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12);
    border-radius: 0px;
    background: white;
    display: flex;
    flex-direction: column;
    padding: 0px;
    z-index: 10;
    top: 15%;
    left:15%;    

    &.spinner{
        background:transparent;
        box-shadow:none;
    }
    .emoji-wrapper-header{
        background-color:#3f3f3f;
        padding:0.4em 1em;
        color:#ddd;
        font-size:14px;
        font-weight:bold;
        margin-bottom:5px;
        .close{
            display:inline-block;           
            vertical-align:middle;
            float: right;
            height:20px;
            cursor:pointer;
        }         
    }

    .emoji-wrapper-body{
        padding: 10px;
        height:calc(100% - 36px);

        .groups-list {
            display: grid;
            grid-template-columns: repeat(9, auto);
            justify-content: space-between;
            overflow-x: auto;
            overflow-y: hidden;
            height: 50px;

            .active {
                background: $light_background;
                border-radius: 8px;
            }

            .group-option {
                width: 45px;
                height: 45px;
                list-style: none;
                padding: 6px;
                cursor: pointer;

                &:hover {
                    background: $light_background;
                    border-radius: 8px;
                }
            }
        }

        .emoji-input {
            width: 100%;
            border-radius: 0px;
            padding: 4px;
            margin-bottom: 20px;
            background: $light_background;
            border: none;
            padding: 5px 10px;
            font-weight: normal;
            font-size:12px;

            &::placeholder {
                font-weight: normal;
                color: $light_text;
            }
        }

        .group-wrapper {
            height: calc(100% - 87px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            overflow-y: scroll;
            padding: 0px;

            .options-wrapper {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 10px;

                &:last-child {
                    margin-bottom: 0px;
                }

                .options-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, 45px);
                    justify-content: space-between;
                    width: 100%;
                }

                .group-name-label {
                    width: 100%;
                    @include font-size(10);
                    font-weight: normal;
                    margin-bottom: 10px;
                    color:#aaa;
                }

                .option {
                    list-style: none;
                    width: 45px;
                    height: 45px;
                    padding: 6px;
                    cursor: pointer;

                    &:hover {
                        background: $light_background;
                        border-radius: 8px;
                    }
                }

                .not-found {
                    align-self: center;
                    margin: auto;
                    font-weight: 700;
                    padding: 10px;
                    border-radius: 8px;
                    background: $light_background;
                    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12);
                }
            }
        }
    }
}
.select-input-wrapper {
    // height: 50px;
    // padding: 13px 20px;
    // border: 1px solid transparent;
    // border-radius: 8px;
    // box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12);
    // cursor: pointer;
    // display: flex;
    // justify-content: space-between;
    // align-items: center;
    // border: 1px solid transparent;

    // height: 50px;
    padding: 5px 10px;
    border: 1px solid #aaa;;
    border-radius: 0px;
    box-shadow: none;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @include transition(150ms);

    .row-icon {
        @include transition(150ms);
    }

    &.active-menu {
        border-color: $theme;
        box-shadow: 0 0 7px rgba($theme, 0.3);

        .row-icon {
            transform: rotate(180deg);
        }
    }

    .select-input {
        @include font-size(16);
        font-weight: 700;
        display: flex;
        flex-direction: row;
        align-items: center;

        .emoji-preview {
            margin-left: 5px;
            margin-right: 10px;
            // width: 22px;
            // height: 22px;
            width: 16px;
            height: 16px;
        }

        .select-input-icon-wrapper {
            width: 22px;
            height: 22px;
            border-radius: 6px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-left: -7px;

            &:hover {

                .select-input-icon {
                    line {
                        stroke: $theme;
                    }
                }
            }

            .select-input-icon {
                line {
                    stroke: $text;
                }
            }
        }
        span{
            font-size:12px; 
            font-weight:normal;
        }
    }

    .not-selected {
        span {
            color: rgba($text, 0.5);
            // @include font-size(15);
            // font-weight: 700
            font-size:12px;
            font-weight:normal;
        }
    }
}

.set-folder-icon {
    position: relative;
}

.slide-in-enter-active {
    // transition: all 150ms ease;
}

.slide-in-enter {
    opacity: 0;
    transform: translateY(-210px);
}

.slide-in-enter-to {
    transform: translateY(-134px);
}

@media (max-width: 690px) {
    .emoji-wrapper {
        height: 300px;
    }
}

@media (max-width: 336px) {
    .emoji-wrapper {
        top: 173px;
    }
}

@media (prefers-color-scheme: dark) {
    .color-pick-wrapper {
        .color-wrapper {
            .single-color {
                &.active-color {
                    border: 2px solid;
                }

                &:hover {
                    border: 2px solid $dark_mode_text_primary;
                }
            }
        }
    }

    .emoji-wrapper {
        background: $dark_mode_background;
        .emoji-wrapper-body{
            
            .emoji-input {
                background: $dark_mode_foreground;
            }

            .groups-list {
                .active {
                    background: $dark_mode_foreground !important;
                }

                .group-option {
                    &:hover {
                        background: $dark_mode_foreground !important;
                    }
                }
            }

            .options-wrapper {
                .option {
                    &:hover {
                        background: $dark_mode_foreground !important;
                    }
                }

                .not-found {
                    background: $dark_mode_foreground !important;
                }
            }
        }
    }

    .select-input-wrapper {
        background: $dark_mode_foreground;

        .not-selected {
            span {
                color: $dark_mode_text_secondary;
            }
        }

        .select-input-icon-wrapper {
            &:hover {
                .select-input-icon {
                    line {
                        stroke: $theme !important;
                    }
                }
            }

            .select-input-icon {
                line {
                    stroke: $dark_mode_text_primary !important;
                }
            }
        }
    }
}

</style>
