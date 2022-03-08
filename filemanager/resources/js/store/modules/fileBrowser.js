import Vue from "vue"
import axios from 'axios'
import { events } from '@/bus'
import router from '@/router'
import i18n from '@/i18n/index'

const defaultState = {
  fileInfoDetail: [],
  fileInfoPreview: [],
  selectedItems: [],
  curclickedItem: undefined,
  clipBoard: [],
  copyOrCutInfo: false,
  currentFolder: undefined,
  navigation: undefined,
  isSearching: false,
  browseHistory: [],
  isLoading: true,
  focusNameID: 0,
  focusOnName: false,
  focusText: "",
  data: [],
  status: {},
  changedData: false,
  trashItemCnt: 0,
  folderContentCnt: 0,
  busy: false,
  screenItemCnt: 0,
}

const actions = {
  getFolder: ({ commit, getters, dispatch }, [payload]) => {
    commit('LOADING_STATE', { loading: true, data: [] })
    commit('RESET_FOLDER_CNT')
    commit('SET_BUSY', false)
    if (payload.init)
      commit('FLUSH_FOLDER_HISTORY')

    // Clear search
    if (getters.isSearching) {
      commit('CHANGE_SEARCHING_STATE', false)
      events.$emit('clear-query')
    }

    // Set folder location
    payload.folder.location = payload.folder.deleted_at || payload.folder.location === 'trash' ? 'trash' : 'base'

    if (!payload.back && !payload.sorting)
      commit('STORE_PREVIOUS_FOLDER', getters.currentFolder)

    let url = payload.folder.location === 'trash' ?
      '/folders/' + payload.folder.unique_id + getters.sorting.URI + '&trash=true' :
      '/folders/' + payload.folder.unique_id + getters.sorting.URI

    //hiCreo
    if (payload.type) url += '&type=' + payload.type
      //console.log("?? ~ file: fileBrowser.js ~ line 47 ~ url", url)
      //end hiCreo

    url += '&start=0&count=' + getters.screenItemCnt
    axios
      .get(getters.api + url)
      .then(response => {
        //hiCreo
        response.data.forEach((data) => {
            //console.log("?? ~ file: fileBrowser.js ~ line 57 ~ response.data.forEach ~ data", data)
            if (data.type === 'audio') {
              if (data.mimetype === 'mpeg') {
                data.mimetype = 'mp3'
              }
            } else if (data.type === 'file') {
              if (data.mimetype === 'x-tar') {
                const _ext = data.basename.split('.').pop();
                if (_ext === 'hic') data.mimetype = 'hic'
              }
            }

          })
          //end hiCreo

        commit('LOADING_STATE', { loading: false, data: response.data })
        commit('STORE_CURRENT_FOLDER', payload.folder)

        if (payload.back && !payload.sorting)
          commit('REMOVE_BROWSER_HISTORY')

        commit('SORT_DATA')
        events.$emit('scrollTop')
        commit('INCREASE_FOLDER_CNT', response.data.length)
        let folderContentCnt = getters.getFolderContentCnt
          // dispatch('getNextFolder', [{ folder: payload.folder, start: folderContentCnt }])
      })
      .catch(error => {
        //console.log("?? ~ file: fileBrowser.js ~ line 62 ~ error", error)

        // Redirect if unauthenticated
        if (error.response !== undefined && [401, 403].includes(error.response.status)) {

          commit('SET_AUTHORIZED', false)
          router.push({ name: 'SignIn' })

        } else {

          // Show error message
          events.$emit('alert:open', {
            title: i18n.t('popup_error.title'),
            message: i18n.t('popup_error.message'),
          })
        }
      })
  },
  getNextFolder: ({ commit, getters, dispatch }, [payload]) => {

    // Set folder location
    payload.folder.location = payload.folder.deleted_at || payload.folder.location === 'trash' ? 'trash' : 'base'

    let url = payload.folder.location === 'trash' ?
      '/folders/' + payload.folder.unique_id + getters.sorting.URI + '&trash=true' :
      '/folders/' + payload.folder.unique_id + getters.sorting.URI

    //hiCreo
    if (payload.type) url += '&type=' + payload.type
      //console.log("?? ~ file: fileBrowser.js ~ line 47 ~ url", url)
      //end hiCreo

    url += '&start=' + payload.start
    url += '&count=' + getters.screenItemCnt
    axios
      .get(getters.api + url)
      .then(response => {
        commit('ADD_STATE', response.data)
        commit('SORT_DATA')
        commit('INCREASE_FOLDER_CNT', response.data.length)
        let folderContentCnt = getters.getFolderContentCnt
        if (response.data.length !== 0) {
          // dispatch('getNextFolder', [{ folder: payload.folder, start: folderContentCnt }])
        } else {
          // commit('RESET_FOLDER_CNT')
        }
        setTimeout(function() {
          commit('SET_BUSY', false)
        }, 500)
      })
      .catch(error => {
        //console.log("?? ~ file: fileBrowser.js ~ line 62 ~ error", error)

        // Redirect if unauthenticated
        if ([401, 403].includes(error.response.status)) {

          commit('SET_AUTHORIZED', false)
          router.push({ name: 'SignIn' })

        } else {

          // Show error message
          events.$emit('alert:open', {
            title: i18n.t('popup_error.title'),
            message: i18n.t('popup_error.message'),
          })
        }
      })
  },
  getLatest: ({ commit, getters }) => {
    commit('LOADING_STATE', { loading: true, data: [] })

    commit('STORE_PREVIOUS_FOLDER', getters.currentFolder)
    commit('STORE_CURRENT_FOLDER', {
      name: i18n.t('sidebar.latest'),
      unique_id: undefined,
      location: 'latest',
    })

    axios
      .get(getters.api + '/latest')
      .then(response => {
        commit('LOADING_STATE', { loading: false, data: response.data })
        events.$emit('scrollTop')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  getShared: ({ commit, getters }) => {
    commit('LOADING_STATE', { loading: true, data: [] })
    commit('FLUSH_FOLDER_HISTORY')


    let currentFolder = {
      name: i18n.t('sidebar.my_shared'),
      location: 'shared',
      unique_id: undefined,
    }

    commit('STORE_CURRENT_FOLDER', currentFolder)

    axios
      .get(getters.api + '/shared-all' + getters.sorting.URI)
      .then(response => {
        commit('LOADING_STATE', { loading: false, data: response.data })
        commit('STORE_PREVIOUS_FOLDER', currentFolder)

        events.$emit('scrollTop')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  getParticipantUploads: ({ commit, getters }) => {
    commit('LOADING_STATE', { loading: true, data: [] })

    commit('STORE_PREVIOUS_FOLDER', getters.currentFolder)
    commit('STORE_CURRENT_FOLDER', {
      name: i18n.t('sidebar.participant_uploads'),
      unique_id: undefined,
      location: 'participant_uploads',
    })

    axios
      .get(getters.api + '/participant-uploads' + getters.sorting.URI)
      .then(response => {
        commit('LOADING_STATE', { loading: false, data: response.data })

        events.$emit('scrollTop')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  getTrash: ({ commit, getters }, initLoading) => {
    if (initLoading === undefined || initLoading === false) {
      commit('LOADING_STATE', { loading: true, data: [] })
      commit('FLUSH_FOLDER_HISTORY')
    }
    let trash = {
      name: i18n.t('locations.trash'),
      unique_id: undefined,
      location: 'trash-root',
    }
    if (initLoading === undefined || initLoading === false)
      commit('STORE_CURRENT_FOLDER', trash)

    axios
      .get(getters.api + '/trash' + getters.sorting.URI)
      .then(response => {
        console.log('RESET_TRASH_CNT on getTrash: ', response.data.length)
        commit('RESET_TRASH_CNT', response.data.length)
        if (initLoading === undefined || initLoading === false) {
          commit('LOADING_STATE', { loading: false, data: response.data })
          commit('STORE_PREVIOUS_FOLDER', trash)
          events.$emit('scrollTop')
        }

      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  getSearchResult: ({ commit, getters }, query) => {
    commit('LOADING_STATE', { loading: true, data: [] })
    commit('CHANGE_SEARCHING_STATE', true)

    // Get route
    let route = undefined

    if (getters.sharedDetail && getters.sharedDetail.protected)
      route = '/api/search/private'
    else if (getters.sharedDetail && !getters.sharedDetail.protected)
      route = '/api/search/public/' + router.currentRoute.params.token
    else
      route = '/api/search'

    axios
      .get(route, {
        params: { query: query }
      })
      .then(response => {
        console.log(response.data)
        commit('LOADING_STATE', { loading: false, data: response.data })
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  getFolderTree: ({ commit, getters }) => {

    return new Promise((resolve, reject) => {

      // Get route
      let route = undefined

      if (getters.sharedDetail && getters.sharedDetail.protected)
        route = '/api/navigation/private'
      else if (getters.sharedDetail && !getters.sharedDetail.protected)
        route = '/api/navigation/public/' + router.currentRoute.params.token
      else
        route = '/api/navigation'

      axios
        .get(route + getters.sorting.URI)
        .then(response => {
          resolve(response)

          commit('UPDATE_FOLDER_TREE', response.data)
        })
        .catch((error) => {
          reject(error)

          Vue.prototype.$isSomethingWrong()
        })
    })
  },
}

const mutations = {
  UPDATE_FOLDER_TREE(state, tree) {
    state.navigation = tree
  },
  LOADING_STATE(state, payload) {
    state.fileInfoDetail = []
    state.data = payload.data
    state.status['IS_SHOW_PREVIEW'] = false
    state.status['IS_SHOW_CONTEXT'] = false
    state.status['IS_SHOW_CONFIRM_DELETE'] = false
    state.status['sidebar'] = false
      // state.data.forEach(item => item.selected = false)
    state.isLoading = payload.loading
    state.changedData = true
  },
  SET_CHANGE_STATE(state, new_state) {
    state.changedData = new_state
  },
  SET_BUSY(state, busy) {
    state.busy = busy
  },
  SET_SCREEN_CNT(state, new_cnt) {
    state.screenItemCnt = new_cnt
  },
  RESET_FOLDER_CNT(state) {
    state.folderContentCnt = 0
  },
  INCREASE_FOLDER_CNT(state, cnt) {
    state.folderContentCnt = state.folderContentCnt + cnt
  },
  ADD_STATE(state, data) {

    var _data = [...state.data, ...data]
    state.data = Object.freeze(_data)

    // state.data = [...state.data, ...data]
  },
  SET_TRASH_CNT(state, diff) {
    state.trashItemCnt = state.trashItemCnt + diff
  },
  RESET_TRASH_CNT(state, trashItemCnt) {
    state.trashItemCnt = trashItemCnt
  },
  CLEAR_TRASH_CNT(state) {
    state.trashItemCnt = 0
  },
  FLUSH_FOLDER_HISTORY(state) {
    state.browseHistory = []
  },
  FLUSH_SHARED(state, unique_id) {
    state.data.find(item => {
      if (item.unique_id == unique_id) item.shared = undefined
    })
  },
  STORE_COPY_CUT_ITEM(state) {
    state.clipBoard = []
    if (state.fileInfoDetail) {
      state.fileInfoDetail.forEach((data) => {
        state.clipBoard.push(data)
      })
    }
    //David 20211119
    //state.fileInfoDetail = []
  },

  CLEAR_CLIPBOARD(state) {
    state.clipBoard = []
  },
  SET_COPY_CUT_STATE(state, bcut) {
    state.copyOrCutInfo = bcut
  },

  STORE_PREVIOUS_FOLDER(state, folder) {
    state.browseHistory.push(folder)
  },
  REMOVE_BROWSER_HISTORY(state) {
    state.browseHistory.pop()
  },
  SORT_DATA(state) {
    function compare_name_asc(a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    }

    function compare_name_desc(a, b) {
      return b.name.toLowerCase().localeCompare(a.name.toLowerCase())
    }

    function compare_date_asc(a, b) {
      if (Date.parse(a.created_at) < Date.parse(b.created_at))
        return -1;
      if (Date.parse(a.created_at) > Date.parse(b.created_at))
        return 1;
      return 0;
    }

    function compare_date_desc(a, b) {
      if (Date.parse(a.created_at) < Date.parse(b.created_at))
        return 1;
      if (Date.parse(a.created_at) > Date.parse(b.created_at))
        return -1;
      return 0;
    }

    let field = 'name'
    let sort = 'ASC'
    if (JSON.parse(localStorage.getItem('sorting')) !== null) {
      field = JSON.parse(localStorage.getItem('sorting')).field
      sort = JSON.parse(localStorage.getItem('sorting')).sort
    }


    var folders = state.data.filter(item => item.type === 'folder')
    var files = state.data.filter(item => item.type !== 'folder')
    if (field === 'name') {
      if (sort === 'DESC') {
        folders.sort(compare_name_desc)
        files.sort(compare_name_desc)
      } else if (sort === 'ASC') {
        folders.sort(compare_name_asc)
        files.sort(compare_name_asc)
      }
    } else {
      if (sort === 'DESC') {
        folders.sort(compare_date_desc)
        files.sort(compare_date_desc)
      } else if (sort === 'ASC') {
        folders.sort(compare_date_asc)
        files.sort(compare_date_asc)
      }

    }
    state.data = []
    state.data = state.data.concat(folders)
    state.data = state.data.concat(files)
  },


  CHANGE_ITEM_NAME(state, updatedFile) {
    // Rename filename in file info detail
    if (state.fileInfoDetail && state.fileInfoDetail.unique_id == updatedFile.unique_id) {
      state.fileInfoDetail = updatedFile
    }


    // Rename item name in data view
    state.data.find(item => {
        if (item.unique_id == updatedFile.unique_id) {
          item.name = updatedFile.name
          item.icon_color = updatedFile.icon_color ? updatedFile.icon_color : null
          item.icon_emoji = updatedFile.icon_emoji ? updatedFile.icon_emoji : null
        }
      })
      // this.SORT_DATA(state)
  },
  REMOVE_ITEM_FILEINFO_DETAIL(state, item) {
    state.fileInfoDetail = state.fileInfoDetail.filter(element => element.unique_id !== item.unique_id)
  },
  CLEAR_FILEINFO_DETAIL(state) {
    state.fileInfoDetail = []
  },
  CLEAR_FILEINFO_PREV(state) {
    state.fileInfoPreview = []
  },

  SET_FILEINFO_PREV(state, item) {
    state.fileInfoPreview.push(item)
  },

  SET_ITEM_TO_MOVE(state, item) {
    state.curclickedItem = item
  },

  CLEAR_ITEM_MOVED(state) {
    state.curclickedItem = undefined
  },

  LOAD_FILEINFO_DETAIL(state, item) {
    state.fileInfoDetail = []
    state.fileInfoDetail.push(item)
  },
  GET_FILEINFO_DETAIL(state, item) {
    let checkData = state.data.find(el => el.unique_id == item.unique_id)
    if (state.fileInfoDetail.includes(checkData)) return

    state.fileInfoDetail.push(item ? item : state.currentFolder)
      //hiCreo
      // const _data = { type: checkData.type, id: checkData.id, name: checkData.name };
      // hiCreoEventHandler({type:'sender', action:'saveToLibrary.selectedItem', data: _data})
  },
  SET_FOCUS_NAME_ID(state, id) {
    state.focusNameID = id
  },
  SET_FOCUS_NAMETAG(state, focus) {
    state.focusOnName = focus
  },
  SET_FOCUS_NAME_TEXT(state, text) {
    state.focusText = text
  },
  SELECT_ALL_FILES(state) {
    state.fileInfoDetail = state.data
  },
  CHANGE_SEARCHING_STATE(state, searchState) {
    state.isSearching = searchState
  },
  UPDATE_SHARED_ITEM(state, data) {
    state.data.find(item => {
      if (item.unique_id == data.item_id) item.shared = data
    })
  },
  ADD_NEW_FOLDER(state, folder) {
    // state.data.unshift(folder)
    var _data = [...state.data, ...[folder]]
    state.data = Object.freeze(_data)
  },
  ADD_NEW_ITEMS(state, items) {
    state.data = state.data.concat(items)
  },
  REMOVE_ITEM(state, unique_id) {
    state.data = state.data.filter(el => el.unique_id !== unique_id)
  },
  INCREASE_FOLDER_ITEM(state, unique_id) {
    state.data.map(el => {
      if (el.unique_id && el.unique_id == unique_id) el.items++
    })
  },
  DECREASE_FOLDER_ITEM(state, unique_id) {
    state.data.map(el => {
      if (el.unique_id && el.unique_id == unique_id) el.items--
    })
  },
  STORE_CURRENT_FOLDER(state, folder) {
    state.currentFolder = folder
    
    //hiCreo
    const _data = {type: folder.type, id: folder.unique_id, name: folder.namey}
    hiCreoEventHandler({type:'sender', action:'saveToLibrary.selectedItem', data: _data})
  },
  hiCreo_CLICK_ITEM(state, folder) {
    state.currentFolder = folder
  },
  hiCreo_UpdateStorageUsage(state, folder) {
    //hiCreo
    hiCreoEventHandler({type:'sender', action:'UpdateStorageUsage'})
  },
}

const getters = {
  fileInfoDetail: state => state.fileInfoDetail,
  fileInfoPreview: state => state.fileInfoPreview,
  curclickedItem: state => state.curclickedItem,
  selectedItems: state => state.selectedItems,
  clipBoard: state => state.clipBoard,
  copyOrCutInfo: state => state.copyOrCutInfo,
  currentFolder: state => state.currentFolder,
  browseHistory: state => state.browseHistory,
  isSearching: state => state.isSearching,
  navigation: state => state.navigation,
  isLoading: state => state.isLoading,
  focusNameID: state => state.focusNameID,
  focusOnName: state => state.focusOnName,
  focusText: state => state.focusText,
  data: state => state.data,
  status: state => state.status,
  changedData: state => state.changedData,
  trashItemCnt: state => state.trashItemCnt,
  folderContentCnt: state => state.folderContentCnt,
  getFolderContentCnt(state) {
    return state.folderContentCnt
  },
  busy: state => state.busy,
  screenItemCnt: state => state.screenItemCnt,
}

export default {
  state: defaultState,
  getters,
  actions,
  mutations
}