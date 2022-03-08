<template>
    <div class="actions">
        <slot></slot>
    </div>
</template>

<script>
    export default {
        name: 'PopupActions',
    }
</script>

<style lang="scss" scoped>
    @import '@assets/vue-file-manager/_variables';
    @import '@assets/vue-file-manager/_mixins';

    .actions {
        padding: 0 0 20px;
        margin: 0px;
        width:100%;
        display: flex;
        justify-content: center;

        .popup-button {
            // width: 100%;
            // margin: 0 10px;

            background: #fff;
            border: 1px solid #aaa;
            padding: 10px 20px;            
            margin: 0 2px !important;
            display: inline-block;            
            border-radius: 0;   

            .content{
                font-size: 12px;
                color: #666;
            }   
        }
    }

    @media only screen and (max-width: 690px) {
        .actions {
            padding: 15px;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
        }
    }

    @media only screen and (max-width: 320px) {
        .actions {
            position: unset;
        }
    }
    @media (prefers-color-scheme: dark) {
        .actions {
            .popup-button{
                background-color:$dark_mode_background !important;
                border:1px solid #666;                
            }  
        }
    }
</style>
