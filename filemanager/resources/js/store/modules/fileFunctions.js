import i18n from '@/i18n/index'
import router from '@/router'
import { events } from '@/bus'
import { last } from 'lodash'
import axios from 'axios'
import Vue from 'vue'
import store from '../index'

const defaultState = {
  processingPopup: undefined,
  fileQueue: [],
  copyItemQueue: [],
  itemsInCopyQueueTotal: 0,
  filesInQueueTotal: 0,
  filesInQueueUploaded: 0,

  isProcessingFile: false,
  uploadingProgress: 0
}

const actions = {
  downloadFolder: ({ commit, getters }, folder) => {

    commit('PROCESSING_POPUP', {
      title: i18n.t('popup_zipping.title'),
      message: i18n.t('popup_zipping.message')
    })

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/zip-folder/' + folder.unique_id + '/public/' + router.currentRoute.params.token :
      '/api/zip-folder/' + folder.unique_id

    axios.get(route)
      .then(response => {
        Vue.prototype.$downloadFile(response.data.url, response.data.name)
      })
      .catch(() => {
        Vue.prototype.$isSomethingWrong()
      })
      .finally(() => {
        commit('PROCESSING_POPUP', undefined)
      })

  },
  downloadFiles: ({ commit, getters }) => {
    let files = []

    // get unique_ids of selected files
    getters.fileInfoDetail.forEach(file => files.push(file.unique_id))

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/zip/public/' + router.currentRoute.params.token :
      '/api/zip'

    commit('PROCESSING_POPUP', {
      title: i18n.t('popup_zipping.title'),
      message: i18n.t('popup_zipping.message'),
    })

    axios.post(route, {
        files: files
      })
      .then(response => {
        Vue.prototype.$downloadFile(response.data.url, response.data.name)
      })
      .catch(() => {
        Vue.prototype.$isSomethingWrong()
      })
      .finally(() => {
        commit('PROCESSING_POPUP', undefined)
      })
  },
  copyItem: ({ commit, getters, dispatch }, { to_id }) => {
    function getParents(item) {
      var parents = [item]
      let parent = getters.treefolders.filter(element => element.unique_id === item.parent_id)
      if (parent.length > 0) {
        parents.push(parent[0])
        while (parent[0].parent_id !== 0) {
          parent = getters.treefolders.filter(element => element.unique_id === parent[0].parent_id)
          if (parent.length > 0) parents.push(parent[0])
        }
      }
      return parents
    }

    for (let idx = 0; idx < getters.clipBoard.length; idx++) {
      var parents = getParents(getters.clipBoard[idx])
      if (parents.length > 0) {
        var found = parents.filter(item => item.unique_id === to_id)
        if (found.length > 0) {
          events.$emit('alert:open', {
            title: i18n.t('popup_error.title'),
            message: 'Can not paste to the subfolder'
          })
          return
        }
      }
    }
    //hiCreo
    hiCreoEventHandler({type:'callback', action:'check_user_storage_capacity',
      callback: () => {
        let itemsToMove = []

        getters.clipBoard.forEach(data => itemsToMove.push({
          'force_delete': data.deleted_at ? true : false,
          'unique_id': data.unique_id,
          'parent_id': data.type === 'folder' ? data.parent_id : data.folder_id,
          'type': data.type
        }))

    // Remove file preview
    commit('CLEAR_FILEINFO_DETAIL')
      // commit('CLEAR_CLIPBOARD')

        commit('PROCESSING_POPUP', {
          title: "Copying now...",
          message: ""
        })

        // Get route
        let route = getters.sharedDetail && !getters.sharedDetail.protected ?
          '/api/copy/public/' + router.currentRoute.params.token :
          '/api/copy'

        axios
          .post(route, {
            _method: 'post',
            to_unique_id: to_id,
            items: itemsToMove
          })
          .then(response => {
            for (let idx = 0; idx < response.data.length; idx++) {
              if (response.data[idx].type === 'folder' && getters.currentFolder.unique_id === response.data[idx].parent_id) {
                commit('ADD_NEW_FOLDER', response.data[idx])
              } else if (response.data[idx].type !== 'folder')
                commit('ADD_NEW_ITEMS', response.data[idx])

            }
            itemsToMove.forEach(item => {
              // commit('REMOVE_ITEM', item.unique_id)
              commit('INCREASE_FOLDER_ITEM', to_id)

              if (item.type === 'folder')
                dispatch('getAppData')
              if (getters.currentFolder.location === 'public')
                dispatch('getFolderTree')
            })
            commit('SORT_DATA')
          // commit('SET_COPY_CUT_STATE', false)
          // commit('CLEAR_CLIPBOARD')
            commit('hiCreo_UpdateStorageUsage')
          })
          .catch(() => Vue.prototype.$isSomethingWrong())
          .finally(() => {
            commit('PROCESSING_POPUP', undefined)
          })
      }
    })
  },
  cutItem: ({ commit, getters, dispatch }, { to_id }) => {

    let itemsToMove = []
    let items = getters.clipBoard

    items.forEach(data => itemsToMove.push({
      'force_delete': data.deleted_at ? true : false,
      'unique_id': data.unique_id,
      'parent_id': data.type === 'folder' ? data.parent_id : data.folder_id,
      'type': data.type
    }))

    // Remove file preview
    commit('CLEAR_FILEINFO_DETAIL')
    commit('CLEAR_CLIPBOARD')

    commit('PROCESSING_POPUP', {
      title: "Copying now...",
      message: ""
    })

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/move/public/' + router.currentRoute.params.token :
      '/api/move'

    axios
      .post(route, {
        _method: 'post',
        to_unique_id: to_id,
        items: itemsToMove
      })
      .then(response => {
        itemsToMove.forEach(item => {
          if (item.parent_id !== getters.currentFolder.unique_id)
            commit('REMOVE_ITEM', item.unique_id)
          commit('INCREASE_FOLDER_ITEM', to_id)
          commit('DECREASE_FOLDER_ITEM', item.parent_id)
          if (item.type === 'folder')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
        })
        if (itemsToMove[0].parent_id !== getters.currentFolder.unique_id) {
          for (let idx = 0; idx < response.data.length; idx++) {
            if (response.data[idx].type === 'folder') {
              commit('ADD_NEW_FOLDER', response.data[idx])
            } else {
              commit('ADD_NEW_ITEMS', response.data[idx])
            }
          }
        }
        commit('SORT_DATA')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
      .finally(() => {
        commit('PROCESSING_POPUP', undefined)
      })
  },

  testapi: ({ commit, getters }, { id }) => {
    let route = '/api/mytest'
    axios
      .post(route, {
        _method: 'post',
        to_unique_id: id
      })
      .then((res) => {
        alert(res)
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },

  moveItem: ({ commit, getters, dispatch }, { to_id, noSelectedItem }) => {

    let itemsToMove = []
    let items = [noSelectedItem]

    // If coming no selected item dont get items to move from fileInfoDetail
    if (!noSelectedItem)
      items = getters.fileInfoDetail

    items.forEach(data => itemsToMove.push({
      'force_delete': data.deleted_at ? true : false,
      'unique_id': data.unique_id,
      'parent_id': data.type === 'folder' ? parseInt(data.parent_id) : parseInt(data.folder_id),
      'type': data.type
    }))

    // Remove file preview
    if (!noSelectedItem)
      commit('CLEAR_FILEINFO_DETAIL')

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/move/public/' + router.currentRoute.params.token :
      '/api/move'

    axios
      .post(route, {
        _method: 'post',
        to_unique_id: to_id,
        items: itemsToMove
      })
      .then((response) => {
        itemsToMove.forEach(item => {
          commit('REMOVE_ITEM', item.unique_id)
          commit('INCREASE_FOLDER_ITEM', to_id)

          if (item.type === 'folder')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
        })
        if (to_id === getters.currentFolder.unique_id) {
          for (let idx = 0; idx < response.data.length; idx++) {
            if (response.data[idx].type === 'folder') {
              commit('ADD_NEW_FOLDER', response.data[idx])
            }
          }
        }
        commit('SORT_DATA')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  createFolder: ({ commit, getters, dispatch }, folderName) => {

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/create-folder/public/' + router.currentRoute.params.token :
      '/api/create-folder'


    // let parent_id = (getters.data['sidebar']) ? getters.currentFolder.unique_id : getters.data['focusFolderID']
    let parent_id = getters.status['focusedParentFolderIndex']
      // alert(getters.status['focusedParentFolderIndex'])
    axios
      .post(route, {
        parent_id: parent_id,
        name: folderName
      })
      .then(response => {
        commit('ADD_NEW_FOLDER', response.data)

        events.$emit('scrollTop')
        commit('SORT_DATA')
        if (parent_id === getters.currentFolder.unique_id) {
          //Set focus on new folder name
          setTimeout(() => {
            commit('GET_FILEINFO_DETAIL', response.data)
            //events.$emit('newFolder:focus', response.data.unique_id)
          }, 10)

          if (getters.currentFolder.location !== 'public')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
        } else {
          if (parent_id === 0)
            dispatch('getFolder', [{ folder: getters.data[0], back: false, init: false }])
          else
            dispatch('getFolder', [{ folder: getters.data['focusedNodes'], back: false, init: false }])
          dispatch('getAppData')
        }


      })
      .catch((ex) => {
        Vue.prototype.$isSomethingWrong()
      })
  },
  renameItem: ({ commit, getters, dispatch }, data) => {

    // Updated name in favourites panel
    if (getters.permission === 'master' && data.type === 'folder')
      commit('UPDATE_NAME_IN_FAVOURITES', data)

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/rename-item/' + data.unique_id + '/public/' + router.currentRoute.params.token :
      '/api/rename-item/' + data.unique_id

    axios
      .post(route, {
        name: data.name,
        type: data.type,
        folder_icon: data.folder_icon,
        _method: 'patch'
      })
      .then(response => {
        commit('CHANGE_ITEM_NAME', response.data)
        commit('SORT_DATA')
        if (data.type === 'folder' && getters.currentFolder.location !== 'public')
          dispatch('getAppData')
        if (data.type === 'folder' && getters.currentFolder.location === 'public')
          dispatch('getFolderTree')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },

  copyItem_1: ({ commit, getters, dispatch }, { data, to_id }) => {
    return new Promise((resolve, reject) => {
      // Get route
      let route = getters.sharedDetail && !getters.sharedDetail.protected ?
        '/api/copy/public/' + router.currentRoute.params.token :
        '/api/copy'

      axios
        .post(route, {
          _method: 'post',
          to_unique_id: to_id,
          items: [data]
        })
        .then(response => {
          resolve(response)
          commit('SHIFT_FROM_COPYQUEUE')

          for (let idx = 0; idx < response.data.length; idx++) {
            if (response.data[idx].type === 'folder' && getters.currentFolder.unique_id === response.data[idx].parent_id) {
              commit('ADD_NEW_FOLDER', response.data[idx])
            } else if (response.data[idx].type !== 'folder')
              commit('ADD_NEW_ITEMS', response.data[idx])

          }

          commit('INCREASE_FOLDER_ITEM', to_id)

          if (data.type === 'folder')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
          commit('SORT_DATA')
        })
        .catch((error) => {
          console.log(error)
          Vue.prototype.$isSomethingWrong()
        })
    })
    console.log(to_id)
    let itemsToMove = []

    getters.clipBoard.forEach(data => itemsToMove.push({
      'force_delete': data.deleted_at ? true : false,
      'unique_id': data.unique_id,
      'parent_id': data.type === 'folder' ? data.parent_id : data.folder_id,
      'type': data.type
    }))

    // Remove file preview
    commit('CLEAR_FILEINFO_DETAIL')
    commit('CLEAR_CLIPBOARD')

    console.log(to_id)
    console.log(itemsToMove)
    console.log(getters.clipBoard)

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/copy/public/' + router.currentRoute.params.token :
      '/api/copy'

    axios
      .post(route, {
        _method: 'post',
        to_unique_id: to_id,
        items: itemsToMove
      })
      .then(response => {
        for (let idx = 0; idx < response.data.length; idx++) {
          if (response.data[idx].type === 'folder' && getters.currentFolder.unique_id === response.data[idx].parent_id) {
            commit('ADD_NEW_FOLDER', response.data[idx])
          } else if (response.data[idx].type !== 'folder')
            commit('ADD_NEW_ITEMS', response.data[idx])

        }
        itemsToMove.forEach(item => {
          // commit('REMOVE_ITEM', item.unique_id)
          commit('INCREASE_FOLDER_ITEM', to_id)

          if (item.type === 'folder')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
        })
        commit('SORT_DATA')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())

  },

  uploadFiles: ({ commit, getters, dispatch }, { form, fileSize, totalUploadedSize }) => {
    return new Promise((resolve, reject) => {

      // Get route
      let route = getters.sharedDetail && !getters.sharedDetail.protected ?
        '/api/upload/public/' + router.currentRoute.params.token :
        '/api/upload'

      // Create cancel token for axios cancellation
      const CancelToken = axios.CancelToken,
        source = CancelToken.source()

      axios
        .post(route, form, {
          cancelToken: source.token,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          onUploadProgress: event => {
            var percentCompleted = Math.floor(((totalUploadedSize + event.loaded) / fileSize) * 100)

            commit('UPLOADING_FILE_PROGRESS', percentCompleted >= 100 ? 100 : percentCompleted)

            // Set processing file
            if (percentCompleted >= 100)
              commit('PROCESSING_FILE', true)
          }
        })
        .then(response => {
        console.log("🚀 ~ file: fileFunctions.js ~ line 481 ~ returnnewPromise ~ response", response)
          resolve(response)

          // Proceed if was returned database record
          if (response.data.id) {

            commit('PROCESSING_FILE', false)

            // Remove first file from file queue
            commit('SHIFT_FROM_FILE_QUEUE')

            // Check if user is in uploading folder, if yes, than show new file
            if (response.data.folder_id == getters.currentFolder.unique_id) {

              // Add uploaded item into view
              commit('ADD_NEW_ITEMS', response.data)

              // Reset file progress
              commit('UPLOADING_FILE_PROGRESS', 0)

              // Increase count in files in queue uploaded for 1
              commit('INCREASE_FILES_IN_QUEUE_UPLOADED')
            }

            // Start uploading next file if file queue is not empty
            if (getters.fileQueue.length) {
              Vue.prototype.$handleUploading(getters.fileQueue[0])
            }

            // Reset upload process
            if (!getters.fileQueue.length)
              commit('CLEAR_UPLOAD_PROGRESS')
          }
          commit('SORT_DATA')
          if (getters.currentFolder.location !== 'public')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
          getters.status['IsExternalUploadedToTreeMenu'] = false
        })
        .catch(error => {
        console.log("🚀 ~ file: fileFunctions.js ~ line 521 ~ returnnewPromise ~ error", error)
          reject(error)

          let messages = {
            '423': {
              title: i18n.t('popup_exceed_limit.title'),
              message: i18n.t('popup_exceed_limit.message')
            },
            '415': {
              title: i18n.t('popup_mimetypes_blacklist.title'),
              message: i18n.t('popup_mimetypes_blacklist.message')
            },
            '413': {
              title: i18n.t('popup_paylod_error.title'),
              message: i18n.t('popup_paylod_error.message')
            }
          }

          events.$emit('alert:open', {
            emoji: '😬😬😬',
            title: messages[error.response.status]['title'],
            message: messages[error.response.status]['message']
          })

          commit('PROCESSING_FILE', false)
          commit('CLEAR_UPLOAD_PROGRESS')
        })

      // Cancel the upload request
      events.$on('cancel-upload', () => {
        source.cancel()

        // Hide upload progress bar
        commit('PROCESSING_FILE', false)
        commit('CLEAR_UPLOAD_PROGRESS')
      })
    })
  },
  restoreItem: ({ commit, getters, dispatch }, item) => {

    let itemToRestore = []
    let items = [item]
    let restoreToHome = false

    // If coming no selected item dont get items to restore from fileInfoDetail
    if (!item)
      items = getters.fileInfoDetail

    // Check if file can be restored to home directory
    if (getters.currentFolder.location === 'trash')
      restoreToHome = true

    items.forEach(data => itemToRestore.push({
      'type': data.type,
      'unique_id': data.unique_id
    }))

    // Remove file preview
    commit('CLEAR_FILEINFO_DETAIL')

    axios
      .post(getters.api + '/restore-items', {
        to_home: restoreToHome,
        data: itemToRestore
      })
      .then(() => {
        console.log('SET_TRASH_CNT on restoreItem')
        commit('SET_TRASH_CNT', -items.length)
          // Remove file
        items.forEach(data => {
          commit('REMOVE_ITEM', data.unique_id)
          if (getters.currentFolder.location !== 'public')
            dispatch('getAppData')
          if (getters.currentFolder.location === 'public')
            dispatch('getFolderTree')
        })
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  deleteItem: ({ commit, getters, dispatch }, permanentDelete, noSelectedItem) => {

    let itemsToDelete = []
    let items = [noSelectedItem]

    // If coming no selected item dont get items to move from fileInfoDetail
    if (!noSelectedItem)
      items = getters.fileInfoDetail

    items.forEach(data => {
      itemsToDelete.push({
        'force_delete': data.deleted_at || permanentDelete ? true : false,
        'type': data.type,
        'unique_id': data.unique_id
      })

      // Remove file
      commit('REMOVE_ITEM', data.unique_id)

      // Remove item from sidebar
      if (getters.permission === 'master') {

        if (data.type === 'folder')
          commit('REMOVE_ITEM_FROM_FAVOURITES', data)
      }

      // Remove file
      commit('REMOVE_ITEM', data.unique_id)

      // Remove item from sidebar
      if (getters.permission === 'master') {

        if (data.type === 'folder')
          commit('REMOVE_ITEM_FROM_FAVOURITES', data)
      }
    })

    // Remove file preview
    if (!noSelectedItem) {
      commit('CLEAR_FILEINFO_DETAIL')
    }

    // Get route
    let route = getters.sharedDetail && !getters.sharedDetail.protected ?
      '/api/remove-item/public/' + router.currentRoute.params.token :
      '/api/remove-item'

    axios
      .post(route, {
        _method: 'post',
        data: itemsToDelete
      })
      .then(() => {
        if (!permanentDelete) {
          console.log('SET_TRASH_CNT in deleteItem')
          commit('SET_TRASH_CNT', -itemsToDelete.length)
        }

        itemsToDelete.forEach(data => {

          // If is folder, update app data
          if (data.type === 'folder') {

            if (data.unique_id === getters.currentFolder.unique_id) {

              if (getters.currentFolder.location === 'public') {
                dispatch('browseShared', [{ folder: last(getters.browseHistory), back: true, init: false }])
              } else {
                dispatch('getFolder', [{ folder: last(getters.browseHistory), back: true, init: false }])
              }
            }
          }
        })

        if (getters.currentFolder.location !== 'public')
          dispatch('getAppData')

        if (getters.currentFolder.location === 'public')
          dispatch('getFolderTree')

      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  },
  emptyTrash: ({ commit, getters }) => {

    // Clear file browser
    commit('LOADING_STATE', { loading: true, data: [] })

    axios
      .post(getters.api + '/empty-trash', {
        _method: 'delete'
      })
      .then(() => {
        commit('LOADING_STATE', { loading: false, data: [] })
        commit('CLEAR_TRASH_CNT')
        events.$emit('scrollTop')

        // Remove file preview
        commit('CLEAR_FILEINFO_DETAIL')
      })
      .catch(() => Vue.prototype.$isSomethingWrong())
  }
}

const mutations = {
  ADD_ITEMS_TO_COPYQUEUE(state, items) {
    state.copyItemQueue = items
    state.itemsInCopyQueueTotal = items.length
  },
  SHIFT_FROM_COPYQUEUE(state) {
    state.copyItemQueue.shift()
  },
  PROCESSING_POPUP(state, status) {
    state.processingPopup = status
  },
  ADD_FILES_TO_QUEUE(state, file) {
    state.fileQueue.push(file)
  },
  SHIFT_FROM_FILE_QUEUE(state) {
    state.fileQueue.shift()
  },
  PROCESSING_FILE(state, status) {
    state.isProcessingFile = status
  },
  UPLOADING_FILE_PROGRESS(state, percentage) {
    state.uploadingProgress = percentage
  },
  INCREASE_FILES_IN_QUEUES_TOTAL(state, count) {
    state.filesInQueueTotal += count
  },
  INCREASE_FILES_IN_QUEUE_UPLOADED(state) {
    state.filesInQueueUploaded++
  },
  CLEAR_UPLOAD_PROGRESS(state) {
    state.filesInQueueUploaded = 0
    state.filesInQueueTotal = 0
    state.fileQueue = []
  }
}

const getters = {
  filesInQueueUploaded: state => state.filesInQueueUploaded,
  filesInQueueTotal: state => state.filesInQueueTotal,
  uploadingProgress: state => state.uploadingProgress,
  isProcessingFile: state => state.isProcessingFile,
  processingPopup: state => state.processingPopup,
  fileQueue: state => state.fileQueue,
  itemsInCopyQueueTotal: state => state.itemsInCopyQueueTotal,
  copyItemQueue: state => state.copyItemQueue
}

export default {
  state: defaultState,
  mutations,
  actions,
  getters
}