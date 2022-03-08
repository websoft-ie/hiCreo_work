<template>
    <div class="content-group" :class="{'is-collapsed': ! isVisible, 'collapsable': canCollapse}">

        <div class="group-title" @click="hideGroup">
            <TextLabel class="title">{{ title }}</TextLabel>
            <chevron-up-icon v-if="canCollapseWrapper" size="12" class="icon" />
        </div>
        <transition name="list">
            <!-- <div class="wrapper" v-show="isVisible">
                <span class="empty-note navigator" v-if="tree.length == 0">
                {{ $t('sidebar.folders_empty') }}
            </span><TreeMenuNavigator class="folder-tree" :depth="0" :nodes="items" v-for="items in tree" :key="items.unique_id" /> -->
            <div>
                <slot></slot>
            </div>
        </transition>
    </div>
</template>

<script>
    import TextLabel from '@/components/Others/TextLabel'
    import { ChevronUpIcon } from 'vue-feather-icons'

    export default {
        name: 'ContentGroup',
        props: ['title', 'canCollapse', 'slug'],
        components: {
            ChevronUpIcon,
            TextLabel,
        },
        data() {
            return {
                isVisible: true,
                canCollapseWrapper: false
            }
        },
        methods: {
            
            
            hideGroup() {
                if (! this.canCollapseWrapper)
                    return

                this.isVisible = !this.isVisible
                localStorage.setItem('panel-group-' + this.slug, this.isVisible)
            }
        },
        created() {

            if (this.canCollapse) {

                let savedVisibility = localStorage.getItem('panel-group-' + this.slug)

                this.isVisible = savedVisibility ? !!JSON.parse(String(savedVisibility).toLowerCase()) : true
                this.isVisible = true
                this.canCollapseWrapper = true
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@assets/vue-file-manager/_mixins';

    .content-group {
        /*hiCreo margin-bottom: 30px;*/
        transition: all 300ms;

        &.navigator{
            height:calc(100% - 82px);


        }
        .group-title {
            display: flex;
            display: none;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;

            .title {
                margin-bottom: 0;
            }

            .icon {
                margin-right: 19px;
                opacity: 0.25;
                @include transition;
            }
        }

        &.collapsable {
            .group-title {
                cursor: pointer;
            }
        }

        &.is-collapsed {
            margin-bottom: 15px;

            .icon {
                @include transform(rotate(180deg));
            }

        }
          
    }

    .list-enter,
    .list-leave-to {
        visibility: hidden;
        height: 0;
        margin: 0;
        padding: 0;
        opacity: 0;
    }

    .list-enter-active,
    .list-leave-active {
        transition: all 300ms;
    }
</style>
