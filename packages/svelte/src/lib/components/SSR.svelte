<script lang="ts">
  import type { Page } from '@inertiajs/core'
  import App from './App.svelte'

  export let id: string
  export let initialPage: Page
</script>

{@html '<script id="' + id + '-page-data" type="application/json">' + JSON.stringify(initialPage) + '</script>'}

<div data-server-rendered="true" {id}>
  <App />
</div>
