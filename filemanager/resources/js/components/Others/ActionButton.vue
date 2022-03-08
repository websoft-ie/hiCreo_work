<template>
    <div class="action-button">
        <!-- <x-icon size="12" class="icon" v-if="icon === 'x'"></x-icon>
        <edit-2-icon size="12" class="icon" v-if="icon === 'pencil-alt'"></edit-2-icon> -->
        <span class="label">
            <slot></slot>
        </span>
        <div class="action-toggle-bg" v-bind:class="[icon === 'x' ? 'opened' : 'closed']">
            <div class="action-toggle-btn">
            </div>
        </div>
    </div>
</template>

<script>
    import { Edit2Icon, XIcon } from 'vue-feather-icons'

    export default {
        name: 'ActionButton',
        props: ['icon'],
        components: {
            Edit2Icon,
            XIcon,
        }
    }
</script>

<style lang="scss" scoped>
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .action-button {
        cursor: pointer;
        padding:5px 10px;
        margin-bottom:5px;
        text-align:right;

        .label {
            @include font-size(10);
            // font-weight: 600;
            font-weight:normal;
            color:#666;
            vertical-align:middle;
        }

        .icon {
            @include font-size(10);
            vertical-align: middle;
            display: inline-block;
            margin-right: 2px;

            path, circle, line {
                stroke: $theme;
            }
        }
    }
    .action-toggle-bg{
        width:30px;
        height:15px;        
        border-radius:7px;
        display:inline-block;
        vertical-align:middle;

        .action-toggle-btn{
            width:13px; 
            height:13px;
            border-radius:50%;
            background-color:#fff;
            transition:transform 0.3s ease-in-out;
        }

        &.opened{
            background:#0066ff;
            border:1px solid #aaa;

            .action-toggle-btn{
                transform:translateX(0);
            } 
        }
        &.closed{
            background:#666;
            border:1px solid #aaa;

            .action-toggle-btn{
                transform:translateX(15px);
            } 
        }        
    }
    @media (prefers-color-scheme: dark) {

    }
</style>
