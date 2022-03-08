<template>
    <div id="vue-file-manager" v-cloak @click="unClick">

        <!--System alerts-->
        <Alert/>

        <div id="application-wrapper" v-if="! isGuestLayout && isLoadedTranslations">

            <!-- Create language popup -->
            <CreateLanguage/>

            <!-- Full File Preview -->
            <FileFullPreview/>

            <!-- File Information Preview -->
            <FileInfoPanel/>

            <!--Mobile Navigation-->
            <MobileNavigation/>

            <!-- Processing popup for zip -->
            <ProcessingPopup/>

            <!--Confirm Popup-->
            <Confirm/>

            <!--Share Item setup-->
            <ShareCreate/>
            <ShareEdit/>

            <!--Rename folder or file item-->
            <RenameItem/>
             
            <!-- Confirm the permanent delete -->
            <ConfirmDelete/>

            <!--Create folder in mobile version-->
            <CreateFolder/>

            <!--Move item setup-->
            <MoveItem/>

            <!-- Mobile Menu for Multiselected items -->
            <MobileMultiSelectMenu/>

            <!--  Drag & Drop UI -->
            <DragUI/>

            <!-- Mobile menu for selecting view and sorting -->
            <MobileSortingAndPreview/>

            <!--Mobile Menu-->
            <MobileMenu/>

            <!--Navigation Sidebar-->
            <MenuBar/>

            <!--Toastr-->
            <ToastrWrapper/>

            <!--File page-->
            <keep-alive :include="['Admin', 'Users']">
                <router-view :class="{'is-scaled-down': isScaledDown}"/>
            </keep-alive>
        </div>

        <router-view v-if="isGuestLayout && isLoadedTranslations"/>

        <!-- <CookieDisclaimer/> -->

        <Vignette/>
    </div>
</template>

<script>
import MobileSortingAndPreview from '@/components/FilesView/MobileSortingAndPreview'
import MobileMultiSelectMenu from '@/components/FilesView/MobileMultiSelectMenu'
import ToastrWrapper from '@/components/Others/Notifications/ToastrWrapper'
import ProcessingPopup from '@/components/FilesView/ProcessingPopup'
import FileFullPreview from '@/components/FilesView/FileFullPreview'
import FileInfoPanel from '@/components/FilesView/FileInfoPanel'
import MobileNavigation from '@/components/Others/MobileNavigation'
import CookieDisclaimer from '@/components/Others/CookieDisclaimer'
import CreateLanguage from '@/components/Others/CreateLanguage'
import CreateFolder from '@/components/Others/CreateFolder'
import MobileMenu from '@/components/FilesView/MobileMenu'
import ShareCreate from '@/components/Others/ShareCreate'
import Confirm from '@/components/Others/Popup/Confirm'
import RenameItem from '@/components/Others/RenameItem'
import ConfirmDelete from '@/components/Others/ConfirmDelete'
import ShareEdit from '@/components/Others/ShareEdit'
import MoveItem from '@/components/Others/MoveItem'
import Vignette from '@/components/Others/Vignette'
import DragUI from '@/components/FilesView/DragUI'
import MenuBar from '@/components/Sidebar/MenuBar'
import Alert from '@/components/FilesView/Alert'
import { includes } from 'lodash'
import { mapGetters } from 'vuex'
import { events } from './bus'

export default {
    name: 'app',
    components: {
        MobileSortingAndPreview,
        MobileMultiSelectMenu,
        MobileNavigation,
        CookieDisclaimer,
        FileFullPreview,
        FileInfoPanel,
        ProcessingPopup,
        CreateLanguage,
        ToastrWrapper,
        CreateFolder,
        ShareCreate,
        MobileMenu,
        RenameItem,
        ConfirmDelete,
        ShareEdit,
        MoveItem,
        Vignette,
        Confirm,
        MenuBar,
        DragUI,
        Alert
    },
    computed: {
        ...mapGetters([
            'isLogged', 'isGuest', 'config', 'fileQueue'
        ]),
        isGuestLayout() {
            return (includes([
                    'InstallationDisclaimer',
                    'SubscriptionService',
                    'StripeCredentials',
                    'SubscriptionPlans',
                    'ForgottenPassword',
                    'CreateNewPassword',
                    'EnvironmentSetup',
                    'VerifyByPassword',
                    'SaaSLandingPage',
                    'BillingsDetail',
                    'NotFoundShared',
                    'AdminAccount',
                    'PurchaseCode',
                    'DynamicPage',
                    'SharedPage',
                    'ContactUs',
                    'AppSetup',
                    'Database',
                    'Upgrade',
                    'SignIn',
                    'SignUp'
                ], this.$route.name)
            )
        }
    },
    data() {
        return {
            isScaledDown: false,
            isLoadedTranslations: false,
        }
    },
    methods: {
        unClick() {
            events.$emit('unClick')
        }
    },
    beforeCreate() {
        //jw20211110 test mode
        /* var form = document.createElement("form");
        var frm_email = document.createElement("input"); 
        var frm_password = document.createElement("input");  
        form.method = "POST";
        form.action = "/api/user/mylogin";   
        frm_email.name="email";
        frm_email.value='user1@user.com';
        form.appendChild(frm_email);  
        frm_password.name="password";
        frm_password.value='123456';
        form.appendChild(frm_password);
        document.body.appendChild(form);
        form.submit(); */
        /* const _oReq = new XMLHttpRequest();
        _oReq.addEventListener('load', function(event) {
            console.log("🚀 ~ file: App.vue ~ line 175 ~ _oReq.addEventListener ~ event", event.target.responseText)
        }, false);
        _oReq.open('POST', 'https://editor.hicreo.com/web/communication/session_api.php', true);
        _oReq.send(); */
        /* const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const _hiCreo_userID = urlParams.get('id')
        if(!_hiCreo_userID) {
            console.log("out")
            return
        } */
        
        axios
        .post('/api/user/hiCreoLogin')
        .then(response => {
            //console.log("🚀 ~ file: App.vue ~ line 192 ~ beforeCreate ~ response", response)
            if(response.data.token_type === 'Bearer'){
                this.$store.commit('SET_AUTHORIZED', true)
                this.$router.push({name: 'Files'})
            }
        })
        .catch(error => {
            //console.log("🚀 ~ file: App.vue ~ line 195 ~ beforeCreate ~ error", error)
            if (error.response.status == 400 || error.response.status == 500){
                axios
                .post('/api/user/register')
                .then((response) => {
                    this.isLoading = false
                    this.$store.commit('SET_AUTHORIZED', true)
                    this.$router.push({name: 'Files'})
                })
                .catch(error => {
                    if (error.response.status == 401) {
                        if (error.response.data.error === 'invalid_client') {
                            events.$emit('alert:open', {
                                emoji: '🤔',
                                title: this.$t('popup_passport_error.title'),
                                message: this.$t('popup_passport_error.message')
                            })
                        }
                    }

                    if (error.response.status == 500) {

                        events.$emit('alert:open', {
                            emoji: '🤔',
                            title: this.$t('popup_signup_error.title'),
                            message: this.$t('popup_signup_error.message')
                        })
                    }

                    if (error.response.status == 422) {

                        if (error.response.data.errors['email']) {

                            this.$refs.sign_up.setErrors({
                                'E-Mail': error.response.data.errors['email']
                            });
                        }

                        if (error.response.data.errors['password']) {

                            this.$refs.sign_up.setErrors({
                                'Your New Password': error.response.data.errors['password']
                            });
                        }
                    }

                    // End loading
                    this.isLoading = false
                })
            }
            else{
                console.log("Unknown-Error")
            }
            
        }) 
    },
    beforeMount() {

        // Get language translations
        this.$store.dispatch('getLanguageTranslations', this.$root.$data.config.language)
            .then(() => {
                this.isLoadedTranslations = true

                // Store config to vuex
                this.$store.commit('INIT', {
                    authCookie: this.$root.$data.config.hasAuthCookie,
                    config: this.$root.$data.config,
                    rootDirectory: {
                        name: this.$t('locations.home'),
                        location: 'base',
                        unique_id: 0
                    }
                })
            })
        // // Get installation state
        // let installation = this.$root.$data.config.installation

        // // Redirect to database verify code
        // if (installation === 'setup-database')
        //     this.$router.push({ name: 'PurchaseCode' })

        // // Redirect to starting installation process
        // if (installation === 'setup-disclaimer')
        //     this.$router.push({ name: 'InstallationDisclaimer' })
    },
    mounted() {

        this.$checkOS()

        // Handle mobile navigation scale animation
        events.$on('show:mobile-navigation', () => this.isScaledDown = true)
        events.$on('hide:mobile-navigation', () => this.isScaledDown = false)
        events.$on('mobileMenu:show', () => this.isScaledDown = true)
        events.$on('fileItem:deselect', () => this.isScaledDown = false)
        events.$on('mobileSortingAndPreview', state => this.isScaledDown = state)
    }
}

//hiCreo
window.onload = function() {
  // Get a reference to the div on the page that will display the
  // message text.
  //var messageEle = document.getElementById('message');

  // A function to process messages received by the window.
  function receiveMessage(e) {
    // Check to make sure that this message came from the correct domain.
    if (e.origin !== "https://editor.hicreo.com")
      return;
    const _data = JSON.parse(e.data.replace(/'/g, '"'))
    
    if(_data.type === 'editor'){
        if(_data.action === 'setHic'){
            //console.log("🚀 ~ file: App.vue ~ line 307 ~ receiveMessage ~ _data", _data)
            hiCreoEventHandler({type:'receiver', action:'loadHic', file : _data.file, courseID : _data.courseID, theme : _data.theme})
        }
    }
  }

  // Setup an event listener that calls receiveMessage() when the window
  // receives a new MessageEvent.
  window.addEventListener('message', receiveMessage);

  //setTimeout(() => {
        /* var reader1 = new FileReader();

        reader1.addEventListener('load', e => {
        console.log("🚀 ~ file: App.vue ~ line 322 ~ reader1 load ~ e", e)
            document.querySelector('#img111').src = e.target.result;
        });
        document.forms.pickfile.file.value = "D:/test.png"
        document.forms.pickfile.file.addEventListener('change', e => {
            console.log("🚀 ~ file: App.vue ~ line 328 ~ change ~ e", e)
                reader1.readAsDataURL(e.target.files[0]);
            }); */

        /* function FileListItems (files) {
            var b = new ClipboardEvent("").clipboardData || new DataTransfer()
            for (var i = 0, len = files.length; i<len; i++) {
                b.items.add(files[i])
            }
            return b
        }

        var files = [
        new File(['<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="blue" width="200" height="200" x="0" y="0"/></svg>'], 'test.png'),
        new File(['abc'], 'sample2.txt')
        ];


        var aaaa = new FileListItems(files)
        console.log(aaaa) */
    //}, 2000)
}
window.hiCreoEventHandler = (param) => {
    const {type: _type, action: _action} = param
    //console.log("🚀 ~ file: App.vue ~ line 363 ~ param", param)
    if(_type === 'sender'){

        const {data: _data} = param
        const _sendingdata = {type: "filemanager", action: _action, data: _data};
        const _editorUrl = "https://editor.hicreo.com"

        if(_action === 'saveToLibrary.selectedItem'){
            //console.log("🚀 ~ file: App.vue ~ line 370 ~ _sendingdata", _sendingdata.data)
            if(_sendingdata.data !== undefined){
                const _formData = new FormData();
                _formData.append('action', 'getCurrentDirPath');
                _formData.append('id', _data.id);
                axios
                .post('hiCreoAPI.php', _formData)
                .then(response => {
                    const _path = response.data.dirPath
                    _sendingdata.data.dirPath = _path
                    if(parent.length !== 0 ) parent.postMessage(JSON.stringify(_sendingdata), _editorUrl);
                })
            }
        }else{
            //addToPage, getHic, UpdateStorageUsage, showUserStorageWindow 
            if(parent.length !== 0 ) parent.postMessage(JSON.stringify(_sendingdata), _editorUrl);
        }
    }else if(_type === 'receiver'){
        if(_action === 'loadHic'){
            const { url: _url, file : _file, courseID : _courseID, theme : _theme} = param
            /* const _header = 'https://editor.hicreo.com/authoring/tool_box/R023_preview.php?hic='
            const _hicContainer = document.querySelector('#hicContainer')
            _hicContainer.src = _header + _url
            _hicContainer.setAttribute('file', _url)
            _hicContainer.addEventListener( "load", function(e) {
                
            }) */
            const _hicContainer = document.querySelector('#hicContainer')
            _hicContainer.setAttribute('file', _file)

            const _form = document.createElement("form");
            const _frm_file = document.createElement("input"); 
            const _frm_courseID = document.createElement("input");  
            const _frm_theme = document.createElement("input");  
            _form.target = "hicContainer";
            _form.method = "POST";
            _form.action = "https://editor.hicreo.com/authoring/tool_box/R023_preview.php"; 
            _frm_file.type='hidden'
            _frm_file.name="file";
            _frm_file.value=_file;
            _form.appendChild(_frm_file);   
            _frm_courseID.type='hidden'
            _frm_courseID.name="courseID";
            _frm_courseID.value=_courseID;
            _form.appendChild(_frm_courseID);  
            _frm_theme.type='hidden'
            _frm_theme.name="theme";
            _frm_theme.value=_theme;
            _form.appendChild(_frm_theme);
            document.body.appendChild(_form);
            _form.submit();
            _form.remove();
        }else if(_action === 'check_user_storage_capacity'){
            axios.get('/api/user/storage')
            .then(response => {
                //console.log("🚀 ~ file: App.vue ~ line 327 ~ response", response)
            })
        }
    }else if(_type === 'callback'){
        const {callback: _callback} = param
        if(_action === 'check_user_storage_capacity'){
            if(parent.length !== 0 ){
                //hiCreo
                const _formData = new FormData();
                _formData.append('action', 'check_user_storage_capacity');
                axios
                .post('hiCreoAPI.php', _formData)
                .then(response => {
                console.log("🚀 ~ file: App.vue ~ line 438 ~ response", response)
                    const _storageUsageInfo = JSON.parse(response.data.storageUsageInfo)
                    //console.log("🚀 ~ file: App.vue ~ line 438 ~ _storageUsageInfo", _storageUsageInfo)
                    if(_storageUsageInfo.canSave){
                        if (typeof _callback === 'function') {
                            _callback()
                        }
                    }else{
                        hiCreoEventHandler({type:'sender', action:'showUserStorageWindow'})
                    }
                })
            }else{
                if (typeof _callback === 'function') {
                    _callback()
                }
            }
        }
    }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap');
@import '@assets/vue-file-manager/_variables';
@import '@assets/vue-file-manager/_mixins';

[v-cloak],
[v-cloak] > * {
    display: none
}

* {
    outline: 0;
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    font-size: 16px;
    text-decoration: none;
    // color: $text;
}

#auth {
    width: 100%;
    height: 100%;
}

#vue-file-manager {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    scroll-behavior: smooth;
    overflow-x:hidden;
}

@media only screen and (max-width: 690px) {

    .is-scaled-down {
        @include transform(scale(0.95));
    }
}

// Dark mode support
@media (prefers-color-scheme: dark) {

    * {
        color: $dark_mode_text_primary;
    }

    body, html {
        background: $dark_mode_background;
        color: $dark_mode_text_primary;

        img {
            opacity: .95;
        }
    }
}
</style>
