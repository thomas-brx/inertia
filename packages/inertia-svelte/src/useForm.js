import { Inertia } from '@inertiajs/inertia'
import { writable } from 'svelte/store'
import useRemember from './useRemember'

function useForm(data = {}, key) {
  const defaults = data
  let recentlySuccessfulTimeoutId = null
  let transform = data => data

  const store = writable({
    ...data,
    errors: {},
    hasErrors: false,
    progress: null,
    wasSuccessful: false,
    recentlySuccessful: false,
    processing: false,
    setStore(key, value) {
      store.update(store => {
        return Object.assign({}, store, typeof key === 'string' ? {[key]: value} : key)
      })
    },
    data() {
      return Object
        .keys(data)
        .reduce((carry, key) => {
          carry[key] = this[key]
          return carry
        }, {})
    },
    transform(callback) {
      transform = callback

      return this
    },
    reset(...fields) {
      if (fields.length === 0) {
        this.setStore(defaults)
      } else {
        this.setStore(Object
          .keys(defaults)
          .filter(key => fields.includes(key))
          .reduce((carry, key) => {
            carry[key] = defaults[key]
            return carry
          }, {}),
        )
      }

      return this
    },
    clearErrors(...fields) {
      const errors = Object
        .keys(this.errors)
        .reduce((carry, field) => ({
          ...carry,
          ...(fields.length > 0 && !fields.includes(field) ? { [field] : this.errors[field] } : {}),
        }), {})

      this.setStore('errors', errors)
      this.setStore('hasErrors', Object.keys(errors).length > 0)

      return this
    },
    submit(method, url, options = {}) {
      const data = transform(this.data())
      const _options = {
        ...options,
        onBefore: visit => {
          this.setStore('wasSuccessful', false)
          this.setStore('recentlySuccessful', false)
          clearTimeout(recentlySuccessfulTimeoutId)

          if (options.onBefore) {
            return options.onBefore(visit)
          }
        },
        onStart: visit => {
          this.setStore('processing', true)

          if (options.onStart) {
            return options.onStart(visit)
          }
        },
        onProgress: event => {
          this.setStore('progress', event)

          if (options.onProgress) {
            return options.onProgress(event)
          }
        },
        onSuccess: page => {
          this.clearErrors()
          this.setStore('wasSuccessful', true)
          this.setStore('recentlySuccessful', true)
          recentlySuccessfulTimeoutId = setTimeout(() => this.setStore('recentlySuccessful', false), 2000)

          if (options.onSuccess) {
            return options.onSuccess(page)
          }
        },
        onError: errors => {
          this.setStore('errors', errors)
          this.setStore('hasErrors', true)

          if (options.onError) {
            return options.onError(errors)
          }
        },
        onFinish: () => {
          this.setStore('processing', false)
          this.setStore('progress', null)

          if (options.onFinish) {
            return options.onFinish()
          }
        },
      }

      if (method === 'delete') {
        Inertia.delete(url, { ..._options, data  })
      } else {
        Inertia[method](url, data, _options)
      }
    },
    get(url, options) {
      this.submit('get', url, options)
    },
    post(url, options) {
      this.submit('post', url, options)
    },
    put(url, options) {
      this.submit('put', url, options)
    },
    patch(url, options) {
      this.submit('patch', url, options)
    },
    delete(url, options) {
      this.submit('delete', url, options)
    },
  })

  let remember = useRemember(data, key || 'form')
  remember.subscribe(remembered => store.update(store => Object.assign({}, store, remembered)))()
  store.subscribe(form => remember.update(store => ({ ...form.data(), errors: form.errors })))

  return store
}

export default useForm