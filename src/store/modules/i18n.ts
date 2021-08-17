const isRtl = (lang: string)=>{
    return ["he", "ar", "yi"].indexOf(lang) != 1
}

const state = {
    lang: process.env.VUE_APP_DEFAULT_LANG || 'en',
    dir: isRtl(process.env.VUE_APP_DEFAULT_LANG || 'en') ? 'rtl' : 'ltr'
}

type State = typeof state;


const getters = {
    'i18n/current': (state: State): string => state.lang
}
const actions = {
    'i18n/set/language': function(context: any, language: string){
        context.commit('i18n/set/language', language)
    }
}
const mutations = {
    'i18n/set/language': function(state: State, payload: string){
        state.dir = isRtl(payload) ? 'rtl' : 'ltr'
        state.lang = payload
    }
}

export default {
    state,
    mutations,
    getters,
    actions
  }