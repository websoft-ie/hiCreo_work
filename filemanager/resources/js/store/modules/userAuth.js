import axios from 'axios'
import { events } from '@/bus'
import i18n from '@/i18n/index.js'
import router from '@/router'
import Vue from 'vue'

const defaultState = {
  authorized: undefined,
  permission: 'master', // master | editor | visitor
  user: undefined,
  treefolders: [],
}

const actions = {
  getAppData: ({ commit, getters }) => {

    return new Promise((resolve, reject) => {
      axios
        .get(getters.api + '/user' + getters.sorting.URI)
        .then((response) => {
          resolve(response)

          // Redirect user if is logged
          if (router.currentRoute.name === 'SignIn')
            router.push({ name: 'Files' })

          commit('RETRIEVE_USER', response.data)
          commit('SORT_TREEMENU_FOLDERS')
        }).catch((error) => {
          reject(error)

          // Redirect if unauthenticated
          if ([401, 403].includes(error.response.status)) {

            commit('SET_AUTHORIZED', false)
              //router.push({name: 'SignIn'})
          }
        })
    })
  },
  logOut: ({ getters, commit }) => {

    let popup = setTimeout(() => {
      commit('PROCESSING_POPUP', {
        title: 'Logging Out',
        message: 'Wait a second...',
      })
    }, 300)

    axios
      .get(getters.api + '/logout')
      .then(() => {
        clearTimeout(popup)
        commit('DESTROY_DATA')

        router.push({ name: 'SignIn' })
      })
  },
  addToFavourites: (context, folder) => {
    let addFavourites = []
    let items = [folder]

    // If dont coming single folder get folders to add to favourites from fileInfoDetail
    if (!folder)
      items = context.getters.fileInfoDetail

    items.forEach((data) => {
      if (data.type === 'folder') {

        if (context.getters.user.relationships.favourites.data.attributes.folders.find(folder => folder.unique_id === data.unique_id)) return

        addFavourites.push({
          'unique_id': data.unique_id
        })
      }
    })

    // If dont coming single folder clear the selected folders in fileInfoDetail
    if (!folder) {
      context.commit('CLEAR_FILEINFO_DETAIL')
    }

    let pushToFavorites = []

    // Check is favorites already don't include some of pushed folders
    items.map(data => {
      if (!context.getters.user.relationships.favourites.data.attributes.folders.find(folder => folder.unique_id === data.unique_id)) {
        pushToFavorites.push(data)
      }
    })

    // Add to storage
    context.commit('ADD_TO_FAVOURITES', pushToFavorites)

    axios
      .post(context.getters.api + '/folders/favourites', {
        folders: addFavourites
      })
      .catch(() => {
        Vue.prototype.$isSomethingWrong()
      })
  },
  removeFromFavourites: ({ commit, getters, dispatch }, folder) => {

    // Remove from storage
    commit('REMOVE_ITEM_FROM_FAVOURITES', folder)

    axios
      .post(getters.api + '/folders/favourites/' + folder.unique_id, {
        _method: 'delete'
      })
      .catch(() => {
        Vue.prototype.$isSomethingWrong()
      })
  },
}

const mutations = {

  SORT_TREEMENU_FOLDERS(state) {
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

    function loopFunc(subfolders) {
      if (field === 'name') {
        if (sort === 'DESC') {
          subfolders.sort(compare_name_desc)
        } else if (sort === 'ASC') {
          subfolders.sort(compare_name_asc)
        }
      } else {
        if (sort === 'DESC') {
          subfolders.sort(compare_date_desc)
        } else if (sort === 'ASC') {
          subfolders.sort(compare_date_asc)
        }
      }
      for (let i = 0; i < subfolders.length; i++) {
        loopFunc(subfolders[i].folders)
      }
    }
    let folders = [...state.user.relationships.tree.data.attributes.folders]
    loopFunc(folders)

    state.user.relationships.tree.data.attributes.folders = [...folders]
  },
  RETRIEVE_USER(state, user) {
    state.user = user
    state.treefolders = []
    var root = [...user.relationships.tree.data.attributes.folders]
    while (root.length > 0) {
      var node = root.pop()
      state.treefolders.push(node)
      if (node.folders.length > 0) {
        node.folders.forEach(item => {
          root.push(item)
        })
      }
    }

  },
  SET_PERMISSION(state, role) {
    state.permission = role
  },
  DESTROY_DATA(state) {
    state.authorized = false
    state.app = undefined
  },
  ADD_TO_FAVOURITES(state, folder) {
    folder.forEach(item => {
      state.user.relationships.favourites.data.attributes.folders.push({
        unique_id: item.unique_id,
        name: item.name,
        type: item.type,
      })
    })
  },
  UPDATE_NAME(state, name) {
    state.user.data.attributes.name = name
  },
  UPDATE_AVATAR(state, avatar) {
    state.user.data.attributes.avatar = avatar
  },
  REMOVE_ITEM_FROM_FAVOURITES(state, item) {
    state.user.relationships.favourites.data.attributes.folders = state.user.relationships.favourites.data.attributes.folders.filter(folder => folder.unique_id !== item.unique_id)
  },
  UPDATE_NAME_IN_FAVOURITES(state, data) {
    state.user.relationships.favourites.data.attributes.folders.find(folder => {
      if (folder.unique_id == data.unique_id) folder.name = data.name
    })
  }
}

const getters = {
  permission: state => state.permission,
  isGuest: state => !state.authorized,
  isLogged: state => state.authorized,
  user: state => state.user,
  treefolders: state => state.treefolders,
}

export default {
  state: defaultState,
  getters,
  actions,
  mutations
}